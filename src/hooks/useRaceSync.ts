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
  winnerId: string | null;
}

export function useRaceSync({ roomId, userId, currentProgress, currentWpm }: SyncParams) {
  const router = useRouter();
  const setGameState = useRaceStore((state) => state.setGameState);

  const query = useQuery<SyncResponse, Error>({
    queryKey: ['raceSync', roomId],
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
    refetchInterval: 500,
    refetchIntervalInBackground: false,
    retry: (failureCount, error) => {
      if (error.message === '404' || error.message === '403') {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff for 500 errors
    enabled: !!roomId && !!userId,
  });

  // Handle side-effects for errors
  useEffect(() => {
    if (query.error) {
      if (query.error.message === '404') {
        toast.error('Room Expired');
        router.push('/lobby');
      } else if (query.error.message === '403') {
        toast.error('Access Denied');
        router.push('/login');
      }
    }
  }, [query.error, router]);

  // Synchronize successful response with Zustand store
  useEffect(() => {
    if (query.data) {
      const data = query.data;
      const clockOffsetMs = data.serverNowMs - Date.now();

      setGameState({
        state: data.state as any,
        targetStartMs: data.targetStartMs,
        opponentProgress: Number(data.opponentProgress) || 0,
        opponentWpm: Number(data.opponentWpm) || 0,
        winnerId: data.winnerId,
        clockOffsetMs,
      });
    }
  }, [query.data, setGameState]);

  return query;
}
