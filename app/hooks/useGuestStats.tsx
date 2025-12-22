"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface GuestRace {
    id: string;
    wpm: number;
    accuracy: number;
    errors: number;
    raceType: string;
    completedAt: string;
}

interface GuestStats {
    racesPlayed: number;
    lastWpm: number;
    bestWpm: number;
    accuracy: number;
    streak: number;
    recentRaces: GuestRace[];
}

interface GuestStatsContextType {
    stats: GuestStats;
    saveRace: (wpm: number, accuracy: number, raceType?: string, errors?: number) => void;
    resetStats: () => void;
}

const defaultStats: GuestStats = {
    racesPlayed: 0,
    lastWpm: 0,
    bestWpm: 0,
    accuracy: 0,
    streak: 0,
    recentRaces: [],
};

const GuestStatsContext = createContext<GuestStatsContextType | undefined>(undefined);

export const GuestStatsProvider = ({ children }: { children: ReactNode }) => {
    const [stats, setStats] = useState<GuestStats>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('guestStats');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    const merged = {
                        ...defaultStats,
                        ...parsed,
                        recentRaces: Array.isArray(parsed.recentRaces) ? parsed.recentRaces : defaultStats.recentRaces,
                    };
                    return merged;
                } catch {
                    return defaultStats;
                }
            }
        }
        return defaultStats;
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('guestStats', JSON.stringify(stats));
        }
    }, [stats]);

    const saveRace = useCallback((wpm: number, accuracy: number, raceType: string = 'quick', errors: number = 0) => {
        setStats((prev) => {
            const newRacesPlayed = prev.racesPlayed + 1;
            const newAccuracy = ((prev.accuracy * prev.racesPlayed) + accuracy) / newRacesPlayed;

            const newRace: GuestRace = {
                id: `guest-${Date.now()}-${Math.random()}`,
                wpm,
                accuracy,
                errors,
                raceType,
                completedAt: new Date().toISOString(),
            };

            const prevRecentRaces = Array.isArray(prev.recentRaces) ? prev.recentRaces : [];
            const updatedRecentRaces = [newRace, ...prevRecentRaces].slice(0, 10);

            return {
                racesPlayed: newRacesPlayed,
                lastWpm: wpm,
                bestWpm: Math.max(prev.bestWpm, wpm),
                accuracy: parseFloat(newAccuracy.toFixed(2)),
                streak: prev.streak + 1,
                recentRaces: updatedRecentRaces,
            };
        });
    }, []);

    const resetStats = useCallback(() => {
        setStats(defaultStats);
    }, []);

    return (
        <GuestStatsContext.Provider value={{ stats, saveRace, resetStats }}>
            {children}
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
