import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as RedisRoomService from "@/lib/multiplayer/redis-room-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/race/multiplayer-start
 * 
 * Authoritative endpoint to transition a multiplayer room to STARTING (COUNTDOWN).
 * Ensures both players are ready and synchronized to a server-side target time.
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

    // Identify the requester: Priority to Session, fallback to guestId (UUID)
    const requesterId = session?.user?.id || guestId;

    if (!requesterId) {
      return NextResponse.json({ error: "Identity not provided (Session or guestId required)" }, { status: 401 });
    }

    // 2. Service Logic (Phase 1-3 from Spec)
    const result = await RedisRoomService.startMultiplayer(roomId, requesterId);

    // 3. Response Handling (Phase 4 from Spec)
    switch (result.status) {
      case 'OK':
      case 'ALREADY_STARTING':
        return NextResponse.json({
          roomId,
          targetStartMs: result.targetStartMs,
          serverNowMs: result.serverNowMs,
          status: result.status === 'OK' ? 'STARTING' : 'ALREADY_STARTING'
        }, { status: 200 });

      case 'ERROR_NOT_FOUND':
        return NextResponse.json({ error: "Room not found" }, { status: 404 });

      case 'ERROR_FORBIDDEN':
        return NextResponse.json({ error: "You are not a participant in this room" }, { status: 403 });

      case 'ERROR_NO_GUEST':
        return NextResponse.json({ error: "Cannot start a multiplayer race alone" }, { status: 400 });

      case 'ERROR_NOT_READY':
        return NextResponse.json({ error: "Guest is not ready yet" }, { status: 400 });

      case 'ERROR_STATE':
        return NextResponse.json({ error: "Room is not in a ready state" }, { status: 400 });

      default:
        return NextResponse.json({ error: "Failed to start race" }, { status: 500 });
    }

  } catch (error) {
    console.error("[Multiplayer Start Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
