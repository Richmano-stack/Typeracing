import { useQuery } from "@tanstack/react-query";
import { useRaceStore } from "@/store/useRaceStore";
import { multiplayerApi } from "@/services/multiplayerApi";
import { useEffect } from "react";

interface LobbyPollingParams {
  roomId: string | null;
  userId: string | null;
  enabled: boolean;
}

export function useLobbyPolling({ roomId, userId, enabled }: LobbyPollingParams) {
  const setGameState = useRaceStore((s) => s.setGameState);

  const query = useQuery({
    queryKey: ["lobbyPolling", roomId],
    queryFn: () => {
      if (!roomId) throw new Error("Missing roomId");
      return multiplayerApi.lobbyHeartbeat(roomId, userId);
    },
    enabled: !!roomId && enabled,
    refetchInterval: (query) => {
        // Stop polling if the game has progressed past the lobby
        const state = query.state.data?.room.status;
        if (state === 'COUNTDOWN' || state === 'IN_PROGRESS' || state === 'FINISHED') {
            return false;
        }
        return enabled ? 2500 : false;
    },
    refetchIntervalInBackground: false,
    retry: 3,
  });

  useEffect(() => {
    if (query.data && enabled) {
      const { room, serverNowMs } = query.data;
      
      // Calculate clock offset (Authoritative Server Time - Client Local Time)
      const clockOffsetMs = serverNowMs - Date.now();

      setGameState({
        state: room.status as any,
        hostReady: room.is_host_ready,
        guestReady: room.is_guest_ready,
        targetStartMs: room.target_start_ms,
        clockOffsetMs,
        // Sync opponent ID for UI cards if guest just joined
        opponentProgress: 0, // Reset on lobby sync to be safe
      });
    }
  }, [query.data, enabled, setGameState]);

  return query;
}
