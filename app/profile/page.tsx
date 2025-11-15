"use client";

import React from "react";
import { User, Activity, Trophy, Flag } from "lucide-react";

// --- Mock User Data ---
const mockUser = {
    username: "Richmano_Racer",
    bestWpm: 112,
    avgWpm: 85,
    racesCompleted: 345,
    accuracy: 97.2,
    joinedDate: "Jan 15, 2024",
};

// --- StatCard ---
const StatCard = ({ icon: Icon, title, value }) => (
    <div
        className="p-5 ui-card flex flex-col items-start"
        style={{ backgroundColor: "var(--bg-card)" }}
    >
        <Icon size={32} className="mb-3" style={{ color: "var(--accent)" }} />
        <span className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            {value}
        </span>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {title}
        </p>
    </div>
);

const ProfilePage = () => {
    return (
        <div className="container mx-auto p-4 md:p-8 min-h-[80vh]">

            {/* Header (clean, matching your style) */}
            <header className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-extrabold" style={{ color: "var(--text-primary)" }}>
                    <User size={40} className="inline mr-3" style={{ color: "var(--accent)" }} />
                    {mockUser.username}'s Profile
                </h1>

                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Joined: {mockUser.joinedDate}
                </p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <StatCard icon={Trophy} title="Best WPM" value={mockUser.bestWpm} />
                <StatCard icon={Activity} title="Average WPM" value={mockUser.avgWpm} />
                <StatCard icon={Flag} title="Races Completed" value={mockUser.racesCompleted} />
                <StatCard icon={User} title="Accuracy" value={`${mockUser.accuracy}%`} />
            </div>
        </div>
    );
};

export default ProfilePage;
