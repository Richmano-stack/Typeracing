import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as RedisRoomService from "@/lib/multiplayer/redis-room-service";

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

    // Atomically attempt to claim the spot
    const joined = await RedisRoomService.join(roomId, userId);

    if (!joined) {
      return NextResponse.json({ error: "Room is already full" }, { status: 403 });
    }

    console.log(`[Room Joined] User ${userId} joined Room ${roomId}`);

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
