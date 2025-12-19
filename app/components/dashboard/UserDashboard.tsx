"use client";

import React from 'react';
import Link from 'next/link';
import { Trophy, Zap, Target, Flame, Play, Swords, Keyboard } from 'lucide-react';
import CyberCard from '@/components/ui/CyberCard';
import CyberButton from '@/components/ui/CyberButton';
import { User } from 'next-auth';

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
        completedAt: Date;
        formattedDate: string;
    }[];
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, stats, recentRaces }) => {
    return (
        <div className="min-h-screen p-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Welcome Banner */}
                <div className="relative overflow-hidden rounded-lg border border-[var(--primary)] bg-[rgba(0,243,255,0.05)] p-8 md:p-12 text-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-50" />

                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-4"
                        style={{ textShadow: '0 0 20px rgba(0,243,255,0.3)' }}>
                        Welcome Back, {user.name}
                    </h1>
                    <p className="text-[var(--text-secondary)] font-mono mb-8 max-w-2xl mx-auto">
                        READY TO BREAK SOME RECORDS? SELECT YOUR PROTOCOL.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 flex-wrap">
                        <Link href="/race">
                            <CyberButton size="lg" glow>
                                <Play size={20} />
                                <span>Quick Race</span>
                            </CyberButton>
                        </Link>
                        <Link href="/practice">
                            <CyberButton variant="secondary" size="lg">
                                <Keyboard size={20} />
                                <span>Practice Mode</span>
                            </CyberButton>
                        </Link>
                        <Link href="/create">
                            <CyberButton variant="secondary" size="lg">
                                <Swords size={20} />
                                <span>Private Lobby</span>
                            </CyberButton>
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <CyberCard title="Races" icon={<Trophy size={24} />}>
                        <p className="text-4xl font-black text-white">{stats.racesPlayed}</p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono uppercase">Completed</p>
                    </CyberCard>

                    <CyberCard title="Best WPM" icon={<Zap size={24} />}>
                        <p className="text-4xl font-black text-[var(--primary)]" style={{ textShadow: '0 0 10px rgba(0,243,255,0.5)' }}>
                            {stats.bestWpm || 0}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono uppercase">Peak Speed</p>
                    </CyberCard>

                    <CyberCard title="Accuracy" icon={<Target size={24} />}>
                        <p className="text-4xl font-black text-[var(--success)]">
                            {stats.accuracy || 0}%
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono uppercase">Average Precision</p>
                    </CyberCard>

                    <CyberCard title="Recent Activity" icon={<Flame size={24} />}>
                        <p className="text-4xl font-black text-[var(--secondary)]">
                            Active
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono uppercase">Status</p>
                    </CyberCard>
                </div>

                {/* Recent Races */}
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
                                    <th className="px-6 py-4 font-bold">WPM</th>
                                    <th className="px-6 py-4 font-bold">Accuracy</th>
                                    <th className="px-6 py-4 font-bold">Errors</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {recentRaces && recentRaces.length > 0 ? (
                                    recentRaces.map((race) => (
                                        <tr key={race.id} className="hover:bg-[var(--bg-surface)] transition-colors">
                                            <td className="px-6 py-4 font-mono text-[var(--text-muted)]">
                                                {race.formattedDate}
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
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-[var(--text-muted)] font-mono">
                                            NO RACE DATA FOUND. INITIATE PROTOCOL TO BEGIN.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default UserDashboard;
