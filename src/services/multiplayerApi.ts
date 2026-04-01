import { RaceData } from "@/lib/multiplayer/types";

export interface CreateRoomResponse {
  roomId: string;
  hostId: string;
  room: RaceData;
}

export interface JoinRoomResponse {
  roomId: string;
  guestId: string;
  room: RaceData;
}

export interface ReadyUpResponse {
  roomId: string;
  room: RaceData;
}

export interface StartRaceResponse {
  roomId: string;
  targetStartMs: number;
  serverNowMs: number;
  status: 'STARTING' | 'ALREADY_STARTING';
}

export interface LobbyHeartbeatResponse {
  roomId: string;
  serverNowMs: number;
  room: {
    host_id: string;
    guest_id: string | null;
    status: string;
    is_host_ready: boolean;
    is_guest_ready: boolean;
    target_start_ms: number;
    prompt_text: string;
    is_opponent_disconnected: boolean;
  };
}

export interface SaveResultsResponse {
  status: 'SAVED' | 'ALREADY_SAVED';
}

export class MultiplayerApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'MultiplayerApiError';
  }
}

async function handleResponse<T>(response: Response, errorMessage: string): Promise<T> {
  if (!response.ok) {
    let errorDetail = "";
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.error || errorJson.details || response.statusText;
    } catch {
      errorDetail = await response.text() || response.statusText;
    }
    throw new MultiplayerApiError(response.status, `${errorMessage}: ${errorDetail}`);
  }
  return response.json();
}

export const multiplayerApi = {
  async createRoom(): Promise<CreateRoomResponse> {
    const response = await fetch("/api/race/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<CreateRoomResponse>(response, "Failed to create room");
  },

  async joinRoom(roomId: string, guestId: string | null): Promise<JoinRoomResponse> {
    const response = await fetch("/api/race/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, guestId }),
    });
    return handleResponse<JoinRoomResponse>(response, "Failed to join room");
  },

  async readyUp(roomId: string, userId: string): Promise<ReadyUpResponse> {
    const response = await fetch("/api/race/ready", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, userId }),
    });
    return handleResponse<ReadyUpResponse>(response, "Failed to ready up");
  },

  async startRace(roomId: string, userId: string | null): Promise<StartRaceResponse> {
    const response = await fetch("/api/race/multiplayer-start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, guestId: userId }),
    });
    return handleResponse<StartRaceResponse>(response, "Failed to start race");
  },

  async lobbyHeartbeat(roomId: string, userId: string | null): Promise<LobbyHeartbeatResponse> {
    const url = new URL(`/api/race/lobby/${roomId}`, window.location.origin);
    if (userId) {
      url.searchParams.set("guestId", userId);
    }
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<LobbyHeartbeatResponse>(response, "Lobby heartbeat failed");
  },

  async saveResults(roomId: string, userId: string | null): Promise<SaveResultsResponse> {
    const response = await fetch("/api/race/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, guestId: userId }),
    });
    return handleResponse<SaveResultsResponse>(response, "Failed to save results");
  },

  async getRoom(roomId: string): Promise<{ roomId: string; room: RaceData }> {
     // Shared helper for rehydration
     const response = await fetch(`/api/race/${roomId}`, {
       method: "GET",
       headers: { "Content-Type": "application/json" },
     });
     return handleResponse<{ roomId: string; room: RaceData }>(response, "Failed to fetch room");
  }
};
