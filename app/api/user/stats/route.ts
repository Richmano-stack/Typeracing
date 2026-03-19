import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * GET /api/user/stats
 * Retrieves a "System Snapshot" for the authenticated user.
 */
export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // 1. User Table: Fetch total_races and best_wpm (Direct O(1) lookup)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        total_races: true,
        best_wpm: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. RaceResult Table: Fetch the last 10 races for the userId ordered by completedAt DESC
    // Optimization: Only select wpm and accuracy fields.
    const recentRaces = await prisma.raceResult.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: 10,
      select: {
        wpm: true,
        accuracy: true,
      },
    });

    // 3. Logic: Calculate mathematical average of these 10 (or fewer) records
    const slicedRaces = recentRaces.slice(0, 10);
    const count = slicedRaces.length;
    let recentAvgWpm = 0;
    let recentAvgAccuracy = 0;

    if (count > 0) {
      const sumWpm = slicedRaces.reduce((sum, race) => sum + race.wpm, 0);
      const sumAccuracy = slicedRaces.reduce((sum, race) => sum + race.accuracy, 0);
      recentAvgWpm = Number((sumWpm / count).toFixed(1));
      recentAvgAccuracy = Number((sumAccuracy / count).toFixed(1));
    }

    // Handle rounding for recentAvgWpm to 1 decimal point for UI cleanliness (already done via toFixed)
    // Handle cases where racesPlayed === 0 (count === 0, returns 0 instead of NaN - already handled)

    return NextResponse.json({
      bestWpm: user.best_wpm,
      totalRaces: user.total_races,
      recentAvgWpm,
      recentAvgAccuracy,
    });
  } catch (error) {
    console.error("Telemetry API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
