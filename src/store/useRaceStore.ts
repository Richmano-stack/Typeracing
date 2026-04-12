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
  localErrors: number;
  localAccuracy: number;
  isReady: boolean;
  localFinished: boolean;

  // Opponent State (Track A)
  opponentProgress: number;
  opponentWpm: number;
  opponentAccuracy: number;
  opponentLastActive: number | null;
  opponentFinished: boolean;

  // Result State
  winnerId: string | null;
  promptText: string | null;
}

export interface RaceActions {
  setGameState: (data: Partial<RaceState>) => void;
  updateLocalProgress: (progress: number, wpm: number, errors: number, accuracy: number) => void;
  saveLocalResult: (roomId: string, userId: string | null) => Promise<void>;
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
  localErrors: 0,
  localAccuracy: 100,
  isReady: false,
  localFinished: false,

  opponentProgress: 0,
  opponentWpm: 0,
  opponentAccuracy: 100,
  opponentLastActive: null,
  opponentFinished: false,

  winnerId: null,
  promptText: null,
};

export const useRaceStore = create<RaceStore>((set, get) => ({
  ...initialState,

  setGameState: (data) => set((state) => ({ ...state, ...data })),

  updateLocalProgress: (progress, wpm, errors, accuracy) =>
    set((state) => {
      const isFinished = progress >= 100;
      return {
        localProgress: progress,
        localWpm: wpm,
        localErrors: errors,
        localAccuracy: accuracy,
        localFinished: state.localFinished || isFinished,
      };
    }),

  saveLocalResult: async (roomId, userId) => {
    const state = get();
    if (state.persistenceStatus === 'SAVING' || state.persistenceStatus === 'SAVED') {
      return;
    }
    
    set({ persistenceStatus: 'SAVING' });
    try {
      // Need dynamic import or rely on top-level import if we add it
      const { multiplayerApi } = await import('@/services/multiplayerApi');
      const result = await multiplayerApi.saveResults(roomId, userId, state.localAccuracy);
      set({ persistenceStatus: result.status === 'ALREADY_SAVED' ? 'ALREADY_SAVED' : 'SAVED' });
    } catch (error) {
      console.error('Failed to save local result:', error);
      set({ persistenceStatus: 'ERROR' });
    }
  },

  resetStore: () => set(initialState),
}));
