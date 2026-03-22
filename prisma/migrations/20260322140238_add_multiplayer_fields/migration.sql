-- AlterTable
ALTER TABLE "race_results" ADD COLUMN     "opponentId" TEXT,
ADD COLUMN     "winnerId" TEXT;

-- CreateIndex
CREATE INDEX "race_results_userId_completedAt_idx" ON "race_results"("userId", "completedAt" DESC);

-- CreateIndex
CREATE INDEX "race_results_mode_wpm_idx" ON "race_results"("mode", "wpm" DESC);
