import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Participant {
  id: string;
  userId?: string | null;
  guestName?: string | null;
  username?: string | null;
  isReady: boolean;
  isFinished: boolean;
  progress: number;
  wpm: number;
  accuracy: number;
  errors: number;
  completedAt?: Date | null;
  joinedAt: Date;
  startedAt?: Date | null;
}

export interface Room {
  id: string;
  roomCode: string;
  hostId?: string | null;
  maxPlayers: number;
  textId?: string | null;
  isPrivate: boolean;
  status: 'WAITING' | 'STARTING' | 'IN_PROGRESS' | 'FINISHED';
  currentText?: string | null;
  createdAt: Date;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  participants: Participant[];
  inviteLink?: string;
}

interface RoomState {
  // State
  room: Room | null;
  currentParticipant: Participant | null;
  isHost: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';

  // Actions
  setRoom: (room: Room | null) => void;
  setCurrentParticipant: (participant: Participant | null) => void;
  updateParticipant: (participantId: string, updates: Partial<Participant>) => void;
  addParticipant: (participant: Participant) => void;
  removeParticipant: (participantId: string) => void;
  setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
  reset: () => void;
}

export const useRoomStore = create<RoomState>()(
  devtools(
    (set, get) => ({
      // Initial state
      room: null,
      currentParticipant: null,
      isHost: false,
      connectionStatus: 'disconnected',

      // Actions
      setRoom: (room) => {
        set({
          room,
          isHost: room ? (room.hostId === (get().currentParticipant?.userId || null)) : false,
        });
      },

      setCurrentParticipant: (participant) => {
        set({
          currentParticipant: participant,
          isHost: get().room ? (get().room.hostId === (participant?.userId || null)) : false,
        });
      },

      updateParticipant: (participantId, updates) => {
        const state = get();
        if (!state.room) return;

        set({
          room: {
            ...state.room,
            participants: state.room.participants.map((p) =>
              p.id === participantId ? { ...p, ...updates } : p
            ),
          },
          currentParticipant:
            state.currentParticipant?.id === participantId
              ? { ...state.currentParticipant, ...updates }
              : state.currentParticipant,
        });
      },

      addParticipant: (participant) => {
        const state = get();
        if (!state.room) return;

        // Check if participant already exists
        const exists = state.room.participants.some((p) => p.id === participant.id);
        if (exists) {
          get().updateParticipant(participant.id, participant);
          return;
        }

        set({
          room: {
            ...state.room,
            participants: [...state.room.participants, participant],
          },
        });
      },

      removeParticipant: (participantId) => {
        const state = get();
        if (!state.room) return;

        set({
          room: {
            ...state.room,
            participants: state.room.participants.filter((p) => p.id !== participantId),
          },
        });
      },

      setConnectionStatus: (status) => {
        set({ connectionStatus: status });
      },

      reset: () => {
        set({
          room: null,
          currentParticipant: null,
          isHost: false,
          connectionStatus: 'disconnected',
        });
      },
    }),
    { name: 'RoomStore' }
  )
);

