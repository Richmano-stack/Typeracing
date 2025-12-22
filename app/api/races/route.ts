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

        if (raceId) {
            const existingRaceById = await prisma.race.findFirst({
                where: {
                    userId,
                    textHash: textHash || "unknown",
                    completedAt: {
                        gte: new Date(Date.now() - 10000),
                    },
                },
                orderBy: {
                    completedAt: 'desc',
                },
            });
            
            if (existingRaceById) {
                const existingTimeDiff = Math.abs(
                    existingRaceById.timeTakenMs - timeTakenMs
                );
                const existingWpmDiff = Math.abs(
                    Number(existingRaceById.wpm) - wpm
                );
                
                if (existingTimeDiff < 1000 && existingWpmDiff < 1) {
                    return NextResponse.json(existingRaceById);
                }
            }
        }

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

        if (existingRace) {
            return NextResponse.json(existingRace);
        }

        const result = await prisma.$transaction(async (tx) => {
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

            const newTotalRaces = user.totalRaces + 1;

            let newAvgWpm: number;
            if (user.totalRaces === 0) {
                newAvgWpm = Number(wpm);
            } else {
                const currentTotalWpm = Number(user.avgWpm) * user.totalRaces;
                newAvgWpm = (currentTotalWpm + Number(wpm)) / newTotalRaces;
            }

            let newAvgAccuracy: number;
            if (user.totalRaces === 0) {
                newAvgAccuracy = Number(accuracy);
            } else {
                const currentTotalAccuracy = Number(user.avgAccuracy) * user.totalRaces;
                newAvgAccuracy = (currentTotalAccuracy + Number(accuracy)) / newTotalRaces;
            }

            const currentBestWpm = user.totalRaces === 0 ? 0 : Number(user.bestWpm);
            const newBestWpm = Math.max(currentBestWpm, Number(wpm));

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
