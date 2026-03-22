import { NextResponse } from "next/server";
import { LUA_SCRIPTS } from "@/lib/multiplayer/lua";
import { parseRaceData } from "@/lib/multiplayer/parser";
import redis from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { roomId, userId } = await req.json();

    if (!roomId || !userId) {
      return NextResponse.json({ error: "Missing roomId or userId" }, { status: 400 });
    }

    const roomKey = `race:${roomId}`;
    
    // 0. Existence Check
    const exists = await redis.exists(roomKey);
    if (!exists) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    const result = await redis.eval(
      LUA_SCRIPTS.READY_UP,
      [roomKey],
      [userId]
    ) as string;

    if (result === 'ERROR_UNAUTHORIZED') {
      return NextResponse.json({ error: "User not in this room" }, { status: 403 });
    }

    const rawData = await redis.hgetall(roomKey) as Record<string, string>;
    const parsedData = parseRaceData(rawData);

    return NextResponse.json({
      roomId,
      room: parsedData
    }, { status: 200 });

  } catch (error) {
    console.error("[Ready Up Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
