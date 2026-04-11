import { create } from 'zustand';

export type GameState = 
  | 'LOBBY' 
  | 'WAITING_FOR_GUEST' 
  | 'LOBBY_FULL' 
  | 'READY_CHECK' 
  | 'COUNTDOWN' 
  | 'IN_PROGRESS' 
  | 'FINISHED' 
  | 'ABANDONED';

export type PersistenceStatus = 'IDLE' | 'SAVING' | 'SAVED' | 'ALREADY_SAVED' | 'ERROR';

export interface RaceState {
  // Room Metadata
  roomId: string | null;
  targetStartMs: number | null;
  state: GameState;
  clockOffsetMs: number | null;
  role: 'host' | 'guest' | null;
  hostReady: boolean;
  guestReady: boolean;
  opponentName: string | null;
  persistenceStatus: PersistenceStatus;

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
  promptText: string | null;
}

export interface RaceActions {
  setGameState: (data: Partial<RaceState>) => void;
  updateLocalProgress: (progress: number, wpm: number) => void;
  resetStore: () => void;
}

export type RaceStore = RaceState & RaceActions;

const initialState: RaceState = {
  roomId: null,
  targetStartMs: null,
  state: 'LOBBY',
  clockOffsetMs: null,
  role: null,
  hostReady: false,
  guestReady: false,
  opponentName: null,
  persistenceStatus: 'IDLE',

  localProgress: 0,
  localWpm: 0,
  isReady: false,
  localFinished: false,

  opponentProgress: 0,
  opponentWpm: 0,
  opponentLastActive: null,

  winnerId: null,
  promptText: null,
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

  resetStore: () => set(initialState),
}));
