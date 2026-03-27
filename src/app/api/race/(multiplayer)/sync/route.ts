import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as RedisRoomService from "@/lib/multiplayer/redis-room-service";
import { getServerTimeMs } from "@/lib/multiplayer/server-time";

export const dynamic = "force-dynamic";

/**
 * POST /api/race/sync
 * 
 * The authoritative heart of the multiplayer race.
 * Atomic pulse handled by Redis Lua.
 */
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });
    
    const body = await req.json();
    const { roomId, guestId, progress, wpm } = body;

    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    }

    // Identify requester: Session user or guestId UUID
    const userId = session?.user?.id || guestId;
    if (!userId) {
      return NextResponse.json({ error: "Identity required" }, { status: 401 });
    }

    // Execute Atomic Pulse
    const result = await RedisRoomService.syncPulse(roomId, userId, progress, wpm);

    // Handle Logic Errors from Lua
    switch (result.status) {
      case 'ERROR_NOT_FOUND':
        return NextResponse.json({ error: "ROOM_GONE" }, { status: 404 });
      
      case 'ERROR_UNAUTHORIZED':
        return NextResponse.json({ error: "User not in room" }, { status: 403 });
      
      case 'ERROR_WAITING':
        return NextResponse.json({ error: "Jump-start prevented" }, { status: 400 });
      
      case 'ERROR_CHEATING':
        return NextResponse.json({ error: "Impossible speed detected" }, { status: 403 });
      
      case 'OK':
        const serverNowMs = await getServerTimeMs();
        return NextResponse.json({
          state: result.state,
          serverNowMs,
          targetStartMs: result.targetStartMs,
          opponentProgress: result.opponentProgress,
          opponentWpm: result.opponentWpm,
          winnerId: result.winnerId || null,
        }, { status: 200 });

      default:
        return NextResponse.json({ error: "Internal pulse error" }, { status: 500 });
    }

  } catch (error) {
    console.error("[Sync Pulse Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
