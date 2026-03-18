import { NextResponse } from "next/server";
import { z } from "zod";
import redis from "@/lib/redis";

const StartRaceSchema = z.object({
    raceId: z.string().uuid(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        
        // 1. Receive { "raceId": "..." } from the request body. Basic Zod validation for the raceId input.
        const validation = StartRaceSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: "Invalid raceId format" }, { status: 400 });
        }

        const { raceId } = validation.data;
        const redisKey = `race:${raceId}`;

        // 2. Check if the key race:{raceId} exists in Redis. If not, return 404.
        const exists = await redis.exists(redisKey);
        if (!exists) {
            return NextResponse.json({ error: "Race session not found or expired" }, { status: 404 });
        }

        // 3. Use the Redis HSETNX command (or equivalent ioredis logic) to set the field startTime to the current Unix timestamp (Date.now()).
        // Note: HSETNX is required to ensure that if a user spams this endpoint, the startTime is only set once and never overwritten.
        const startTime = Date.now();
        const wasSet = await redis.hsetnx(redisKey, "startTime", startTime.toString());

        // If it wasn't set, it means it already exists. Fetch the existing one to return it.
        let finalStartTime = startTime;
        if (!wasSet) {
            const existingStartTime = await redis.hget(redisKey, "startTime");
            if (existingStartTime) {
                finalStartTime = parseInt(existingStartTime, 10);
            }
        }

        // 4. Return: 200 OK with { "startTime": ... }.
        return NextResponse.json({ startTime: finalStartTime });
    } catch (error) {
        console.error("Race start error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
