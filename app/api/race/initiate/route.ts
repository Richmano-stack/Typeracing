import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import redis from "@/lib/redis";
import { prisma } from "@/lib/prisma";

export async function POST() {
    try {
        // 1. Fetch a random text from the Prisma texts table (text_passages)
        const textCount = await prisma.textPassage.count();
        if (textCount === 0) {
            return NextResponse.json({ error: "No texts found in database" }, { status: 500 });
        }

        const skip = Math.floor(Math.random() * textCount);
        const randomText = await prisma.textPassage.findFirst({
            skip: skip,
        });

        if (!randomText) {
            return NextResponse.json({ error: "Failed to fetch text" }, { status: 500 });
        }

        // 2. Generate a unique raceId using uuid
        const raceId = uuidv4();

        // 3. Create a Redis Hash with the key race:{raceId}
        const redisKey = `race:${raceId}`;
        
        // 4. Store the following fields in the Hash: textId (string) and expectedLength (integer)
        // Crucial: Do NOT set a startTime yet.
        await redis.hset(redisKey, {
            textId: randomText.id,
            expectedLength: randomText.length,
        });

        // 5. Set a Redis TTL of 1800 seconds (30 minutes) on the key
        await redis.expire(redisKey, 1800);

        // 6. Return: 200 OK with { "raceId": "...", "content": "..." }
        return NextResponse.json({
            raceId: raceId,
            content: randomText.content,
        });
    } catch (error) {
        console.error("Race initiation error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
