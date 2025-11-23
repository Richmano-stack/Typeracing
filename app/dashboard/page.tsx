import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { getCurrentUser, getUserStats } from '@/lib/data';
import AuthenticatedDashboard from '@/components/dashboard/AuthenticatedDashboard';
import GuestDashboard from '@/components/dashboard/GuestDashboard';

export const metadata = {
    title: 'Dashboard | TypeRace',
    description: 'Track your typing speed and progress.',
};

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    if (session?.user) {
        // Fetch user data and stats from DB
        const user = await getCurrentUser();

        // If user exists in session but not DB (rare edge case), fallback or redirect
        if (!user) {
            // In a real app, maybe redirect to login or show error
            return <GuestDashboard />;
        }

        const { stats, recentRaces } = await getUserStats(user.id) || { stats: null, recentRaces: [] };

        return (
            <AuthenticatedDashboard
                user={user}
                stats={stats}
                recentRaces={recentRaces}
            />
        );
    }

    // Guest View
    return <GuestDashboard />;
}
