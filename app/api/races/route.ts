import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userId = session.user.id;
        
        // Validate user ID exists and is a string
        if (!userId || typeof userId !== 'string') {
            console.error("[RACES_POST] Invalid user ID in session:", { 
                userId, 
                userIdType: typeof userId,
                hasSession: !!session,
                hasUser: !!session?.user,
                userEmail: session?.user?.email 
            });
            return new NextResponse("Invalid session: user ID not found", { status: 401 });
        }

        // Verify user exists in database before proceeding
        const userExists = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });

        if (!userExists) {
            console.error("[RACES_POST] User ID from session does not exist in database:", { userId });
            return new NextResponse("User not found in database", { status: 401 });
        }

        const body = await req.json();
        const { wpm, accuracy, timeTakenMs, errors, textHash, raceId, raceType } = body;

        if (wpm === undefined || accuracy === undefined || timeTakenMs === undefined || errors === undefined) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const validRaceType = raceType && ['quick', 'solo', 'private'].includes(raceType) ? raceType : 'quick';

        // Log incoming request for debugging
        console.log('[RACES_POST] Received race save request:', {
            userId,
            wpm,
            accuracy,
            timeTakenMs,
            errors,
            textHash: textHash?.substring(0, 30),
            raceId: raceId?.substring(0, 50),
            timestamp: new Date().toISOString(),
        });

        // ============================================================
        // Enhanced Duplicate Prevention
        // ============================================================

        // Strategy 1: Check by raceId (if provided by client)
        if (raceId) {
            const existingRaceById = await prisma.race.findFirst({
                where: {
                    userId,
                    // Note: We don't store raceId in DB, so we check by matching
                    // the components: startTime (from completedAt - timeTakenMs),
                    // endTime (completedAt), and textHash
                    textHash: textHash || "unknown",
                    // Check if a race with same timing exists
                    // We'll use completedAt as a proxy for endTime
                    completedAt: {
                        // Approximate: completedAt should be close to now
                        gte: new Date(Date.now() - 10000), // 10 second window
                    },
                },
                orderBy: {
                    completedAt: 'desc',
                },
            });
            
            if (existingRaceById) {
                // Calculate if this is likely the same race
                const existingTimeDiff = Math.abs(
                    existingRaceById.timeTakenMs - timeTakenMs
                );
                const existingWpmDiff = Math.abs(
                    Number(existingRaceById.wpm) - wpm
                );
                
                // If timing and WPM are very close, it's likely a duplicate
                if (existingTimeDiff < 1000 && existingWpmDiff < 1) {
                    console.log('[RACES_POST] Duplicate race detected by raceId check');
                    return NextResponse.json(existingRaceById);
                }
            }
        }

        // Strategy 2: Time-based duplicate check (existing logic)
        // Check for duplicate race within the last 5 seconds (same user, textHash, and similar timestamp)
        // This prevents duplicate saves from multiple rapid requests
        const fiveSecondsAgo = new Date(Date.now() - 5000);
        const existingRace = await prisma.race.findFirst({
            where: {
                userId,
                textHash: textHash || "unknown",
                completedAt: {
                    gte: fiveSecondsAgo,
                },
            },
            orderBy: {
                completedAt: 'desc',
            },
        });

        // If duplicate found, return the existing race (idempotent behavior)
        if (existingRace) {
            console.log('[RACES_POST] Duplicate race detected by time-based check');
            return NextResponse.json(existingRace);
        }

        // Use a transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch current user stats to ensure user exists and calculate new aggregates
            const user = await tx.user.findUnique({
                where: { id: userId },
                select: {
                    totalRaces: true,
                    avgWpm: true,
                    bestWpm: true,
                    avgAccuracy: true,
                },
            });

            if (!user) {
                console.error("[RACES_POST] User not found in database:", { userId, userIdType: typeof userId });
                throw new Error("User not found");
            }

            // 2. Create the Race record
            const race = await tx.race.create({
                data: {
                    userId,
                    wpm: new Prisma.Decimal(wpm),
                    accuracy: new Prisma.Decimal(accuracy),
                    timeTakenMs,
                    errors,
                    textHash: textHash || "unknown",
                    raceType: validRaceType,
                },
            });

            // 3. Calculate new aggregates
            const newTotalRaces = user.totalRaces + 1;

            // Calculate new average WPM
            // If this is the first race, use the current WPM as average
            // Otherwise: (oldAvg * oldTotal + newVal) / newTotal
            let newAvgWpm: number;
            if (user.totalRaces === 0) {
                newAvgWpm = Number(wpm);
            } else {
                const currentTotalWpm = Number(user.avgWpm) * user.totalRaces;
                newAvgWpm = (currentTotalWpm + Number(wpm)) / newTotalRaces;
            }

            // Calculate new average Accuracy
            let newAvgAccuracy: number;
            if (user.totalRaces === 0) {
                newAvgAccuracy = Number(accuracy);
            } else {
                const currentTotalAccuracy = Number(user.avgAccuracy) * user.totalRaces;
                newAvgAccuracy = (currentTotalAccuracy + Number(accuracy)) / newTotalRaces;
            }

            // Determine best WPM (if this is the first race, use current WPM, otherwise compare)
            const currentBestWpm = user.totalRaces === 0 ? 0 : Number(user.bestWpm);
            const newBestWpm = Math.max(currentBestWpm, Number(wpm));

            // 4. Update User record
            await tx.user.update({
                where: { id: userId },
                data: {
                    totalRaces: newTotalRaces,
                    avgWpm: new Prisma.Decimal(newAvgWpm),
                    avgAccuracy: new Prisma.Decimal(newAvgAccuracy),
                    bestWpm: new Prisma.Decimal(newBestWpm),
                },
            });

            return race;
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error("[RACES_POST]", error);
        if (error instanceof Error && error.message === "User not found") {
            return new NextResponse("User not found", { status: 401 });
        }
        return new NextResponse("Internal Error", { status: 500 });
    }
}
