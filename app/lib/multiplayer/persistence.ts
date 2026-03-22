import { prisma } from "@/lib/prisma";
import redis from "@/lib/redis";
import { LUA_SCRIPTS } from "./lua";
import { RaceData } from "./types";

/**
 * handleMultiplayerPersistence
 * 
 * Atomically locks the persistence event for a room and commits 
 * both players' results to the Postgres database if they have finished.
 */
export async function handleMultiplayerPersistence(roomId: string, raceData: RaceData) {
  const roomKey = `race:${roomId}`;

  // 1. Atomic Lock check (Ensures only one 'Pulse' call saves the data)
  const canPersist = await redis.eval(LUA_SCRIPTS.PERSIST_LOCK, [roomKey], []) as number;
  
  if (canPersist === 0) {
    // Already persisted or another process is handling it
    return { success: false, reason: "ALREADY_PERSISTED" };
  }

  try {
    const results = [];

    // 2. Prepare participant data (Host and Guest)
    const participants = [
      { 
        id: raceData.host_id, 
        role: "host", 
        wpm: raceData.host_wpm, 
        finishedAt: raceData.host_finished_ms 
      },
      { 
        id: raceData.guest_id, 
        role: "guest", 
        wpm: raceData.guest_wpm, 
        finishedAt: raceData.guest_finished_ms 
      }
    ];

    // 3. Database Transaction
    await prisma.$transaction(async (tx) => {
      for (const p of participants) {
        if (!p.id) continue;

        // Check if the participant ID is a valid user in our DB
        // (BetterAuth uses UUIDs for IDs)
        const user = await tx.user.findUnique({
          where: { id: p.id },
          select: { id: true, best_wpm: true }
        });

        const durationSeconds = p.finishedAt > 0 
          ? Math.round((p.finishedAt - raceData.target_start_ms) / 1000)
          : 0;

        // Save RaceResult
        await tx.raceResult.create({
          data: {
            userId: user ? user.id : null, // Nullable for guests
            mode: "multiplayer",
            wpm: p.wpm,
            accuracy: 100, // Default for now, or calculate if we have total chars
            duration_seconds: Math.max(0, durationSeconds),
            text_id: raceData.prompt_id,
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
