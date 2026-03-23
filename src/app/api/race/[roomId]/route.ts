import { NextResponse } from "next/server";
import { parseRaceData } from "@/lib/multiplayer/parser";
import redis from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;

    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    }

    const roomKey = `race:${roomId}`;

    // 1. Existence check first
    const exists = await redis.exists(roomKey);
    if (!exists) {
      return NextResponse.json({ error: "Race not found" }, { status: 404 });
    }

    // 2. Fetch all raw data from Redis hash
    const rawData = await redis.hgetall(roomKey) as Record<string, string> | null;

    if (!rawData || Object.keys(rawData).length === 0) {
      return NextResponse.json({ error: "Race not found or empty" }, { status: 404 });
    }

    // 3. Parse and format Redis raw strings into typed RaceData
    // This helper guarantees presence of prompt_text, prompt_id, 
    // host_id, guest_id, state, target_start_ms, etc.
    const parsedData = parseRaceData(rawData);

    // 4. Return passive rehydration payload
    return NextResponse.json({
      roomId: roomId,
      room: parsedData
    }, { status: 200 });

  } catch (error) {
    console.error("[Get Room Error]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
