"use client";

import React from 'react';
import Link from 'next/link';
import { useGuestStats } from '@/hooks/useGuestStats';
import { Trophy, Zap, Target, Flame, AlertCircle } from 'lucide-react';

const GuestDashboard: React.FC = () => {
    const { stats } = useGuestStats();

    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Guest Warning Banner */}
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start space-x-3">
                    <AlertCircle className="text-yellow-500 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h3 className="font-semibold text-yellow-500">Guest Mode</h3>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">
                            You are currently playing as a guest. Your stats are temporary and will be lost if you refresh the page.
                            <Link href="/register" className="text-[var(--accent)] hover:underline ml-1 font-medium">
                                Create an account
                            </Link> to save your progress permanently.
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Races Played */}
                    <div className="bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
                        <div className="flex items-center space-x-3 mb-2">
                            <Trophy size={20} className="text-blue-500" />
                            <h3 className="text-[var(--text-secondary)] font-medium">Races</h3>
                        </div>
                        <p className="text-3xl font-bold">{stats.racesPlayed}</p>
                    </div>

                    {/* Best WPM */}
                    <div className="bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
                        <div className="flex items-center space-x-3 mb-2">
                            <Zap size={20} className="text-yellow-500" />
                            <h3 className="text-[var(--text-secondary)] font-medium">Best WPM</h3>
                        </div>
                        <p className="text-3xl font-bold">{stats.bestWpm}</p>
                    </div>

                    {/* Accuracy */}
                    <div className="bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
                        <div className="flex items-center space-x-3 mb-2">
                            <Target size={20} className="text-green-500" />
                            <h3 className="text-[var(--text-secondary)] font-medium">Accuracy</h3>
                        </div>
                        <p className="text-3xl font-bold">{stats.accuracy}%</p>
                    </div>

                    {/* Streak */}
                    <div className="bg-[var(--bg-surface)] p-6 rounded-xl border border-[var(--border)] shadow-sm">
                        <div className="flex items-center space-x-3 mb-2">
                            <Flame size={20} className="text-orange-500" />
                            <h3 className="text-[var(--text-secondary)] font-medium">Streak</h3>
                        </div>
                        <p className="text-3xl font-bold">{stats.streak}</p>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-[var(--bg-surface)] rounded-xl p-8 text-center border border-[var(--border)] shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">Ready to go pro?</h2>
                    <p className="text-[var(--text-secondary)] mb-6 max-w-lg mx-auto">
                        Join thousands of other racers on the leaderboard. Track your progress, compete in tournaments, and customize your profile.
                    </p>
                    <div className="flex justify-center space-x-4">
                        <Link href="/register">
                            <button className="bg-[var(--accent)] text-[var(--bg-base)] font-bold py-3 px-8 rounded-lg shadow-lg hover:opacity-90 transition-opacity transform hover:scale-105">
                                Create Account
                            </button>
                        </Link>
                        <Link href="/login">
                            <button className="bg-[var(--bg-card)] text-[var(--text-primary)] font-semibold py-3 px-8 rounded-lg border border-[var(--border)] hover:bg-[var(--bg-base)] transition-colors">
                                Login
                            </button>
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default GuestDashboard;
