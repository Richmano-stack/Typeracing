"use client";

import React from 'react';
import Link from 'next/link';
import { useGuestStats } from '@/hooks/useGuestStats';
import { Trophy, Zap, Target, Flame, AlertCircle, Play, Swords } from 'lucide-react';
import CyberCard from '@/components/ui/CyberCard';
import CyberButton from '@/components/ui/CyberButton';

const GuestDashboard: React.FC = () => {
    const { stats } = useGuestStats();

    return (
        <div className="min-h-screen p-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="relative overflow-hidden rounded-lg border border-[var(--primary)] bg-[rgba(0,243,255,0.05)] p-8 md:p-12 text-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-50" />

                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-4"
                        style={{ textShadow: '0 0 20px rgba(0,243,255,0.3)' }}>
                        Ready to Race?
                    </h1>
                    <p className="text-[var(--text-secondary)] font-mono mb-8 max-w-2xl mx-auto">
                        INITIATE TYPING SEQUENCE. TEST YOUR REFLEXES AGAINST THE GRID.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/race">
                            <CyberButton size="lg" glow>
                                <Play size={20} />
                                <span>Quick Race</span>
                            </CyberButton>
                        </Link>
                        <Link href="/register">
                            <CyberButton variant="secondary" size="lg">
                                <span>Create Profile</span>
                            </CyberButton>
                        </Link>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-[var(--text-muted)] text-sm font-mono border border-[var(--border)] p-2 rounded bg-black/20">
                    <AlertCircle size={14} className="text-[var(--secondary)]" />
                    <span>GUEST MODE: DATA NOT PERSISTED PERMANENTLY</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <CyberCard title="Races" icon={<Trophy size={24} />}>
                        <p className="text-4xl font-black text-white">{stats.racesPlayed}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono uppercase">Completed</p>
                    </CyberCard>

                    <CyberCard title="Best WPM" icon={<Zap size={24} />}>
                        <p className="text-4xl font-black text-[var(--primary)]" style={{ textShadow: '0 0 10px rgba(0,243,255,0.5)' }}>
                            {stats.bestWpm}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono uppercase">Peak Speed</p>
                    </CyberCard>

                    <CyberCard title="Accuracy" icon={<Target size={24} />}>
                        <p className="text-4xl font-black text-[var(--success)]">
                            {stats.accuracy}%
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono uppercase">Precision</p>
                    </CyberCard>

                    <CyberCard title="Streak" icon={<Flame size={24} />}>
                        <p className="text-4xl font-black text-[var(--secondary)]">
                            {stats.streak}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono uppercase">Consecutive</p>
                    </CyberCard>
                </div>

                {stats.recentRaces && stats.recentRaces.length > 0 && (
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
                                        <th className="px-6 py-4 font-bold">Accuracy</th>
                                        <th className="px-6 py-4 font-bold">Errors</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {stats.recentRaces.map((race) => {
                                        const date = new Date(race.completedAt);
                                        const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                                        
                                        return (
                                            <tr key={race.id} className="hover:bg-[var(--bg-surface)] transition-colors">
                                                <td className="px-6 py-4 font-mono text-[var(--text-muted)]">
                                                    {formattedDate}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-[var(--text-secondary)] uppercase text-xs">
                                                    {race.raceType}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-white">
                                                    {race.wpm}
                                                </td>
                                                <td className="px-6 py-4 font-mono text-[var(--success)]">
                                                    {race.accuracy}%
                                                </td>
                                                <td className="px-6 py-4 font-mono text-[var(--error)]">
                                                    {race.errors}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default GuestDashboard;
