"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface GuestStats {
    racesPlayed: number;
    lastWpm: number;
    bestWpm: number;
    accuracy: number; // Average accuracy
    streak: number;
}

interface GuestStatsContextType {
    stats: GuestStats;
    saveRace: (wpm: number, accuracy: number) => void;
    resetStats: () => void;
}

const defaultStats: GuestStats = {
    racesPlayed: 0,
    lastWpm: 0,
    bestWpm: 0,
    accuracy: 0,
    streak: 0,
};

const GuestStatsContext = createContext<GuestStatsContextType | undefined>(undefined);

export const GuestStatsProvider = ({ children }: { children: ReactNode }) => {
    const [stats, setStats] = useState<GuestStats>(defaultStats);

    const saveRace = (wpm: number, accuracy: number) => {
        setStats((prev) => {
            const newRacesPlayed = prev.racesPlayed + 1;
            const newAccuracy = ((prev.accuracy * prev.racesPlayed) + accuracy) / newRacesPlayed;

            return {
                racesPlayed: newRacesPlayed,
                lastWpm: wpm,
                bestWpm: Math.max(prev.bestWpm, wpm),
                accuracy: parseFloat(newAccuracy.toFixed(2)),
                streak: prev.streak + 1,
            };
        });
    };

    const resetStats = () => {
        setStats(defaultStats);
    };

    return (
        <GuestStatsContext.Provider value= {{ stats, saveRace, resetStats }
}>
    { children }
    </GuestStatsContext.Provider>
    );
};

export const useGuestStats = () => {
    const context = useContext(GuestStatsContext);
    if (context === undefined) {
        throw new Error('useGuestStats must be used within a GuestStatsProvider');
    }
    return context;
};
