import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GuestDashboard from '@/components/dashboard/GuestDashboard';
import UserDashboard from '@/components/dashboard/UserDashboard';

export const metadata = {
    title: 'Dashboard | TypeRace',
    description: 'Track your typing speed and progress.',
};

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return <GuestDashboard />;
    }

    // Fetch user stats and recent races
    const [userStats, recentRaces] = await Promise.all([
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                totalRaces: true,
                bestWpm: true,
                avgAccuracy: true,
                avgWpm: true,
            },
        }),
        prisma.race.findMany({
            where: { userId: session.user.id },
            orderBy: { completedAt: 'desc' },
            take: 10,
        }),
    ]);

    const stats = {
        racesPlayed: userStats?.totalRaces || 0,
        bestWpm: Math.round(Number(userStats?.bestWpm) || 0),
        accuracy: Math.round(Number(userStats?.avgAccuracy) || 0),
        avgWpm: Math.round(Number(userStats?.avgWpm) || 0),
        streak: 0, // Placeholder
    };

    // Format dates on server side to avoid hydration mismatches
    const formatDate = (date: Date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    };

    const formattedRecentRaces = recentRaces.map(race => ({
        id: race.id,
        wpm: Math.round(Number(race.wpm)),
        accuracy: Math.round(Number(race.accuracy)),
        errors: race.errors,
        raceType: race.raceType || 'quick',
        completedAt: race.completedAt,
        formattedDate: formatDate(race.completedAt),
    }));

    return <UserDashboard user={session.user as any} stats={stats} recentRaces={formattedRecentRaces} />;
}
