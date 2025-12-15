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

    // Fetch user stats
    const [racesPlayed, bestWpmResult, avgAccuracyResult] = await Promise.all([
        prisma.score.count({
            where: { userId: session.user.id },
        }),
        prisma.score.findFirst({
            where: { userId: session.user.id },
            orderBy: { wpm: 'desc' },
            select: { wpm: true },
        }),
        prisma.score.aggregate({
            where: { userId: session.user.id },
            _avg: { accuracy: true },
        }),
    ]);

    const stats = {
        racesPlayed,
        bestWpm: bestWpmResult?.wpm || 0,
        accuracy: Math.round(avgAccuracyResult._avg.accuracy || 0),
        streak: 0, // Placeholder as we don't track streak in DB yet
    };

    return <UserDashboard user={session.user as any} stats={stats} />;
}
