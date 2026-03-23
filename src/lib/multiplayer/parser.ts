import { RaceState, RaceData } from "./types";

export function parseRaceData(raw: Record<string, string>): RaceData {
  return {
    state: (raw.state as RaceState) || "WAITING_FOR_GUEST",
    host_id: raw.host_id,
    guest_id: raw.guest_id || null,
    prompt_id: raw.prompt_id,
    prompt_text: raw.prompt_text,
    host_ready: raw.host_ready === "1",
    guest_ready: raw.guest_ready === "1",
    persisted_to_db: raw.persisted_to_db === "1",
    target_start_ms: parseInt(raw.target_start_ms || "0"),
    host_progress: parseInt(raw.host_progress || "0"),
    guest_progress: parseInt(raw.guest_progress || "0"),
    host_wpm: parseInt(raw.host_wpm || "0"),
    guest_wpm: parseInt(raw.guest_wpm || "0"),
    host_last_active: parseInt(raw.host_last_active    || "0"),
    guest_last_active: parseInt(raw.guest_last_active   || "0"),
    host_finished_ms: parseInt(raw.host_finished_ms    || "0"),
    guest_finished_ms: parseInt(raw.guest_finished_ms   || "0"),
    ready_deadline_ms: parseInt(raw.ready_deadline_ms   || "0"),
    winner_id: raw.winner_id || null,
  };
}



