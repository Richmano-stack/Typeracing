import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as RedisRoomService from "@/lib/multiplayer/redis-room-service";
import { getServerTimeMs } from "@/lib/multiplayer/server-time";

export const dynamic = "force-dynamic";

/**
 * Lobby Heartbeat Endpoint (GET /api/race/lobby/[id])
 * 
 * Provides the current state of the race room and the authoritative server time
 * for synchronization between Host and Guests.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roomId } = await params;

    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    }

    // 1. Session & Identity Identification
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    const { searchParams } = new URL(req.url);
    const guestId = searchParams.get("guestId");
    const requesterId = session?.user?.id || guestId;

    // 2. Heartbeat or Passive Retrieval
    let roomData: Awaited<ReturnType<typeof RedisRoomService.getRoom>>;
    let isOpponentDisconnected = false;

    if (requesterId) {
      // Active Heartbeat
      const heartbeatRes = await RedisRoomService.heartbeat(roomId, requesterId);
      if (heartbeatRes.status === 'OK') {
        roomData = await RedisRoomService.getRoom(roomId);
        isOpponentDisconnected = heartbeatRes.isOpponentDisconnected || false;
      } else if (heartbeatRes.status === 'ERROR_NOT_FOUND') {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
      } else {
        // Observer/Unauthorized fallthrough
        roomData = await RedisRoomService.getRoom(roomId);
      }
    } else {
      // Passive Observer
      roomData = await RedisRoomService.getRoom(roomId);
    }

    // 3. Existence Validation
    if (!roomData) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // 4. Time Synchronization
    const serverNowMs = await getServerTimeMs();

    // 5. Data Transformation (Mapping to the Observer Data Contract)
    // Redis strings are already cast into numbers/booleans by RedisRoomService.getRoom via parser.
    const transformedRoom = {
      host_id: roomData.host_id,
      guest_id: roomData.guest_id,
      status: roomData.state,
      is_host_ready: roomData.host_ready,
      is_guest_ready: roomData.guest_ready,
      target_start_ms: roomData.target_start_ms,
      prompt_text: roomData.prompt_text,
      is_opponent_disconnected: isOpponentDisconnected,
    };

    // 6. Response Dispatch
    return NextResponse.json({
      roomId,
      serverNowMs,
      room: transformedRoom
    }, { status: 200 });

  } catch (error) {
    console.error(`[Lobby Heartbeat Error] For room: ${req.url}`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
