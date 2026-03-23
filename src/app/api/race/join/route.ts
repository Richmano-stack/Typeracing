import { NextResponse } from "next/server";
import { LUA_SCRIPTS } from "@/lib/multiplayer/lua";
import { parseRaceData } from "@/lib/multiplayer/parser";
import { getServerTimeMs } from "@/lib/multiplayer/server-time";
import redis from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { roomId, guestId } = body;

    if (!roomId || !guestId) {
      return NextResponse.json({ error: "Missing roomId or guestId" }, { status: 400 });
    }

    const roomKey = `race:${roomId}`;

    // Verify room actually exists before attempting to join
    const exists = await redis.exists(roomKey);
    if (!exists) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const nowMs = await getServerTimeMs();

    // Execute the JOIN_ROOM Lua script natively.
    const luaResult = await redis.eval(
      LUA_SCRIPTS.JOIN_ROOM,
      [roomKey],
      [guestId, nowMs.toString()]
    ) as string;


    if (luaResult === 'ERROR_STATE') {
      return NextResponse.json({ error: "Room is not in a joinable state" }, { status: 400 });
    }

    if (luaResult === 'ERROR_FULL') {
      return NextResponse.json({ error: "Room is already full" }, { status: 409 });
    }

    if (luaResult === 'OK') {
      console.log(`[Room Joined] Guest ${guestId} joined Room ${roomId}`);

      // Fetch the updated room data to return full prompt textual data synchronously
      const rawData = await redis.hgetall(roomKey) as Record<string, string>;
      const parsedData = parseRaceData(rawData);

      return NextResponse.json({
        roomId,
        guestId,
        room: parsedData
      }, { status: 200 });
    }

    return NextResponse.json({ error: "Unexpected script result" }, { status: 500 });

  } catch (error) {
    console.error("[Room Join Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
