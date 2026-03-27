import { NextResponse } from "next/server";
import { getServerTimeMs } from "@/lib/multiplayer/server-time";
import { getRandomQuote } from "@/lib/multiplayer/content-service";
import { initialize } from "@/lib/multiplayer/redis-room-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/race/create
 *
 * Initializes a new multiplayer race lobby.
 *
 * 1. Generates a unique roomId and hostId.
 * 2. Fetches a random prompt from the DB via ContentService.
 * 3. Writes the initial Redis room hash via RedisRoomService.
 * 4. Returns { roomId, hostId, room } to the client.
 *
 * No request body is required — the server owns prompt selection.
 */
export async function POST() {
  try {
    const roomId = crypto.randomUUID().slice(0, 8);
    const hostId = crypto.randomUUID();

    // Fetch a random prompt from the database
    const prompt = await getRandomQuote();

    // Get authoritative server time
    const nowMs = await getServerTimeMs();

    // Initialize the Redis room hash
    const room = await initialize({
      roomId,
      hostId,
      promptId: prompt.id,
      promptText: prompt.content,
      nowMs,
    });

    console.log(`[Room Created] Room ID: ${roomId}, Host ID: ${hostId}, Prompt ID: ${prompt.id}`);

    return NextResponse.json({ roomId, hostId, room }, { status: 200 });

  } catch (error) {
    console.error("[Room Creation Error]", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
