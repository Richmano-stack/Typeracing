import redis from "@/lib/redis";
import { LUA_SCRIPTS } from "./lua";
import { parseRaceData } from "./parser";
import { RaceData } from "./types";

/**
 * RedisRoomService
 *
 * Centralizes all Redis hash operations for multiplayer race rooms.
 * Keeps route handlers thin and makes room initialization consistent
 * across any future entry points (matchmaking, rematch, etc.).
 */

const ROOM_TTL_SECONDS = 3600; // 1 hour

export interface InitializeParams {
  roomId: string;
  hostId: string;
  promptId: string;
  promptText: string;
  nowMs: number;
}

/**
 * Initializes a new race room hash in Redis.
 * Sets all fields to their default values and applies a TTL.
 *
 * @returns The parsed RaceData object for the newly created room.
 */
export async function initialize(params: InitializeParams): Promise<RaceData> {
  const { roomId, hostId, promptId, promptText, nowMs } = params;

  const roomKey = `race:${roomId}`;

  const rawData: Record<string, string> = {
    state: "WAITING_FOR_GUEST",
    host_id: hostId,
    prompt_id: promptId,
    prompt_text: promptText,
    host_ready: "0",
    guest_ready: "0",
    target_start_ms: "0",
    ready_deadline_ms: "0",
    host_progress: "0",
    guest_progress: "0",
    host_wpm: "0",
    guest_wpm: "0",
    host_last_active: nowMs.toString(),
    guest_last_active: "0",
    host_finished_ms: "0",
    guest_finished_ms: "0",
    winner_id: "",
    persisted_to_db: "0",
  };

  // Write all fields atomically and set expiry
  await redis.hset(roomKey, rawData);
  await redis.expire(roomKey, ROOM_TTL_SECONDS);

  return parseRaceData(rawData);
}

/**
 * Fetches an existing race room by ID.
 *
 * @returns The parsed RaceData object, or null if the room does not exist.
 */
export async function getRoom(roomId: string): Promise<RaceData | null> {
  const roomKey = `race:${roomId}`;
  const rawData = await redis.hgetall(roomKey) as Record<string, string> | null;
  
  if (!rawData || Object.keys(rawData).length === 0) {
    return null;
  }
  
  return parseRaceData(rawData);
}

/**
 * Atomically attempts to join a room using the JOIN_ROOM Lua script.
 *
 * Handles: self-join prevention, idempotent re-entry, state validation, and slot claiming.
 *
 * @returns A result string: 'OK' | 'OK_ALREADY_IN' | 'ERROR_FULL' | 'ERROR_STATE' | 'ERROR_SELF_JOIN'
 */
export async function join(roomId: string, userId: string, nowMs: number): Promise<string> {
  const roomKey = `race:${roomId}`;
  
  const result = await redis.eval(
    LUA_SCRIPTS.JOIN_ROOM,
    [roomKey],
    [userId, nowMs.toString()]
  ) as string;
  
  return result;
}
