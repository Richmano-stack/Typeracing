import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'stopped';

interface TimerState {
    // State
    elapsed: number; // seconds
    countdown: number; // seconds
    status: TimerStatus;
    intervalId: NodeJS.Timeout | null;

    // Actions
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
            // Initial state
            elapsed: 0,
            countdown: 0,
            status: 'idle',
            intervalId: null,

            // Actions
            startTimer: () => {
                const state = get();

                // Clear any existing interval
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
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/c7f103f5-706e-4173-b524-77af058e477e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTimerStore.ts:64',message:'resetTimer called',data:{currentCountdown:get().countdown},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
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
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/c7f103f5-706e-4173-b524-77af058e477e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTimerStore.ts:76',message:'resetTimer set complete',data:{newCountdown:get().countdown},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                // #endregion
            },

            tick: () => {
                set((state) => ({
                    elapsed: state.elapsed + 1,
                }));
            },

            startCountdown: (seconds: number) => {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/c7f103f5-706e-4173-b524-77af058e477e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTimerStore.ts:85',message:'startCountdown called',data:{seconds,currentCountdown:get().countdown},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                // #endregion
                const state = get();

                // Clear any existing interval
                if (state.intervalId) {
                    clearInterval(state.intervalId);
                }

                set({
                    countdown: seconds,
                    status: 'running',
                });
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/c7f103f5-706e-4173-b524-77af058e477e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTimerStore.ts:96',message:'startCountdown set complete',data:{newCountdown:get().countdown},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                // #endregion
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
