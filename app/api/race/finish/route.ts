import { NextResponse } from "next/server";
import { z } from "zod";
import redis from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const FinishRaceSchema = z.object({
    raceId: z.string().uuid(),
    totalCharactersInserted: z.number().int().positive(),
});

export async function POST(req: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });

        const body = await req.json();

        // 1. Input Validation (Zod)
        const validation = FinishRaceSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
        }

        const { raceId, totalCharactersInserted } = validation.data;
        const redisKey = `race:${raceId}`;

        // 2. Fetch from Redis
        const raceData = await redis.hgetall(redisKey);
        
        // If it doesn't exist, return 404
        if (!raceData || Object.keys(raceData).length === 0) {
            return NextResponse.json({ error: "Race expired or not found" }, { status: 404 });
        }

        // Validate State: Ensure startTime exists
        if (!raceData.startTime) {
            return NextResponse.json({ error: "Race was never started" }, { status: 400 });
        }

        const startTime = parseInt(raceData.startTime, 10);
        const expectedLength = parseInt(raceData.expectedLength, 10);
        const textId = raceData.textId;

        // 3. Time Calculation
        const endTime = Date.now();
        const durationMs = endTime - startTime;

        // 4. Integrity Check
        if (totalCharactersInserted < expectedLength) {
            return NextResponse.json({ error: "User didn't finish the text" }, { status: 400 });
        }

        if (durationMs < 500) {
            return NextResponse.json({ error: "Impossible speed/Bot detection" }, { status: 400 });
        }

        // 5. Metrics Calculation
        // Accuracy: expectedLength / totalCharactersInserted
        let accuracy = (expectedLength / totalCharactersInserted) * 100;
        // Cap accuracy at 100% just in case
        if (accuracy > 100) accuracy = 100;

        // WPM: ((expectedLength / 5) / (durationMs / 60000))
        const durationMinutes = durationMs / 60000;
        const wordsTyped = expectedLength / 5;
        const wpm = wordsTyped / durationMinutes;

        // 6. Database Transaction (Atomic Persistence)
        const result = await prisma.$transaction(async (tx) => {
            // A. Create RaceResult (Always)
            const newRaceResult = await tx.raceResult.create({
                data: {
                    userId: session?.user?.id || null, // Nullable for guests
                    mode: "solo",
                    wpm: wpm,
                    accuracy: accuracy,
                    duration_seconds: Math.round(durationMs / 1000),
                    text_id: textId,
                }
            });

            // B. Update User Aggregate Stats (If Authenticated)
            if (session?.user?.id) {
                const user = await tx.user.findUnique({
                    where: { id: session.user.id },
                    select: { best_wpm: true }
                });

                if (user) {
                    await tx.user.update({
                        where: { id: session.user.id },
                        data: {
                            total_races: { increment: 1 },
                            // Only update best_wpm if the current race's WPM is higher
                            best_wpm: Math.max(user.best_wpm, wpm)
                        }
                    });
                }
            }

            return newRaceResult;
        });

        const saved = !!result;

        // 7. Cleanup
        await redis.del(redisKey);

        // 8. Response
        return NextResponse.json({
            wpm: wpm,
            accuracy: accuracy,
            durationMs: durationMs,
            saved: saved
        });

    } catch (error) {
        console.error("Race finish error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
