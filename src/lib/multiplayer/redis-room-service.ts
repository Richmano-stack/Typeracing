import redis from "@/lib/redis";
import { LUA_SCRIPTS } from "./lua";
import { parseRaceData } from "./parser";
import { RaceData } from "./types";
import { getServerTimeMs } from "./server-time";

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
    created_at_ms: nowMs.toString(),
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

/**
 * High-precision multiplayer start logic.
 * Calculates target start time based on server clock and commits via Lua.
 * 
 * @returns { roomId, targetStartMs, serverNowMs } 
 */
export async function startMultiplayer(roomId: string, userId: string): Promise<{
  status: 'OK' | 'ALREADY_STARTING' | 'ERROR_NOT_FOUND' | 'ERROR_FORBIDDEN' | 'ERROR_NO_GUEST' | 'ERROR_NOT_READY' | 'ERROR_STATE',
  targetStartMs?: number,
  serverNowMs?: number
}> {
  const roomKey = `race:${roomId}`;
  const serverNowMs = await getServerTimeMs();
  const COUNTDOWN_OFFSET = 10000; // 10 seconds
  const targetStartMs = serverNowMs + COUNTDOWN_OFFSET;

  const result = await redis.eval(
    LUA_SCRIPTS.MULTIPLAYER_START,
    [roomKey],
    [userId, targetStartMs.toString()]
  ) as string;

  if (result === 'OK') {
    return { status: 'OK', targetStartMs, serverNowMs };
  }

  if (result.startsWith('ALREADY_STARTING:')) {
    const existingTarget = parseInt(result.split(':')[1], 10);
    return { status: 'ALREADY_STARTING', targetStartMs: existingTarget, serverNowMs };
  }

  return { status: result as any, serverNowMs };
}

/**
 * Updates the requester's last_active timestamp and returns the room's current state.
 * Also flags if the opponent appears to have disconnected.
 */
export async function heartbeat(roomId: string, userId: string): Promise<{
  status: 'OK' | 'ERROR_NOT_FOUND' | 'ERROR_UNAUTHORIZED',
  state?: string,
  isOpponentDisconnected?: boolean
}> {
  const roomKey = `race:${roomId}`;
  const nowMs = await getServerTimeMs();

  const result = await redis.eval(
    LUA_SCRIPTS.LOBBY_HEARTBEAT,
    [roomKey],
    [userId, nowMs.toString()]
  ) as string;

  if (result === 'ERROR_NOT_FOUND' || result === 'ERROR_UNAUTHORIZED') {
    return { status: result as any };
  }

  const [state, isDisc] = result.split(':');
  return {
    status: 'OK',
    state,
    isOpponentDisconnected: isDisc === '1'
  };
}

/**
 * The Authoritative Sync Pulse ("The Brain").
 * Atomic state management, anti-cheat, and progress tracking.
 */
export async function syncPulse(
  roomId: string, 
  userId: string, 
  progress: number, 
  wpm: number
): Promise<{
  status: 'OK' | 'ERROR_NOT_FOUND' | 'ERROR_UNAUTHORIZED' | 'ERROR_WAITING' | 'ERROR_CHEATING',
  state?: string,
  winnerId?: string,
  opponentProgress?: number,
  opponentWpm?: number,
  targetStartMs?: number
}> {
  const roomKey = `race:${roomId}`;
  
  const result = await redis.eval(
    LUA_SCRIPTS.SYNC_PULSE,
    [roomKey],
    [userId, progress.toString(), wpm.toString()]
  ) as string;

  if (result.startsWith('ERROR_')) {
    return { status: result as any };
  }

  const [state, winnerId, oppProg, oppWpm, targetStart] = result.split(':');
  
  return {
    status: 'OK',
    state,
    winnerId: winnerId === '' ? undefined : winnerId,
    opponentProgress: parseInt(oppProg || '0', 10),
    opponentWpm: parseInt(oppWpm || '0', 10),
    targetStartMs: parseInt(targetStart || '0', 10)
  };
}
