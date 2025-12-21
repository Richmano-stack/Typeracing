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
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/c7f103f5-706e-4173-b524-77af058e477e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useGuestStats.tsx:46',message:'Loaded from localStorage',data:{hasRecentRaces:!!parsed.recentRaces,recentRacesType:typeof parsed.recentRaces,recentRacesIsArray:Array.isArray(parsed.recentRaces),recentRacesValue:parsed.recentRaces},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
                    // #endregion
                    // Merge with defaultStats to ensure all fields are present (especially recentRaces)
                    const merged = {
                        ...defaultStats,
                        ...parsed,
                        recentRaces: Array.isArray(parsed.recentRaces) ? parsed.recentRaces : defaultStats.recentRaces,
                    };
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/c7f103f5-706e-4173-b524-77af058e477e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useGuestStats.tsx:52',message:'After merge with defaultStats',data:{hasRecentRaces:!!merged.recentRaces,recentRacesType:typeof merged.recentRaces,recentRacesIsArray:Array.isArray(merged.recentRaces)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
                    // #endregion
                    return merged;
                } catch {
                    // #region agent log
                    fetch('http://127.0.0.1:7243/ingest/c7f103f5-706e-4173-b524-77af058e477e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useGuestStats.tsx:57',message:'JSON parse failed, using defaultStats',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
                    // #endregion
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
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/c7f103f5-706e-4173-b524-77af058e477e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useGuestStats.tsx:70',message:'saveRace called - checking prev.recentRaces',data:{hasRecentRaces:!!prev.recentRaces,recentRacesType:typeof prev.recentRaces,recentRacesIsArray:Array.isArray(prev.recentRaces),recentRacesValue:prev.recentRaces,prevKeys:Object.keys(prev)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
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

            // Ensure recentRaces is always an array (defensive check)
            const prevRecentRaces = Array.isArray(prev.recentRaces) ? prev.recentRaces : [];
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/c7f103f5-706e-4173-b524-77af058e477e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useGuestStats.tsx:87',message:'Before spreading prevRecentRaces',data:{recentRacesType:typeof prevRecentRaces,recentRacesIsArray:Array.isArray(prevRecentRaces),prevRecentRacesLength:prevRecentRaces.length},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
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
