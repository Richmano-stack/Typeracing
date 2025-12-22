import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'stopped';

interface TimerState {
    elapsed: number;
    countdown: number;
    status: TimerStatus;
    intervalId: NodeJS.Timeout | null;
    startTimer: () => void;
    pauseTimer: () => void;
    stopTimer: () => void;
    resetTimer: () => void;
    tick: () => void;
    startCountdown: (seconds: number) => void;
    tickCountdown: () => void;
}

export const useTimerStore = create<TimerState>()(
    devtools(
        (set, get) => ({
            elapsed: 0,
            countdown: 0,
            status: 'idle',
            intervalId: null,
            startTimer: () => {
                const state = get();

                if (state.intervalId) {
                    clearInterval(state.intervalId);
                }

                set({ status: 'running' });
            },

            pauseTimer: () => {
                const state = get();

                if (state.intervalId) {
                    clearInterval(state.intervalId);
                }

                set({ status: 'paused', intervalId: null });
            },

            stopTimer: () => {
                const state = get();

                if (state.intervalId) {
                    clearInterval(state.intervalId);
                }

                set({ status: 'stopped', intervalId: null });
            },

            resetTimer: () => {
                const state = get();

                if (state.intervalId) {
                    clearInterval(state.intervalId);
                }

                set({
                    elapsed: 0,
                    countdown: 0,
                    status: 'idle',
                    intervalId: null,
                });
            },

            tick: () => {
                set((state) => ({
                    elapsed: state.elapsed + 1,
                }));
            },

            startCountdown: (seconds: number) => {
                const state = get();

                if (state.intervalId) {
                    clearInterval(state.intervalId);
                }

                set({
                    countdown: seconds,
                    status: 'running',
                });
            },

            tickCountdown: () => {
                set((state) => {
                    const newCountdown = state.countdown - 1;

                    if (newCountdown <= 0) {
                        return {
                            countdown: 0,
                            status: 'stopped',
                        };
                    }

                    return {
                        countdown: newCountdown,
                    };
                });
            },
        })
    )
);
