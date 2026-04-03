"use client";

import React from 'react';
import Link from 'next/link';
import { Swords, Zap, Loader2 } from 'lucide-react';
import CyberButton from '@/components/ui/CyberButton';
import { User } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { multiplayerApi } from '@/services/multiplayerApi';
import { toast } from 'sonner';

interface UserDashboardProps {
    user: User & {
        id: string;
    };
    stats: {
        racesPlayed: number;
        bestWpm: number;
        accuracy: number;
        streak: number; // We might need to calculate this or just mock it for now if not in DB
    };
    recentRaces: {
        id: string;
        wpm: number;
        accuracy: number;
        errors: number;
        raceType: string;
        completedAt: Date;
        formattedDate: string;
    }[];
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, stats, recentRaces }) => {
    const router = useRouter();
    const [isCreating, setIsCreating] = React.useState(false);

    const handleCreateRoom = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (isCreating) return;

        setIsCreating(true);
        const toastId = toast.loading("Initializing private protocol...");
        try {
            const { roomId } = await multiplayerApi.createRoom();
            toast.success("Lobby encrypted and ready.", { id: toastId });
            router.push(`/race/${roomId}`);
        } catch (error: any) {
            toast.error(error.message || "Protocol failure.", { id: toastId });
            setIsCreating(false);
        }
    };

    return (
        <div className="min-h-screen p-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="relative overflow-hidden rounded-lg border border-[var(--primary)] bg-[rgba(0,243,255,0.05)] py-6 md:py-8 px-8 text-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-50" />

                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-4"
                        style={{ textShadow: '0 0 20px rgba(0,243,255,0.3)' }}>
                        Welcome Back, {user.name}
                    </h1>
                    <p className="text-[var(--text-secondary)] font-mono mb-8 max-w-2xl mx-auto">
                        READY TO BREAK SOME RECORDS? SELECT YOUR PROTOCOL.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 flex-wrap">
                        <Link href="/solo-race">
                            <CyberButton size="lg" glow>
                                <Zap size={20} />
                                <span>Solo Protocol</span>
                            </CyberButton>
                        </Link>
                        <Link href="#" onClick={handleCreateRoom}>
                            <CyberButton variant="secondary" size="lg">
                                {isCreating ? <Loader2 size={20} className="animate-spin" /> : <Swords size={20} />}
                                <span className="flex items-center">
                                    Private Lobby
                                </span>
                            </CyberButton>
                        </Link>
                    </div>
                </div>



                <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Swords className="text-[var(--primary)]" />
                        Recent Activity
                    </h2>

                    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-card)]">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[var(--bg-surface)] text-[var(--text-secondary)] font-mono uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Date</th>
                                    <th className="px-6 py-4 font-bold">Type</th>
                                    <th className="px-6 py-4 font-bold">WPM</th>
                                    <th className="px-6 py-4 font-bold text-right">Accuracy</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {recentRaces && recentRaces.length > 0 ? (
                                    recentRaces.slice(0, 5).map((race) => (
                                        <tr key={race.id} className="hover:bg-[var(--bg-surface)] transition-colors">
                                            <td className="px-6 py-4 font-mono text-[var(--text-muted)] opacity-50 text-xs">
                                                {race.formattedDate}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-[var(--text-secondary)] uppercase text-[10px]">
                                                {race.raceType === 'solo' ? '[SOLO_PROTOCOL]' : race.raceType}
                                            </td>
                                            <td className="px-6 py-4 font-black text-white text-lg">
                                                {race.wpm}
                                            </td>
                                            <td className={`px-6 py-4 font-mono text-right ${race.accuracy > 95 ? 'text-[var(--success)]' : 'text-[var(--text-secondary)]'}`}>
                                                {race.accuracy}%
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-[var(--text-muted)] font-mono">
                                            &gt; NO LOGS DETECTED. INITIALIZE NEURAL SYNC.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-end pr-2">
                        <Link href="/profile" className="text-[10px] font-mono text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors opacity-70">
                            [ VIEW_ALL_LOGS -&gt; ]
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default UserDashboard;
