/*
  Warnings:

  - You are about to drop the `Score` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Score" DROP CONSTRAINT "Score_userId_fkey";

-- DropTable
DROP TABLE "Score";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "totalRaces" INTEGER NOT NULL DEFAULT 0,
    "avgWpm" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "bestWpm" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "avgAccuracy" DECIMAL(5,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "races" (
    "id" TEXT NOT NULL,
    "wpm" DECIMAL(5,2) NOT NULL,
    "accuracy" DECIMAL(5,2) NOT NULL,
    "timeTakenMs" INTEGER NOT NULL,
    "errors" INTEGER NOT NULL,
    "textHash" VARCHAR(64) NOT NULL,
    "detailedMetrics" JSONB,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "races_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "races_userId_idx" ON "races"("userId");

-- AddForeignKey
ALTER TABLE "races" ADD CONSTRAINT "races_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
