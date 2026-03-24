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

    // 2. Atomic Pipeline: Write own progress + last_active; read entire hash
    const pipeline = redis.pipeline();
    pipeline.hset(roomKey, {
      [`${role}_progress`]: progress.toString(),
      [`${role}_wpm`]: wpm.toString(),
      [`${role}_last_active`]: serverNowMs.toString(),
    });
    pipeline.hgetall(roomKey);
    const results = await pipeline.exec();

    // results[0] is hset result, results[1] is hgetall result
    const rawData = results[1] as Record<string, string>;
    const raceData = parseRaceData(rawData);

    // 2.1 Ready Deadline Check
    if (raceData.state === "LOBBY_FULL" && raceData.ready_deadline_ms > 0 && serverNowMs > raceData.ready_deadline_ms) {
      if (!raceData.guest_ready) {
        await redis.eval(LUA_SCRIPTS.SET_STATE, [roomKey], ["ABANDONED"]);
        raceData.state = "ABANDONED";
      }
    }

    // 3. Heartbeat Disconnect Detection
    const opponentLastActive = raceData[`${opponentRole}_last_active` as keyof typeof raceData] as number;
    if (
      raceData.state === "IN_PROGRESS" &&
      opponentLastActive > 0 &&
      serverNowMs - opponentLastActive > DISCONNECT_TIMEOUT_MS
    ) {
      await redis.eval(LUA_SCRIPTS.RESOLVE_WINNER, [roomKey], [userId]);
      raceData.state = "FINISHED";
      raceData.winner_id = userId;

      // Atomic persistence trigger
      await handleMultiplayerPersistence(roomId, raceData);
    }

    // 4. Transition to IN_PROGRESS if COUNTDOWN elapsed
    if (raceData.state === "COUNTDOWN" && serverNowMs >= raceData.target_start_ms) {
      await redis.eval(LUA_SCRIPTS.SET_STATE, [roomKey], ["IN_PROGRESS"]);
      raceData.state = "IN_PROGRESS";
    }

    // 5. Check Finish Condition & Winner Resolution
    if (raceData.state === "IN_PROGRESS" && progress >= 100) {
      const field = `${role}_finished_ms`;
      const alreadyFinished = rawData[field];

      if (!alreadyFinished || alreadyFinished === "0") {
        // Use SET_FINISH to record timestamp atomically
        await redis.eval(LUA_SCRIPTS.SET_FINISH, [roomKey], [field, serverNowMs.toString()]);

        // RE-FETCH: Absorb concurrent updates (Split-Brain Mitigation)
        const updatedRawData = await redis.hgetall(roomKey) as Record<string, string>;
        const updatedRaceData = parseRaceData(updatedRawData);

        // 1. If a winner already exists (set by a concurrent pulse), update local state
        if (updatedRaceData.winner_id) {
          raceData.state = "FINISHED";
          raceData.winner_id = updatedRaceData.winner_id;
        } else {
          // 2. Otherwise, check if both have finished and resolve if so
          const hFin = parseInt(updatedRawData.host_finished_ms || "0");
          const gFin = parseInt(updatedRawData.guest_finished_ms || "0");

          if (hFin > 0 && gFin > 0) {
            const winnerId = hFin <= gFin ? raceData.host_id : raceData.guest_id;
            await redis.eval(LUA_SCRIPTS.RESOLVE_WINNER, [roomKey], [winnerId!]);
            raceData.state = "FINISHED";
            raceData.winner_id = winnerId!;

            // Atomic persistence trigger
            await handleMultiplayerPersistence(roomId, raceData);
          }
        }
      }
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
      winnerId: finalWinnerId || null,
    }, { status: 200 });

  } catch (error) {
    console.error("[Sync Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}