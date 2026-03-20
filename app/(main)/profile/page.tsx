import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { User, Activity, Trophy, Flag, Zap, Target } from 'lucide-react';
import { redirect } from 'next/navigation';
import CyberCard from '@/components/ui/CyberCard';

const ProfilePage = async () => {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
        redirect('/login');
    }

    // Fetch user data from database
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            name: true,
            createdAt: true,
            best_wpm: true,
            average_wpm: true,
            total_races: true,
            // avgAccuracy is not in schema either, I'll remove it or check again
        },
    });

    if (!user) {
        redirect('/login');
    }

    // Format joining date on server side to avoid hydration issues
    const formatDate = (date: Date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const displayUser = {
        username: user.name || "User",
        bestWpm: Math.round(Number(user.best_wpm) || 0),
        avgWpm: Math.round(Number(user.average_wpm) || 0),
        racesCompleted: user.total_races || 0,
        accuracy: 100, // Placeholder as avgAccuracy is missing from schema
        joinedDate: formatDate(user.createdAt),
    };

    return (
        <div className="min-h-screen p-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Profile Header Banner */}
                <div className="relative overflow-hidden rounded-lg border border-[var(--primary)] bg-[rgba(0,243,255,0.05)] p-8 md:p-12 text-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-50" />
                    
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <User size={48} className="text-[var(--primary)]" />
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white"
                            style={{ textShadow: '0 0 20px rgba(0,243,255,0.3)' }}>
                            {displayUser.username}'s Profile
                        </h1>
                    </div>
                    <p className="text-[var(--text-secondary)] font-mono text-sm uppercase">
                        Joined: {displayUser.joinedDate}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <CyberCard title="Best WPM" icon={<Zap size={24} />}>
                        <p className="text-4xl font-black text-[var(--primary)]" style={{ textShadow: '0 0 10px rgba(0,243,255,0.5)' }}>
                            {displayUser.bestWpm || 0}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono uppercase">Peak Speed</p>
                    </CyberCard>

                    <CyberCard title="Average WPM" icon={<Activity size={24} />}>
                        <p className="text-4xl font-black text-white">
                            {displayUser.avgWpm || 0}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono uppercase">Average Speed</p>
                    </CyberCard>

                    <CyberCard title="Races Completed" icon={<Trophy size={24} />}>
                        <p className="text-4xl font-black text-white">
                            {displayUser.racesCompleted || 0}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono uppercase">Total Races</p>
                    </CyberCard>

                    <CyberCard title="Accuracy" icon={<Target size={24} />}>
                        <p className="text-4xl font-black text-[var(--success)]">
                            {displayUser.accuracy || 0}%
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono uppercase">Average Precision</p>
                    </CyberCard>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
