import { prisma } from "./prisma";

/**
 * Retrieves overall "all-time" stats for a user by aggregating all race results.
 */
export async function getUserStats(userId: string) {
    const [user, aggregates] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                total_races: true,
                best_wpm: true,
                createdAt: true,
                name: true,
            },
        }),
        prisma.raceResult.aggregate({
            where: { userId },
            _avg: {
                wpm: true,
                accuracy: true,
            },
        }),
    ]);

    return {
        totalRaces: user?.total_races || 0,
        bestWpm: Number(user?.best_wpm || 0),
        avgWpm: Number((aggregates._avg.wpm || 0).toFixed(1)),
        avgAccuracy: Number((aggregates._avg.accuracy || 0).toFixed(1)),
        createdAt: user?.createdAt,
        name: user?.name,
    };
}

/**
 * Retrieves "recent" stats for a user based on the last N races.
 * This is primarily used for the HUD and active telemetry.
 */
export async function getRecentStats(userId: string, limit: number = 10) {
    const [user, recentRaces] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: {
                total_races: true,
                best_wpm: true,
            },
        }),
        prisma.raceResult.findMany({
            where: { userId },
            orderBy: { completedAt: 'desc' },
            take: limit,
            select: {
                wpm: true,
                accuracy: true,
            },
        }),
    ]);

    if (!user) return null;

    const dataToAverage = recentRaces.slice(0, limit);
    const count = dataToAverage.length;
    let recentAvgWpm = 0;
    let recentAvgAccuracy = 0;

    if (count > 0) {
        const sumWpm = dataToAverage.reduce((sum, race) => sum + race.wpm, 0);
        const sumAccuracy = dataToAverage.reduce((sum, race) => sum + race.accuracy, 0);
        recentAvgWpm = Number((sumWpm / count).toFixed(1));
        recentAvgAccuracy = Number((sumAccuracy / count).toFixed(1));
    }

    return {
        bestWpm: Number(user.best_wpm),
        totalRaces: user.total_races,
        recentAvgWpm,
        recentAvgAccuracy,
    };
}
