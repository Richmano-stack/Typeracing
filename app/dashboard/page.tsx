import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import UserDashboard from '@/components/dashboard/UserDashboard';
import { redirect } from "next/navigation";

export const metadata = {
    title: 'Dashboard | TypeRace',
    description: 'Track your typing speed and progress.',
};

export default async function DashboardPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
        redirect("/");
    }

    const [userStats, recentRaces] = await Promise.all([
        prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                total_races: true,
                best_wpm: true,
                average_wpm: true,
            },
        }),
        prisma.raceResult.findMany({
            where: { userId: session.user.id },
            orderBy: { completedAt: 'desc' },
            take: 10,
        }),
    ]);

    const stats = {
        racesPlayed: userStats?.total_races || 0,
        bestWpm: Math.round(Number(userStats?.best_wpm) || 0),
        accuracy: 100, // Placeholder
        avgWpm: Math.round(Number(userStats?.average_wpm) || 0),
        streak: 0,
    };

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
        errors: 0, // Not present in schema
        raceType: race.mode || 'solo',
        completedAt: race.completedAt,
        formattedDate: formatDate(race.completedAt),
    }));

    return <UserDashboard user={session.user as any} stats={stats} recentRaces={formattedRecentRaces} />;
}
