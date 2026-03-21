import { NextResponse } from "next/server";
import { getServerTimeMs } from "@/lib/multiplayer/server-time";
import { parseRaceData } from "@/lib/multiplayer/parser";
import redis from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const promptId = body.promptId || "demo-prompt-id";
    const promptText = body.promptText || "This is a demo typing text to test the multiplayer system.";

    const roomId = crypto.randomUUID().slice(0, 8);
    const hostId = crypto.randomUUID(); // Simulated host session ID

    const nowMs = await getServerTimeMs();

    const rawData = {
      state: "WAITING_FOR_GUEST",
      host_id: hostId,
      guest_id: "",
      prompt_id: promptId,
      prompt_text: promptText,
      host_ready: "0",
      guest_ready: "0",
      target_start_ms: "0",
      host_progress: "0",
      guest_progress: "0",
      host_wpm: "0",
      guest_wpm: "0",
      host_last_active: nowMs.toString(),
      guest_last_active: "0",
      winner_id: "",
      persisted_to_db: "0",
    };

    const roomKey = `race:${roomId}`;

    // Initialize the Redis hash race:{roomId} with all default fields
    await redis.hset(roomKey, rawData);

    // Set a Redis expiration (TTL) of 3600 seconds to prevent lingering lobbies
    await redis.expire(roomKey, 3600);

    const parsedData = parseRaceData(rawData);

    console.log(`[Room Created] Room ID: ${roomId}, Host ID: ${hostId}`);

    return NextResponse.json({
      roomId,
      hostId, // Returning hostId so the client knows their identity
      room: parsedData
    }, { status: 200 });

  } catch (error) {
    console.error("[Room Creation Error]", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
