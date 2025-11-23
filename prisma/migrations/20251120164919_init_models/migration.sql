-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "bestWpm" INTEGER NOT NULL DEFAULT 0,
    "totalRaces" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaceSession" (
    "id" TEXT NOT NULL,
    "wpm" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "textUsed" TEXT NOT NULL,
    "isMultiplayer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "RaceSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "RaceSession" ADD CONSTRAINT "RaceSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
