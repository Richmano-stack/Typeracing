"use client";

import React from 'react';
import { User, Activity, Trophy, Flag } from 'lucide-react';

// StatCard component
const StatCard = ({ icon: Icon, title, value }: { icon: any; title: string; value: React.ReactNode }) => (
    <div className="p-5 ui-card flex flex-col items-start" style={{ backgroundColor: 'var(--bg-card)' }}>
        <Icon size={32} className="mb-3" style={{ color: 'var(--accent)' }} />
        <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</span>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{title}</p>
    </div>
);

const ProfilePage = () => {
    // Frontend-only: Use mock user data
    const displayUser = {
        username: 'Demo Racer',
        bestWpm: 0,
        avgWpm: 0,
        racesCompleted: 0,
        accuracy: 0,
        joinedDate: new Date().toLocaleDateString(),
    };

    return (
        <div className="container mx-auto p-4 md:p-8 min-h-[80vh]">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                    <User size={40} className="inline mr-3" style={{ color: 'var(--accent)' }} />
                    {displayUser.username}'s Profile
                </h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Joined: {displayUser.joinedDate}
                </p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <StatCard icon={Trophy} title="Best WPM" value={displayUser.bestWpm} />
                <StatCard icon={Activity} title="Average WPM" value={displayUser.avgWpm} />
                <StatCard icon={Flag} title="Races Completed" value={displayUser.racesCompleted} />
                <StatCard icon={User} title="Accuracy" value={`${displayUser.accuracy}%`} />
            </div>
        </div>
    );
};

export default ProfilePage;
