import React from 'react';
import { User, Trophy, Zap, Target, Clock, Calendar } from 'lucide-react';

interface AuthenticatedDashboardProps {
    user: any; // Type this properly if possible, but 'any' is fine for now based on data.ts return
    stats: any;
    recentRaces: any[];
}

const AuthenticatedDashboard: React.FC<AuthenticatedDashboardProps> = ({ user, stats, recentRaces }) => {
    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Welcome Section */}
                <div className="bg-[var(--bg-surface)] rounded-xl p-6 shadow-lg border border-[var(--border)] flex items-center space-x-6">
                    <div className="h-20 w-20 rounded-full bg-[var(--accent)] flex items-center justify-center overflow-hidden border-4 border-[var(--bg-card)]">
                        {user.image ? (
                            <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                            <User size={40} className="text-[var(--bg-base)]" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Welcome back, {user.name || 'Racer'}!</h1>
                        <p className="text-[var(--text-secondary)]">
                            Member since {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Races Played */}
                    <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
                                <Trophy size={24} />
                            </div>
                        </div>
                        <h3 className="text-[var(--text-secondary)] text-sm font-medium">Races Won</h3>
                        <p className="text-3xl font-bold mt-1">{stats?.racesPlayed || 0}</p>
                    </div>

                    {/* Average WPM */}
                    <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-yellow-500/10 text-yellow-500">
                                <Zap size={24} />
                            </div>
                        </div>
                        <h3 className="text-[var(--text-secondary)] text-sm font-medium">Average WPM</h3>
                        <p className="text-3xl font-bold mt-1">{Math.round(stats?.averageWpm || 0)}</p>
                    </div>

                    {/* Best WPM */}
                    <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-green-500/10 text-green-500">
                                <Trophy size={24} />
                            </div>
                        </div>
                        <h3 className="text-[var(--text-secondary)] text-sm font-medium">Best WPM</h3>
                        <p className="text-3xl font-bold mt-1">{stats?.bestWpm || 0}</p>
                    </div>

                    {/* Last Race */}
                    <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-orange-500/10 text-orange-500">
                                <Clock size={24} />
                            </div>
                        </div>
                        <h3 className="text-[var(--text-secondary)] text-sm font-medium">Last Race</h3>
                        <p className="text-lg font-bold mt-2">
                            {stats?.lastRaceAt ? new Date(stats.lastRaceAt).toLocaleDateString() : 'Never'}
                        </p>
                    </div>

                    {/* Accuracy (Placeholder if not in DB yet, or calculate) */}
                    <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-lg bg-purple-500/10 text-purple-500">
                                <Target size={24} />
                            </div>
                        </div>
                        <h3 className="text-[var(--text-secondary)] text-sm font-medium">Accuracy</h3>
                        <p className="text-3xl font-bold mt-1">{stats?.accuracy ?? 0}%</p> {/* Dynamic accuracy */}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-[var(--bg-surface)] rounded-xl shadow-lg border border-[var(--border)] overflow-hidden">
                    <div className="p-6 border-b border-[var(--border)]">
                        <h2 className="text-xl font-bold">Recent Races</h2>
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                        {recentRaces && recentRaces.length > 0 ? (
                            recentRaces.map((race) => (
                                <div key={race.id} className="p-4 hover:bg-[var(--bg-card)] transition-colors flex justify-between items-center">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-2 rounded-full bg-[var(--bg-base)]">
                                            <Zap size={18} className="text-[var(--accent)]" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{race.wpm} WPM</p>
                                            <p className="text-sm text-[var(--text-secondary)]">{race.accuracy}% Accuracy</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            {new Date(race.createdAt).toLocaleDateString()}
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)]">
                                            {new Date(race.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-[var(--text-secondary)]">
                                <p>No races yet. Start typing to see your history!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthenticatedDashboard;
