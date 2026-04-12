import { describe, it, expect, beforeEach } from "vitest";
import { useRaceStore } from "@/store/useRaceStore";

describe("useRaceStore", () => {
  beforeEach(() => {
    useRaceStore.getState().resetStore();
  });

  it("should have correct initial state", () => {
    const state = useRaceStore.getState();
    expect(state.state).toBe("LOBBY");
    expect(state.role).toBe(null);
    expect(state.hostReady).toBe(false);
    expect(state.guestReady).toBe(false);
    expect(state.opponentName).toBe(null);
    expect(state.persistenceStatus).toBe("IDLE");
  });

  it("should update state via setGameState", () => {
    useRaceStore.getState().setGameState({
      state: "WAITING_FOR_GUEST",
      role: "host",
      opponentName: "Guest123",
    });

    const state = useRaceStore.getState();
    expect(state.state).toBe("WAITING_FOR_GUEST");
    expect(state.role).toBe("host");
    expect(state.opponentName).toBe("Guest123");
  });

  it("should reset state via resetStore", () => {
    useRaceStore.getState().setGameState({
      state: "READY_CHECK",
      role: "guest",
      persistenceStatus: "SAVING",
    });

    useRaceStore.getState().resetStore();

    const state = useRaceStore.getState();
    expect(state.state).toBe("LOBBY");
    expect(state.role).toBe(null);
    expect(state.persistenceStatus).toBe("IDLE");
  });

  it("should update local progress and set localFinished", () => {
    useRaceStore.getState().updateLocalProgress(100, 85, 0, 100);
    
    const state = useRaceStore.getState();
    expect(state.localProgress).toBe(100);
    expect(state.localWpm).toBe(85);
    expect(state.localFinished).toBe(true);
  });
});
