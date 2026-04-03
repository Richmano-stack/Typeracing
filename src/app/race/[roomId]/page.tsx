'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from "@/lib/auth-client";
import { useRaceSync } from '@/hooks/useRaceSync';
import { useLobbyPolling } from '@/hooks/useLobbyPolling';
import { useRaceStore } from '@/store/useRaceStore';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { LobbyPhase } from './_components/LobbyPhase';
import { RacePhase } from './_components/RacePhase';
import { ResultsPhase } from './_components/ResultsPhase';

interface RoomData {
  prompt_text: string;
  state: string;
  target_start_ms: string | null;
  host_id: string;
  guest_id: string | null;
}

export default function RacePage({ params }: { params: Promise<{ roomId: string }> }) {
    const { roomId } = use(params);
    const router = useRouter();
    const { data: session, isPending: isSessionLoading } = authClient.useSession();
    
    // Local State for Room Rehydration
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const [isRoomLoading, setIsRoomLoading] = useState(true);
    const [persistentGuestId, setPersistentGuestId] = useState<string | null>(null);

    // Consolidated User Identity
    const userId = session?.user?.id || persistentGuestId;

    // Handle Persistent Guest Identity for Session
    useEffect(() => {
        if (!session?.user?.id) {
            let gid = localStorage.getItem('typeracing_guest_id');
            if (!gid) {
                gid = `guest-${crypto.randomUUID()}`;
                localStorage.setItem('typeracing_guest_id', gid);
            }
            setPersistentGuestId(gid);
        }
    }, [session?.user?.id]);

    // Zustand Game State
    const { 
        state: gameState, 
        role,
        targetStartMs, 
        clockOffsetMs, 
        localProgress, 
        localWpm, 
        resetStore,
        setGameState,
    } = useRaceStore();

    // 1. Hook Handover (Single Source of Truth)
    const isLobbyPhase = 
      gameState === 'LOBBY' || 
      gameState === 'WAITING_FOR_GUEST' || 
      gameState === 'LOBBY_FULL' || 
      gameState === 'READY_CHECK';

    const isFinished = gameState === 'FINISHED';

    // Phase 2 hook: active during lobby only
    const lobbyQuery = useLobbyPolling({
      roomId,
      userId,
      enabled: isLobbyPhase,
    });

    // Phase 4 hook: active during race only
    useRaceSync({
      roomId,
      userId,
      currentProgress: localProgress,
      currentWpm: localWpm,
      enabled: false, // Disabled for this step as requested
    });

    // Initial Rehydration (Only if not already set or lobby needs it)
    useEffect(() => {
        if (!roomId || !isLobbyPhase) return;
        
        // Debug Bypass
        if (roomId === 'test') {
            setRoomData({
                prompt_text: "Debug bypass prompt text.",
                state: "WAITING_FOR_GUEST",
                target_start_ms: null,
                host_id: "test",
                guest_id: null,
            });
            setGameState({ state: 'WAITING_FOR_GUEST' });
            setIsRoomLoading(false);
            return;
        }

        const initRoom = async () => {
            try {
                const res = await fetch(`/api/race/${roomId}`);
                if (res.ok) {
                    const data = await res.json();
                    setRoomData(data.room);
                    setGameState({ 
                        state: data.room.state,
                        targetStartMs: data.room.target_start_ms 
                    });
                } else if (res.status === 404) {
                    router.push('/dashboard');
                }
            } catch (error) {
                console.error("Initial rehydration failed", error);
            } finally {
                setIsRoomLoading(false);
            }
        };

        if (isRoomLoading && userId) {
            initRoom();
        }
    }, [roomId, isLobbyPhase, isRoomLoading, setGameState, router, userId]);

    // Identity Assignment: determine role once roomData is available
    useEffect(() => {
        if (!roomData) return;

        // Test bypass: always treat as host when using the debug room
        if (roomId === 'test') {
            setGameState({ role: 'host' });
            return;
        }

        if (!userId) return;

        const assignedRole = roomData.host_id === userId ? 'host' : 'guest';
        setGameState({ role: assignedRole });
    }, [roomData, userId, roomId, setGameState]);

    // Keep local roomData in sync for prompt_text
    useEffect(() => {
        if (roomId !== 'test' && lobbyQuery.data?.room?.prompt_text) {
            setRoomData((prev) => prev ? ({
                ...prev,
                prompt_text: lobbyQuery.data.room.prompt_text,
                state: lobbyQuery.data.room.status,
            }) : null);
        }
    }, [lobbyQuery.data, roomId]);


    if (isSessionLoading || isRoomLoading) {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-[#050505] text-white flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#00f3ff] animate-spin" />
                <p className="mt-4 text-[#00f3ff] font-mono tracking-widest text-sm uppercase">Loading Instance...</p>
            </div>
        );
    }

    if (!roomData) return null; // Wait for room logic to redirect

    const renderPhase = () => {
        if (isLobbyPhase) return <LobbyPhase roomId={roomId} userId={userId} />;
        if (isFinished) return <ResultsPhase />;
        return <RacePhase />;
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#050505] text-white flex flex-col items-center pt-24 px-4 overflow-x-hidden font-mono relative mt-16">
            {renderPhase()}

            {roomId === 'test' && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/90 border border-[#00f3ff]/30 p-4 rounded-xl shadow-[0_0_20px_rgba(0,243,255,0.2)] flex gap-4 z-50 backdrop-blur-sm">
                    <button 
                        onClick={() => setGameState({ state: 'WAITING_FOR_GUEST' })} 
                        className="px-4 py-2 bg-slate-800 text-white border border-slate-600 rounded-lg hover:bg-slate-700 flex items-center gap-2 font-mono text-sm"
                    >
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        Lobby
                    </button>
                    <button 
                        onClick={() => setGameState({ state: 'COUNTDOWN' })} 
                        className="px-4 py-2 bg-slate-800 text-white border border-slate-600 rounded-lg hover:bg-slate-700 flex items-center gap-2 font-mono text-sm"
                    >
                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                        Race
                    </button>
                    <button 
                        onClick={() => setGameState({ state: 'FINISHED' })} 
                        className="px-4 py-2 bg-slate-800 text-white border border-slate-600 rounded-lg hover:bg-slate-700 flex items-center gap-2 font-mono text-sm"
                    >
                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                        Results
                    </button>
                </div>
            )}
        </div>
    );
}

