import { NextResponse } from "next/server";
import { LUA_SCRIPTS } from "@/lib/multiplayer/lua";
import { parseRaceData } from "@/lib/multiplayer/parser";
import { getServerTimeMs } from "@/lib/multiplayer/server-time";
import redis from "@/lib/redis";

export const dynamic = "force-dynamic";

const COUNTDOWN_DURATION_MS = 10000;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body.roomId || body.raceId;
    const userId = body.userId;

    if (!id) {
      return NextResponse.json({ error: "Missing roomId or raceId" }, { status: 400 });
    }

    const roomKey = `race:${id}`;
    const nowMs = await getServerTimeMs();

    // 1. Precise Existence Check first
    const exists = await redis.exists(roomKey);
    if (!exists) {
      return NextResponse.json({ error: "Race expired or not found" }, { status: 404 });
    }

    // 2. Fetch data (at this point we know the key exists)
    const raceData = await redis.hgetall(roomKey) as Record<string, string> | null;

    if (!raceData || Object.keys(raceData).length === 0) {
      return NextResponse.json({ error: "Race expired or not found" }, { status: 404 });
    }

    // 3. Branching: Solo vs Multiplayer
    const isMultiplayer = !!(raceData.host_id && raceData.host_id.trim() !== "");

    if (!isMultiplayer) {
      // --- SOLO RACE BRANCH ---
      // Solo races do not require userId and do NOT have a host_id in Redis.
      
      // Idempotent startTime assignment: use existing if it's there
      const finalStartTime = raceData.startTime || nowMs.toString();
      
      if (!raceData.startTime) {
        await redis.hset(roomKey, { startTime: finalStartTime });
      }

      return NextResponse.json({
        raceId: id,
        startTime: parseInt(finalStartTime, 10)
      }, { status: 200 });
    }

    // --- MULTIPLAYER (DUEL) BRANCH ---
    if (!userId) {
      return NextResponse.json({ error: "Missing userId for multiplayer race" }, { status: 400 });
    }

    const targetStartMs = nowMs + COUNTDOWN_DURATION_MS;

    const result = await redis.eval(
      LUA_SCRIPTS.START_RACE,
      [roomKey],
      [userId, targetStartMs.toString()]
    ) as string;

    if (result === 'ERROR_UNAUTHORIZED') {
      return NextResponse.json({ error: "Only the host can start the race" }, { status: 403 });
    }

    if (result === 'ERROR_STATE') {
      return NextResponse.json({ error: "Room is not ready to start" }, { status: 400 });
    }

    // Refresh data after script execution
    const finalRawData = await redis.hgetall(roomKey) as Record<string, string>;
    const parsedData = parseRaceData(finalRawData);

    return NextResponse.json({
      roomId: id,
      room: parsedData
    }, { status: 200 });

  } catch (error) {
    console.error("[Start Race Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
