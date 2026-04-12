import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis";
import { LUA_SCRIPTS } from "./lua";
import { RaceData } from "./types";

/**
 * handleMultiplayerPersistence
 * 
 * Atomically locks the persistence event for a specific participant in a room 
 * and commits their results to the Postgres database.
 */
export async function handleMultiplayerPersistence(roomId: string, raceData: RaceData, userId: string) {
  const roomKey = `race:${roomId}`;

  const role = userId === raceData.host_id ? "host" : (userId === raceData.guest_id ? "guest" : null);
  if (!role) return { success: false, reason: "UNAUTHORIZED" };

  // 1. Atomic Lock check (Ensures participant only saves the data once)
  const canPersist = await redis.eval(LUA_SCRIPTS.INDIVIDUAL_PERSIST_LOCK, [roomKey], [role]) as number;
  
  if (canPersist === 0) {
    // Already persisted or another process is handling it
    return { success: false, reason: "ALREADY_PERSISTED" };
  }

  try {
    const p = {
      id: userId,
      role: role,
      wpm: role === "host" ? raceData.host_wpm : raceData.guest_wpm,
      finishedAt: role === "host" ? raceData.host_finished_ms : raceData.guest_finished_ms
    };

    // 3. Database Transaction
    await prisma.$transaction(async (tx) => {
        if (!p.id) return;

        // Check if the participant ID is a valid user in our DB
        // (BetterAuth uses UUIDs for IDs)
        const user = await tx.user.findUnique({
          where: { id: p.id },
          select: { id: true, best_wpm: true }
        });

        const durationSeconds = p.finishedAt > 0 
          ? Math.round((p.finishedAt - raceData.target_start_ms) / 1000)
          : 0;

        const opponentId = p.role === "host" ? raceData.guest_id : raceData.host_id;

        // Save RaceResult
        await tx.raceResult.create({
          data: {
            userId: user ? user.id : null, // Nullable for guests
            mode: "multiplayer",
            wpm: p.wpm,
            accuracy: 100, // Default for now, or calculate if we have total chars
            duration_seconds: Math.max(0, durationSeconds),
            text_id: raceData.prompt_id,
            opponentId: opponentId,
            winnerId: raceData.winner_id,
          }
        });

        // Update User stats if authenticated
        if (user) {
          await tx.user.update({
            where: { id: user.id },
            data: {
              total_races: { increment: 1 },
              best_wpm: Math.max(user.best_wpm, p.wpm)
            }
          });
        }
    });

    return { success: true };

  } catch (error) {
    console.error("[Persistence Error]", error);
    // Rollback the lock if DB fails? 
    // Actually, if DB fails repeatedly, we might want to retry. 
    // For now, we've marked 'persisted_to_db' as 1 in Redis.
    return { success: false, error };
  }
}
