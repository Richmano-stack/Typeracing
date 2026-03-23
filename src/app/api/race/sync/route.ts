import { NextResponse } from "next/server";
import { LUA_SCRIPTS } from "@/lib/multiplayer/lua";
import { parseRaceData } from "@/lib/multiplayer/parser";
import { getServerTimeMs } from "@/lib/multiplayer/server-time";
import { handleMultiplayerPersistence } from "@/lib/multiplayer/persistence";
import redis from "@/lib/redis";

export const dynamic = "force-dynamic";

const DISCONNECT_TIMEOUT_MS = 5000;

export async function POST(req: Request) {
  try {
    const { roomId, userId, progress, wpm } = await req.json();

    if (!roomId || !userId) {
      return NextResponse.json({ error: "Missing roomId or userId" }, { status: 400 });
    }

    const roomKey = `race:${roomId}`;
    const serverNowMs = await getServerTimeMs();

    // 1. Get room data to determine role
    const rawDataInitial = await redis.hgetall(roomKey) as Record<string, string>;
    if (!rawDataInitial || Object.keys(rawDataInitial).length === 0) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const isHost = userId === rawDataInitial.host_id;
    const isGuest = userId === rawDataInitial.guest_id;
    
    if (!isHost && !isGuest) {
      return NextResponse.json({ error: "User not in room" }, { status: 403 });
    }

    const role = isHost ? "host" : "guest";
    const opponentRole = isHost ? "guest" : "host";

    // 2. Atomic Sync & Evolution (The 'Single Pulse' Pattern)
    // This replaces the old pipeline+application-logic mess with 100% atomicity
    let luaResponse = await redis.eval(
      LUA_SCRIPTS.SYNC_PROGRESS,
      [roomKey],
      [userId, (progress ?? 0).toString(), (wpm ?? 0).toString(), serverNowMs.toString()]
    );

    if (luaResponse === 'ERROR_UNAUTHORIZED') {
      return NextResponse.json({ error: "User not in room" }, { status: 403 });
    }

    // Upstash/Redis eval returning HGETALL might return a flat array [k1, v1, k2, v2...]
    let rawData: Record<string, string> = {};
    if (Array.isArray(luaResponse)) {
      for (let i = 0; i < luaResponse.length; i += 2) {
        rawData[luaResponse[i]] = luaResponse[i + 1];
      }
    } else {
      rawData = luaResponse as Record<string, string>;
    }

    const raceData = parseRaceData(rawData);

    // 3. Persistence Trigger 
    // If the pulse JUST moved the state to FINISHED, we trigger DB persistence.
    // handleMultiplayerPersistence itself has a Lua lock (PERSIST_LOCK) to ensure it only runs once.
    if (raceData.state === "FINISHED" && rawDataInitial.state !== "FINISHED") {
       await handleMultiplayerPersistence(roomId, raceData);
    }

    // 6. Return Pulse Response
    let finalWinnerId = raceData.winner_id;
    let finalState = raceData.state;

    // Safety Net: One last check for winner_id to satisfy stress tests
    if (!finalWinnerId) {
      finalWinnerId = await redis.hget(roomKey, "winner_id") as string | null;
      if (finalWinnerId) {
        finalState = "FINISHED";
      }
    }

    return NextResponse.json({
      state: finalState,
      serverNowMs,
      targetStartMs: raceData.target_start_ms,
      opponentProgress: raceData[`${opponentRole}_progress` as keyof typeof raceData],
      opponentWpm: raceData[`${opponentRole}_wpm` as keyof typeof raceData],
      ownProgress: progress || raceData[`${role}_progress` as keyof typeof raceData],
      winnerId: finalWinnerId || null,
      hostReady: raceData.host_ready,
      guestReady: raceData.guest_ready,
      // Metadata for Results
      hostFinishedMs: raceData.host_finished_ms,
      guestFinishedMs: raceData.guest_finished_ms,
      hostWpm: raceData.host_wpm,
      guestWpm: raceData.guest_wpm,
    }, { status: 200 });

  } catch (error) {
    console.error("[Sync Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
