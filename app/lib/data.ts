import { prisma } from "./prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/api/auth/[...nextauth]/route";

// Existing function (kept for compatibility, but getCurrentUser is preferred for current session)
export async function getUserProfile(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true,
                lastLogin: true,
                racesPlayed: true,
                averageWpm: true,
                bestWpm: true,
            },
        });
        return user;
    } catch (error) {
        console.error("Failed to fetch user:", error);
        return null;
    }
}

export async function getCurrentUser() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return null;
        }

        const currentUser = await prisma.user.findUnique({
            where: {
                email: session.user.email,
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                username: true,
                createdAt: true,
                lastLogin: true,
                racesPlayed: true,
                averageWpm: true,
                bestWpm: true,
                lastRaceAt: true,
            },
        });

        if (!currentUser) {
            return null;
        }

        return currentUser;
    } catch (error) {
        console.error("Error fetching current user:", error);
        return null;
    }
}

export async function getUserStats(userId: string) {
    try {
        // We can aggregate from the Race table for real-time accuracy
        // Or just return the fields on the User model if we update them incrementally
        // For now, let's return the User model fields as the primary source, 
        // but maybe do a quick aggregation to ensure data consistency if needed.
        // The user asked for "Queries stats from the stats table". 
        // Let's assume we want to calculate it fresh from the Race table for "Progress over time" charts later.

        // For the dashboard summary, let's fetch the User fields which act as a cache.
        // But let's ALSO fetch the recent races for the "Recent Activity" section.

        const [userStats, recentRaces] = await Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: {
                    racesPlayed: true,
                    averageWpm: true,
                    bestWpm: true,
                    lastRaceAt: true,
                }
            }),
            prisma.race.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 5,
            })
        ]);

        return {
            stats: userStats,
            recentRaces: recentRaces
        };
    } catch (error) {
        console.error("Error fetching user stats:", error);
        return null;
    }
}
