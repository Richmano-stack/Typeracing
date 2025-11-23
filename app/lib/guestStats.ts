export interface GuestStats {
    racesPlayed: number;
    averageWpm: number;
    bestWpm: number;
    lastRaceAt: string | null; // ISO string
}

const GUEST_STATS_KEY = 'typeracing_guest_stats';

export function getGuestStats(): GuestStats {
    if (typeof window === 'undefined') return { racesPlayed: 0, averageWpm: 0, bestWpm: 0, lastRaceAt: null };

    const stored = sessionStorage.getItem(GUEST_STATS_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Failed to parse guest stats', e);
        }
    }
    return { racesPlayed: 0, averageWpm: 0, bestWpm: 0, lastRaceAt: null };
}

export function saveGuestRace(wpm: number) {
    if (typeof window === 'undefined') return;

    const stats = getGuestStats();
    const newRacesPlayed = stats.racesPlayed + 1;
    const newAverageWpm = ((stats.averageWpm * stats.racesPlayed) + wpm) / newRacesPlayed;
    const newBestWpm = Math.max(stats.bestWpm, wpm);

    const newStats: GuestStats = {
        racesPlayed: newRacesPlayed,
        averageWpm: newAverageWpm,
        bestWpm: newBestWpm,
        lastRaceAt: new Date().toISOString(),
    };

    sessionStorage.setItem(GUEST_STATS_KEY, JSON.stringify(newStats));
    return newStats;
}

export function resetGuestStats() {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(GUEST_STATS_KEY);
}
