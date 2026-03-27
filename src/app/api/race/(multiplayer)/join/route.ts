import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as RedisRoomService from "@/lib/multiplayer/redis-room-service";
import { getServerTimeMs } from "@/lib/multiplayer/server-time";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    const body = await req.json();
    const { roomId, guestId } = body;

    let userId = session?.user?.id;
    if (!userId) {
      // Fallback for unauthenticated users
      userId = guestId || `guest-${crypto.randomUUID()}`;
    }

    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    }

    // Fallback: If getRoom returns null before the join attempt, return 404
    const existingRoom = await RedisRoomService.getRoom(roomId);
    if (!existingRoom) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Get authoritative server time for the Lua script
    const nowMs = await getServerTimeMs();

    // Atomically attempt to claim the spot via Lua script
    const result = await RedisRoomService.join(roomId, userId, nowMs);

    if (result === 'ERROR_SELF_JOIN') {
      return NextResponse.json({ error: "Host cannot join their own room" }, { status: 400 });
    }

    if (result === 'ERROR_FULL') {
      return NextResponse.json({ error: "Room is already full" }, { status: 403 });
    }

    if (result === 'ERROR_STATE') {
      return NextResponse.json({ error: "Room is not in a joinable state" }, { status: 403 });
    }

    if (result === 'ERROR_EXPIRED') {
      return NextResponse.json({ error: "This lobby has expired (5-minute timeout)" }, { status: 410 });
    }

    console.log(`[Room Joined] User ${userId} joined Room ${roomId} (result: ${result})`);

    // Fetch the updated room data to return synchronously
    const parsedData = await RedisRoomService.getRoom(roomId);

    return NextResponse.json({
      roomId,
      guestId: userId,
      room: parsedData
    }, { status: 200 });

  } catch (error) {
    console.error("[Room Join Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

