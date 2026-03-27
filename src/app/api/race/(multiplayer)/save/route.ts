import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as RedisRoomService from "@/lib/multiplayer/redis-room-service";
import { handleMultiplayerPersistence } from "@/lib/multiplayer/persistence";

export const dynamic = "force-dynamic";

/**
 * POST /api/race/multiplayer/save
 * 
 * Separate persistence endpoint triggered after the "Sync Pulse" 
 * declares a winner. Moves data from Redis to Postgres.
 */
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    
    const { roomId, guestId } = await req.json();

    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    }

    const userId = session?.user?.id || guestId;
    if (!userId) {
      return NextResponse.json({ error: "Identity required" }, { status: 401 });
    }

    // 1. Fetch the final room state
    const roomData = await RedisRoomService.getRoom(roomId);
    if (!roomData) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // 2. Safety Check: Only save if state is FINISHED
    if (roomData.state !== 'FINISHED') {
      return NextResponse.json({ error: "Race is not finished yet" }, { status: 400 });
    }

    // 3. Security Check: Requester must be a participant
    if (userId !== roomData.host_id && userId !== roomData.guest_id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 4. Trigger Atomic Persistence
    const persistResult = await handleMultiplayerPersistence(roomId, roomData);

    if (persistResult.success) {
      return NextResponse.json({ status: "SAVED" }, { status: 200 });
    } else if (persistResult.reason === "ALREADY_PERSISTED") {
      return NextResponse.json({ status: "ALREADY_SAVED" }, { status: 200 });
    } else {
      return NextResponse.json({ 
        error: "Persistence failed", 
        details: persistResult.error instanceof Error ? persistResult.error.message : String(persistResult.error)
      }, { status: 500 });
    }

  } catch (error) {
    console.error("[Multiplayer Save Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
