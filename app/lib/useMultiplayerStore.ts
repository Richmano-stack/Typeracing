import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Racer {
    id: string;
    nickname: string;
    progress: number; // 0-100
    wpm: number;
    isCurrentUser: boolean;
}

interface MultiplayerState {
    // State
    racers: Racer[];
    currentUserId: string;

    // Actions
    initializeRacers: (currentUserId: string, currentUserNickname?: string) => void;
    addRacer: (racer: Racer) => void;
    removeRacer: (id: string) => void;
    updateRacer: (id: string, updates: Partial<Racer>) => void;
    updateCurrentUserProgress: (progress: number, wpm: number) => void;
    resetRacers: () => void;
}

export const useMultiplayerStore = create<MultiplayerState>()(
    devtools(
        (set, get) => ({
            // Initial state
            racers: [],
            currentUserId: 'user',

            // Actions
            initializeRacers: (currentUserId: string, currentUserNickname: string = 'YOU') => {
                set({
                    currentUserId,
                    racers: [
                        {
                            id: currentUserId,
                            nickname: currentUserNickname,
                            progress: 0,
                            wpm: 0,
                            isCurrentUser: true,
                        },
                    ],
                });
            },

            addRacer: (racer: Racer) => {
                set((state) => ({
                    racers: [...state.racers, racer],
                }));
            },

            removeRacer: (id: string) => {
                set((state) => ({
                    racers: state.racers.filter((r) => r.id !== id),
                }));
            },

            updateRacer: (id: string, updates: Partial<Racer>) => {
                set((state) => ({
                    racers: state.racers.map((r) =>
                        r.id === id ? { ...r, ...updates } : r
                    ),
                }));
            },

            updateCurrentUserProgress: (progress: number, wpm: number) => {
                const state = get();
                set({
                    racers: state.racers.map((r) =>
                        r.id === state.currentUserId
                            ? { ...r, progress: Math.min(100, progress), wpm }
                            : r
                    ),
                });
            },

            resetRacers: () => {
                set((state) => ({
                    racers: state.racers.map((r) => ({
                        ...r,
                        progress: 0,
                        wpm: 0,
                    })),
                }));
            },
        })
    )
);
