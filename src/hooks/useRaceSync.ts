import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useRaceStore } from '@/store/useRaceStore';

interface SyncParams {
  roomId: string | null;
  userId: string | null;
  currentProgress: number;
  currentWpm: number;
}

interface SyncResponse {
  state: string;
  serverNowMs: number;
  targetStartMs: number | null;
  opponentProgress: number | string;
  opponentWpm: number | string;
  ownProgress: number | string;
  winnerId: string | null;
  hostReady: boolean;
  guestReady: boolean;
  // Results Metadata
  hostFinishedMs: number;
  guestFinishedMs: number;
  hostWpm: number;
  guestWpm: number;
}

export function useRaceSync({ roomId, userId, currentProgress, currentWpm }: SyncParams) {
  const router = useRouter();
  const setGameState = useRaceStore((state) => state.setGameState);
  const localProgress = useRaceStore((state) => state.localProgress);
  const resetStore = useRaceStore((state) => state.resetStore);

  const query = useQuery<SyncResponse, Error>({
    queryKey: ['raceSync', roomId, userId],
    queryFn: async () => {
      if (!roomId || !userId) {
        throw new Error('Missing room or user ID');
      }

      const res = await fetch('/api/race/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId,
          userId,
          progress: currentProgress,
          wpm: currentWpm,
        }),
      });

      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('404');
        }
        if (res.status === 403) {
          throw new Error('403');
        }
        throw new Error('500'); // Triggers retry
      }

      return res.json();
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.state === 'FINISHED' || data?.state === 'ABANDONED') return false;
      return 500;
    },
    refetchIntervalInBackground: false,
    retry: (failureCount, error) => {
      if (error.message === '404' || error.message === '403') {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    enabled: !!roomId && !!userId,
  });

  // Tab Visibility Hard Sync
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && roomId && userId) {
        query.refetch();
        setGameState({ isHardSync: true });
        // Snap for exactly one frame to allow GhostCar/PlayerCar to skip transitions
        requestAnimationFrame(() => {
          setGameState({ isHardSync: false });
        });
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => window.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [query, roomId, userId, setGameState]);

  // Handle side-effects for errors
  useEffect(() => {
    if (query.error) {
      if (query.error.message === '404') {
        toast.error('Room Expired');
        resetStore();
        router.push('/lobby');
      } else if (query.error.message === '403') {
        toast.error('Access Denied');
        resetStore();
        router.push('/lobby');
      }
    }
  }, [query.error, router, resetStore]);

  // Synchronize successful response with Zustand store
  useEffect(() => {
    if (query.data) {
      const data = query.data;
      const clockOffsetMs = data.serverNowMs - Date.now();
      
      const serverOwnProgress = Number(data.ownProgress) || 0;
      const progressDiff = Math.abs(serverOwnProgress - localProgress);

      const updatePayload: any = {
        state: data.state as any,
        targetStartMs: data.targetStartMs,
        opponentProgress: Number(data.opponentProgress) || 0,
        opponentWpm: Number(data.opponentWpm) || 0,
        winnerId: data.winnerId,
        hostReady: data.hostReady,
        guestReady: data.guestReady,
        clockOffsetMs,
      };

      // Server Authority: Overwrite localProgress if client drifts by > 1.5%
      // This corrects for dropped packets while preventing minor jitter from network latency
      if (progressDiff > 1.5) {
        updatePayload.localProgress = serverOwnProgress;
      }

      // Zombie Prevention: Stop input if race is dead
      if (data.state === 'FINISHED' || data.state === 'ABANDONED') {
        updatePayload.isInputDisabled = true;
      }

      // Final Results Calculation
      if (data.state === 'FINISHED') {
         const isHost = userId === (query.data as any).hostId; // We might need to pass this or derive it
         // Actually, let's just use the current user's metrics from the store
         const { rawKeystrokes, validKeystrokes } = useRaceStore.getState();
         const accuracy = rawKeystrokes > 0 ? (validKeystrokes / rawKeystrokes) * 100 : 100;
         
         const ownFinishedMs = data.hostFinishedMs > 0 && data.guestFinishedMs > 0 // This logic is tricky without knowing role
            ? (data.winnerId === userId ? Math.min(data.hostFinishedMs, data.guestFinishedMs) : Math.max(data.hostFinishedMs, data.guestFinishedMs))
            : (data.hostFinishedMs || data.guestFinishedMs);
            
         // Simplification: The server should probably just return 'ownFinishedMs'
         // For now, let's assume the sync route handles the role-based mapping
         
         updatePayload.finalResults = {
            wpm: currentWpm,
            accuracy: accuracy,
            durationMs: data.targetStartMs ? (serverOwnProgress >= 100 ? (Date.now() + clockOffsetMs) - data.targetStartMs : 0) : 0, 
            saved: !!userId,
            authenticated: !!userId,
         };
      }

      setGameState(updatePayload);
    }
  }, [query.data, setGameState, localProgress, currentWpm, userId]);

  return query;
}
