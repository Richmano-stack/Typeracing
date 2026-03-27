import { NextResponse } from "next/server";
import { getServerTimeMs } from "@/lib/multiplayer/server-time";
import redis from "@/lib/redis";

export const dynamic = "force-dynamic";

/**
 * POST /api/race/start
 * 
 * Specialized endpoint for SOLO races.
 * Sets the authoritative start time idempotently.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const raceId = body.raceId || body.roomId; // Support both for safety

    if (!raceId) {
      return NextResponse.json({ error: "Missing raceId" }, { status: 400 });
    }

    const roomKey = `race:${raceId}`;
    const nowMs = await getServerTimeMs();

    // 1. Existence Check
    const exists = await redis.exists(roomKey);
    if (!exists) {
      return NextResponse.json({ error: "Race expired or not found" }, { status: 404 });
    }

    // 2. Fetch data (at this point we know the key exists)
    const raceData = await redis.hgetall(roomKey) as Record<string, string>;

    // 3. Security: Ensure it's actually a SOLO race (no host_id)
    if (raceData.host_id && raceData.host_id.trim() !== "") {
      return NextResponse.json({ 
        error: "Multiplayer races must use /api/race/multiplayer-start" 
      }, { status: 400 });
    }

    // 4. Idempotent startTime assignment
    let finalStartTime = raceData.startTime;
    
    if (!finalStartTime) {
      finalStartTime = nowMs.toString();
      await redis.hset(roomKey, { startTime: finalStartTime });
    }

    return NextResponse.json({
      raceId,
      startTime: parseInt(finalStartTime, 10)
    }, { status: 200 });

  } catch (error) {
    console.error("[Solo Start Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
