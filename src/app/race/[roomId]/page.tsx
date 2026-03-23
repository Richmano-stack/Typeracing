'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from "@/lib/auth-client";
import { useRaceSync } from '@/hooks/useRaceSync';
import { useRaceStore } from '@/store/useRaceStore';
import { TypeInput } from '@/components/game/TypeInput';
import { GhostCar } from '@/components/game/GhostCar';
import { PlayerCar } from '@/components/game/PlayerCar';
import ResultsModal from '@/components/ResultsModal';
import { Copy, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';

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

    const userId = session?.user?.id || null;

    // Zustand Game State
    const { 
        state: gameState, 
        targetStartMs, 
        clockOffsetMs, 
        localProgress, 
        localWpm, 
        resetStore 
    } = useRaceStore();

    // Fetch Initial Room Meta
    useEffect(() => {
        if (!roomId) {
            router.push('/lobby');
            return;
        }

        const fetchRoomData = async () => {
             try {
                const res = await fetch(`/api/race/${roomId}`);
                if (!res.ok) {
                   if (res.status === 404) {
                       toast.error('Room Expired or Not Found');
                       router.push('/lobby');
                       return;
                   }
                   throw new Error('Failed to load room');
                }
                const data = await res.json();
                setRoomData(data.room);
             } catch (error) {
                console.error(error);
                toast.error('Connection error');
                router.push('/lobby');
             } finally {
                setIsRoomLoading(false);
             }
        };

        fetchRoomData();
    }, [roomId, router]);

    // Handle Clean Exit
    useEffect(() => {
        return () => {
            resetStore();
        };
    }, [resetStore]);

    // Core Sync Loop
    useRaceSync({
        roomId,
        userId,
        currentProgress: localProgress,
        currentWpm: localWpm,
    });

    // Countdown Logic for Overlays
    const [countdownTime, setCountdownTime] = useState(3);

    useEffect(() => {
        if (gameState !== 'COUNTDOWN' || !targetStartMs || clockOffsetMs === null) return;

        let frameId: number;
        
        const updateCountdown = () => {
            const serverNow = Date.now() + clockOffsetMs;
            const remainingSec = Math.ceil((targetStartMs - serverNow) / 1000);
            
            if (remainingSec >= 0) {
                setCountdownTime(remainingSec);
            }
            
            frameId = requestAnimationFrame(updateCountdown);
        };

        frameId = requestAnimationFrame(updateCountdown);
        return () => cancelAnimationFrame(frameId);
    }, [gameState, targetStartMs, clockOffsetMs]);

    // Invite Link Copy
    const handleCopyInvite = () => {
        const url = `${window.location.origin}/race/${roomId}`;
        navigator.clipboard.writeText(url).then(() => {
            toast.success("Invite link copied to clipboard");
        }).catch(() => {
            toast.error("Failed to copy link");
        });
    };

    if (isSessionLoading || isRoomLoading) {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-[#050505] text-white flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#00f3ff] animate-spin" />
                <p className="mt-4 text-[#00f3ff] font-mono tracking-widest text-sm uppercase">Loading Instance...</p>
            </div>
        );
    }

    if (!roomData) return null; // Wait for room logic to redirect

    // Derive mock Results for MVP until backend /result route is implemented
    const isFinished = gameState === 'FINISHED';
    const mockResults = isFinished ? {
        wpm: localWpm,
        accuracy: 100, // Derived accuracy logic could be added
        durationMs: 0,
        saved: !!userId,
        authenticated: !!userId
    } : null;

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#050505] text-white flex flex-col items-center pt-24 px-4 overflow-x-hidden font-mono relative mt-16">
            <div className="w-full max-w-5xl relative z-10 flex flex-col gap-6">
                
                {/* Header Info */}
                <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl p-4 px-6 shadow-inner">
                    <div className="flex items-center gap-4">
                        <div className="py-1 px-3 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded text-xs font-black tracking-widest uppercase">
                            VS MODE
                        </div>
                        <span className="font-mono text-white/50 text-sm">ROOM: {roomId}</span>
                    </div>
                </div>

                {/* Game Board (Tracks) */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-sm">
                    {/* Ghost Car (Opponent) */}
                    <GhostCar opponentName="Opponent" />

                    {/* Player Car */}
                    <PlayerCar />
                </div>

                {/* Type Input Area */}
                <div className="mt-4">
                     <TypeInput promptText={roomData.prompt_text} />
                </div>
            </div>

            {/* OVERLAYS */}

            {/* 1. LOBBY_WAITING */}
            {gameState === 'LOBBY' && (
                <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-lg flex items-center justify-center pt-16">
                    <div className="bg-[#0f0f0f] border border-[#00f3ff]/30 p-8 rounded-2xl flex flex-col items-center max-w-sm w-full shadow-[0_0_50px_rgba(0,243,255,0.1)]">
                        <Loader2 className="w-12 h-12 text-[#00f3ff] animate-spin mb-6" />
                        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 text-center text-white">Awaiting Opponent</h2>
                        <p className="text-white/50 text-sm mb-8 text-center">Share the link below to invite a challenger to this duel instance.</p>
                        
                        <button 
                            onClick={handleCopyInvite}
                            className="w-full flex items-center justify-center gap-2 bg-[#00f3ff]/10 hover:bg-[#00f3ff]/20 text-[#00f3ff] border border-[#00f3ff]/30 transition-colors py-3 px-6 rounded-lg font-bold tracking-widest uppercase text-sm"
                        >
                            <Copy className="w-4 h-4" />
                            Copy Invite Link
                        </button>
                    </div>
                </div>
            )}

            {/* 2. COUNTDOWN */}
            {gameState === 'COUNTDOWN' && (
                <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center pt-16">
                    <div className="animate-in zoom-in slide-in-from-bottom-4 duration-300 flex items-center justify-center">
                        {countdownTime > 0 ? (
                            <div className="text-[12rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20 animate-pulse drop-shadow-[0_0_40px_rgba(255,255,255,0.3)] select-none pointer-events-none">
                                {countdownTime}
                            </div>
                        ) : (
                            <div className="flex items-center gap-6 text-[#00f3ff] animate-[pulse_0.5s_ease-in-out_infinite] scale-150 drop-shadow-[0_0_60px_rgba(0,243,255,0.6)] select-none pointer-events-none">
                                <Play className="w-24 h-24 fill-[#00f3ff]" />
                                <span className="text-8xl font-black tracking-tighter uppercase italic pr-8">GO!</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 3. FINISHED (Result Modal) */}
            <ResultsModal 
                isOpen={isFinished} 
                isLoading={false} 
                results={mockResults} 
                onReset={() => router.push('/dashboard')} 
            />

        </div>
    );
}
