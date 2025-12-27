/**
 * WebSocket event type definitions for Socket.io
 */

// Client → Server events
export interface ClientToServerEvents {
  // Room events
  'room:join': (data: { roomCode: string; userId?: string; guestName?: string }) => void;
  'room:leave': (data: { roomCode: string; userId?: string; guestName?: string }) => void;
  'room:ready': (data: { roomCode: string; isReady: boolean; userId?: string; guestName?: string }) => void;
  'room:start': (data: { roomCode: string }) => void;

  // Race events
  'race:progress': (data: {
    roomCode: string;
    progress: number; // 0-100
    wpm: number;
    accuracy: number;
    errors: number;
    userId?: string;
    guestName?: string;
  }) => void;
  'race:complete': (data: {
    roomCode: string;
    wpm: number;
    accuracy: number;
    errors: number;
    timeTakenMs: number;
    userId?: string;
    guestName?: string;
  }) => void;
  'race:error': (data: { roomCode: string; error: string }) => void;
}

// Server → Client events
export interface ServerToClientEvents {
  // Room events
  'room:joined': (data: { roomCode: string; participant: any; room: any }) => void;
  'room:left': (data: { roomCode: string }) => void;
  'room:participant:joined': (data: { participant: any }) => void;
  'room:participant:left': (data: { participantId: string }) => void;
  'room:participant:ready': (data: { participant: any; participants: any[] }) => void;
  'room:status': (data: { status: string; room: any }) => void;
  'room:error': (data: { error: string; message: string }) => void;

  // Race events
  'race:starting': (data: { countdown: number; text: string; textId: string; startTime: number }) => void;
  'race:started': (data: { text: string; textId: string; startTime: number }) => void;
  'race:progress': (data: { participantId: string; progress: number; wpm: number; accuracy: number; errors: number }) => void;
  'race:finished': (data: { participantId: string; results: any }) => void;
  'race:results': (data: { results: any[]; leaderboard: any[] }) => void;
}

// Socket data (stored on socket)
export interface SocketData {
  userId?: string;
  guestName?: string;
  roomCode?: string;
}

