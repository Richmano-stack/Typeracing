import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoist variables so they are available in the mock factories
const { mockSetGameState, mockLobbyHeartbeat, getMockResponseData } = vi.hoisted(() => {
  let mockResponseData: any = null;
  return {
    mockSetGameState: vi.fn(),
    mockLobbyHeartbeat: vi.fn(),
    getMockResponseData: () => mockResponseData,
    setMockResponseData: (data: any) => { mockResponseData = data; }
  };
});

// We need a way to set the data from the test
let currentMockData: any = null;

vi.mock("react", () => ({
  useEffect: (fn: any) => fn(),
  useState: (initial: any) => [initial, (v: any) => {}],
  useCallback: (fn: any) => fn,
  useMemo: (fn: any) => fn(),
}));

vi.mock("@/store/useRaceStore", () => ({
  useRaceStore: (fn: any) => fn({ setGameState: mockSetGameState }),
}));

vi.mock("@/services/multiplayerApi", () => ({
  multiplayerApi: {
    lobbyHeartbeat: mockLobbyHeartbeat,
  },
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: (config: any) => {
    if (config.enabled && currentMockData) {
      return { data: currentMockData, isLoading: false, state: { data: currentMockData } };
    }
    return { data: null, isLoading: true, state: { data: null } };
  },
}));

import { useLobbyPolling } from "@/hooks/useLobbyPolling";

describe("useLobbyPolling Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentMockData = null;
    vi.spyOn(Date, 'now').mockReturnValue(10000);
  });

  it("should calculate clockOffsetMs correctly", () => {
    currentMockData = {
      room: {
        status: "LOBBY_FULL",
        is_host_ready: true,
        is_guest_ready: false,
        target_start_ms: 20000,
      },
      serverNowMs: 10500,
    };

    useLobbyPolling({ roomId: "room1", userId: "user1", enabled: true });

    expect(mockSetGameState).toHaveBeenCalledWith(expect.objectContaining({
      state: "LOBBY_FULL",
      clockOffsetMs: 500,
    }));
  });

  it("should handle polling disable", () => {
    currentMockData = { room: { status: "LOBBY_FULL" }, serverNowMs: 10500 };
    useLobbyPolling({ roomId: "room1", userId: "user1", enabled: false });
    expect(mockSetGameState).not.toHaveBeenCalled();
  });
});
