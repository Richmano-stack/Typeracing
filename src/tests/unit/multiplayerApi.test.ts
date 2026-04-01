import { describe, it, expect, vi, beforeEach } from "vitest";
import { multiplayerApi, MultiplayerApiError } from "@/services/multiplayerApi";

describe("multiplayerApi", () => {
  const mockFetch = vi.fn();
  vi.stubGlobal("fetch", mockFetch);

  beforeEach(() => {
    mockFetch.mockClear();
    // Mock window.location.origin for URL constructor
    vi.stubGlobal("window", { location: { origin: "http://localhost:3000" } });
  });

  it("createRoom should call /api/race/create and return data", async () => {
    const mockResponse = { roomId: "123", hostId: "host-1", room: { state: "LOBBY" } };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await multiplayerApi.createRoom();
    expect(mockFetch).toHaveBeenCalledWith("/api/race/create", expect.objectContaining({ method: "POST" }));
    expect(result).toEqual(mockResponse);
  });

  it("joinRoom should call /api/race/join with body", async () => {
    const mockResponse = { roomId: "123", guestId: "guest-1", room: { state: "LOBBY_FULL" } };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await multiplayerApi.joinRoom("123", "guest-1");
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/race/join",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ roomId: "123", guestId: "guest-1" }),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it("lobbyHeartbeat should include guestId in searchParams", async () => {
    const mockResponse = { roomId: "123", serverNowMs: 1000, room: { status: "LOBBY" } };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    await multiplayerApi.lobbyHeartbeat("123", "user-1");
    const calledUrlString = mockFetch.mock.calls[0][0];
    const calledUrl = new URL(calledUrlString);
    expect(calledUrl.searchParams.get("guestId")).toBe("user-1");
    expect(calledUrl.pathname).toBe("/api/race/lobby/123");
  });

  it("should throw MultiplayerApiError on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => ({ error: "Bad Request" }),
    });

    const promise = multiplayerApi.createRoom();
    await expect(promise).rejects.toThrow(MultiplayerApiError);
    await expect(promise).rejects.toThrow(/Failed to create room: Bad Request/);
  });
});
