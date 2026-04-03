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
        return enabled ? 1000 : false;
    },
    refetchIntervalInBackground: false,
    retry: 3,
  });

  useEffect(() => {
    if (query.data && enabled) {
      const { room, serverNowMs } = query.data;
      
      // Calculate clock offset (Authoritative Server Time - Client Local Time)
      const clockOffsetMs = serverNowMs - Date.now();

      // Identity Mapping: Who is my opponent?
      const isHost = room.host_id === userId;
      const opponentId = isHost ? room.guest_id : room.host_id;

      setGameState({
        state: room.status as any,
        hostReady: room.is_host_ready,
        guestReady: room.is_guest_ready,
        targetStartMs: room.target_start_ms,
        clockOffsetMs,
        opponentName: opponentId, // Sync opponent identity
        // Sync opponent ID for UI cards if guest just joined
        opponentProgress: 0, // Reset on lobby sync to be safe
      });
    }
  }, [query.data, enabled, setGameState]);

  return query;
}
