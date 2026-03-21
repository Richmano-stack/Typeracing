export type RaceState = "WAITING_FOR_GUEST" | "LOBBY_FULL" | "READY_CHECK" | "COUNTDOWN" | "IN_PROGRESS" | "FINISHED" | "ABANDONED";

export interface RaceData {
  state: RaceState;
  host_id: string;
  guest_id: string | null;
  prompt_id: string;
  prompt_text: string;
  host_ready: boolean;
  guest_ready: boolean;
  target_start_ms: number;
  host_progress: number;
  guest_progress: number;
  host_wpm: number;
  guest_wpm: number;
  host_last_active: number;
  guest_last_active: number;
  winner_id: string | null;
  persisted_to_db: boolean;
}
