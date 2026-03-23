import { create } from 'zustand';

export type GameState = 'LOBBY' | 'COUNTDOWN' | 'IN_PROGRESS' | 'FINISHED' | 'ABANDONED';

export interface RaceState {
  // Room Metadata
  roomId: string | null;
  targetStartMs: number | null;
  state: GameState;
  clockOffsetMs: number | null;

  // Local Player State
  localProgress: number; // 0-100
  localWpm: number;
  isReady: boolean;
  localFinished: boolean;

  // Opponent State (Track A)
  opponentProgress: number;
  opponentWpm: number;
  opponentLastActive: number | null;

  // Result State
  winnerId: string | null;
  finalResults: {
    wpm: number;
    accuracy: number;
    durationMs: number;
    saved: boolean;
    authenticated: boolean;
  } | null;

  // Readiness State
  hostReady: boolean;
  guestReady: boolean;

  // New Metrics (Sprint 1)
  rawKeystrokes: number;
  validKeystrokes: number;
  isHardSync: boolean;
  isInputDisabled: boolean;
}

export interface RaceActions {
  setGameState: (data: Partial<RaceState>) => void;
  updateLocalProgress: (progress: number, wpm: number) => void;
  updateMetrics: (raw: number, valid: number, wpm: number, progress: number) => void;
  resetStore: () => void;
}

export type RaceStore = RaceState & RaceActions;

const initialState: RaceState = {
  roomId: null,
  targetStartMs: null,
  state: 'LOBBY',
  clockOffsetMs: null,

  localProgress: 0,
  localWpm: 0,
  isReady: false,
  localFinished: false,

  opponentProgress: 0,
  opponentWpm: 0,
  opponentLastActive: null,

  winnerId: null,
  finalResults: null,

  hostReady: false,
  guestReady: false,

  rawKeystrokes: 0,
  validKeystrokes: 0,
  isHardSync: false,
  isInputDisabled: false,
};

export const useRaceStore = create<RaceStore>((set) => ({
  ...initialState,

  setGameState: (data) => set((state) => ({ ...state, ...data })),

  updateLocalProgress: (progress, wpm) =>
    set((state) => {
      const isFinished = progress >= 100;
      return {
        localProgress: progress,
        localWpm: wpm,
        localFinished: state.localFinished || isFinished,
      };
    }),

  updateMetrics: (raw, valid, wpm, progress) =>
    set((state) => {
      const isFinished = progress >= 100;
      return {
        rawKeystrokes: raw,
        validKeystrokes: valid,
        localProgress: progress,
        localWpm: wpm,
        localFinished: state.localFinished || isFinished,
      };
    }),

  resetStore: () => set(initialState),
}));
