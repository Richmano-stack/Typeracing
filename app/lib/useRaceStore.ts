import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type RaceMode = 'practice' | 'race' | 'multiplayer';
export type RaceStatus = 'idle' | 'countdown' | 'running' | 'finished';

interface RaceState {
    // Configuration
    text: string;
    textId: string;
    mode: RaceMode;

    // User Input
    userInput: string;

    // Timing
    startTime: number | null;
    endTime: number | null;

    // Metrics
    wpm: number;
    accuracy: number;
    errors: number;
    charsTyped: number;
    charsCorrect: number;

    // Status
    status: RaceStatus;

    // Actions
    initializeRace: (text: string, textId: string, mode?: RaceMode) => void;
    setUserInput: (input: string) => void;
    startRace: () => void;
    finishRace: () => void;
    resetRace: () => void;
    calculateMetrics: () => void;
}

const calculateWPM = (charsCorrect: number, startTime: number | null, endTime: number | null): number => {
    if (!startTime) return 0;
    const elapsed = (endTime || Date.now()) - startTime;
    const minutes = elapsed / 60000;
    if (minutes <= 0) return 0;
    return Math.floor((charsCorrect / 5) / minutes);
};

const calculateAccuracy = (input: string, text: string): { accuracy: number; errors: number; charsCorrect: number } => {
    if (input.length === 0) return { accuracy: 100, errors: 0, charsCorrect: 0 };

    let errors = 0;
    let correct = 0;

    for (let i = 0; i < input.length; i++) {
        if (i < text.length) {
            if (input[i] === text[i]) {
                correct++;
            } else {
                errors++;
            }
        }
    }

    const accuracy = Math.max(0, 100 - (errors / input.length) * 100);
    return { accuracy, errors, charsCorrect: correct };
};

export const useRaceStore = create<RaceState>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial state
                text: '',
                textId: '',
                mode: 'practice',
                userInput: '',
                startTime: null,
                endTime: null,
                wpm: 0,
                accuracy: 100,
                errors: 0,
                charsTyped: 0,
                charsCorrect: 0,
                status: 'idle',

                // Actions
                initializeRace: (text: string, textId: string, mode: RaceMode = 'practice') => {
                    set({
                        text,
                        textId,
                        mode,
                        userInput: '',
                        startTime: null,
                        endTime: null,
                        wpm: 0,
                        accuracy: 100,
                        errors: 0,
                        charsTyped: 0,
                        charsCorrect: 0,
                        status: 'idle',
                    });
                },

                setUserInput: (input: string) => {
                    const state = get();

                    // Limit input to text length
                    const limitedInput = input.slice(0, state.text.length);

                    // Calculate metrics
                    const { accuracy, errors, charsCorrect } = calculateAccuracy(limitedInput, state.text);
                    const wpm = calculateWPM(charsCorrect, state.startTime, state.endTime);

                    // Check if race is finished
                    const isFinished = limitedInput.length >= state.text.length;

                    set({
                        userInput: limitedInput,
                        charsTyped: limitedInput.length,
                        charsCorrect,
                        errors,
                        accuracy,
                        wpm,
                        status: isFinished ? 'finished' : state.status,
                        endTime: isFinished ? Date.now() : state.endTime,
                    });

                    // Auto-finish if completed
                    if (isFinished && state.status !== 'finished') {
                        get().finishRace();
                    }
                },

                startRace: () => {
                    set({
                        status: 'running',
                        startTime: Date.now(),
                        endTime: null,
                    });
                },

                finishRace: () => {
                    const state = get();
                    set({
                        status: 'finished',
                        endTime: Date.now(),
                    });

                    // Recalculate final metrics
                    get().calculateMetrics();
                },

                resetRace: () => {
                    const state = get();
                    set({
                        userInput: '',
                        startTime: null,
                        endTime: null,
                        wpm: 0,
                        accuracy: 100,
                        errors: 0,
                        charsTyped: 0,
                        charsCorrect: 0,
                        status: 'idle',
                    });
                },

                calculateMetrics: () => {
                    const state = get();
                    const { accuracy, errors, charsCorrect } = calculateAccuracy(state.userInput, state.text);
                    const wpm = calculateWPM(charsCorrect, state.startTime, state.endTime);

                    set({
                        accuracy,
                        errors,
                        charsCorrect,
                        wpm,
                    });
                },
            }),
            {
                name: 'race-storage',
                partialize: (state) => ({
                    // Only persist mode, don't persist race state
                    mode: state.mode,
                }),
            }
        )
    )
);
