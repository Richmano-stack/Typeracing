import { NextResponse } from "next/server";
import { z } from "zod";
import redis from "@/lib/redis";
import { prisma } from "@/lib/prisma";

const FinishRaceSchema = z.object({
    raceId: z.string().uuid(),
    totalCharactersInserted: z.number().int().positive(),
});

export async function POST(req: Request) {
    try {
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

        // 6. Postgres Persistence (Prisma)
        await prisma.raceResult.create({
            data: {
                userId: null, // Null for now
                mode: "solo",
                wpm: wpm,
                accuracy: accuracy,
                // The schema has duration_seconds, prompt asks to save duration_ms, 
                // but we map it into duration_seconds so it satisfies the database constraint.
                duration_seconds: Math.round(durationMs / 1000), 
                text_id: textId,
            }
        });

        // 7. Cleanup
        await redis.del(redisKey);

        // 8. Response
        return NextResponse.json({
            wpm: wpm,
            accuracy: accuracy,
            durationMs: durationMs
        });

    } catch (error) {
        console.error("Race finish error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
