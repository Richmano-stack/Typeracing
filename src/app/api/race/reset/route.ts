import { NextResponse } from "next/server";
import redis from "@/lib/redis";

export async function POST(req: Request) {
  try {
    const { roomId, userId } = await req.json();

    if (!roomId || !userId) {
      return NextResponse.json({ error: "Missing roomId or userId" }, { status: 400 });
    }

    const roomKey = `race:${roomId}`;
    const room = await redis.hgetall(roomKey) as Record<string, string>;

    if (!room || Object.keys(room).length === 0) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Only host or guest can reset the room
    if (userId !== room.host_id && userId !== room.guest_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Reset logic: Clear progress, wpm, finished times, readiness, and winner
    const pipeline = redis.pipeline();
    pipeline.hset(roomKey, {
      state: "LOBBY_FULL", // Move back to lobby if guest is still there
      host_ready: "0",
      guest_ready: "0",
      host_progress: "0",
      guest_progress: "0",
      host_wpm: "0",
      guest_wpm: "0",
      host_finished_ms: "0",
      guest_finished_ms: "0",
      winner_id: "",
      persisted_to_db: "0",
    });
    
    // We keep target_start_ms and prompt_id for now, 
    // but they will be overwritten when the host starts the race again.
    
    await pipeline.exec();

    return NextResponse.json({ success: true, message: "Room reset successful" }, { status: 200 });

  } catch (error) {
    console.error("[Reset Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
