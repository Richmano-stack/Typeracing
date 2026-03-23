'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from "@/lib/auth-client";
import { useRaceSync } from '@/hooks/useRaceSync';
import { useRaceStore } from '@/store/useRaceStore';
import { TypeInput } from '@/components/game/TypeInput';
import { GhostCar } from '@/components/game/GhostCar';
import { PlayerCar } from '@/components/game/PlayerCar';
import { InviteLinkCard } from '@/components/game/InviteLinkCard';
import ResultsModal from '@/components/ResultsModal';
import { Loader2, Play, AlertCircle, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { raceApi } from '@/services/raceApi';
import { motion, AnimatePresence } from 'framer-motion';

interface RoomData {
  prompt_text: string;
  state: string;
  target_start_ms: number;
  host_id: string;
  guest_id: string | null;
  host_ready: boolean;
  guest_ready: boolean;
}

export default function RacePage({ params }: { params: Promise<{ roomId: string }> }) {
    const { roomId } = use(params);
    const router = useRouter();
    const { data: session, isPending: isSessionLoading } = authClient.useSession();
    const userId = session?.user?.id || null;

    // Zustand Game State
    const { 
        state: gameState, 
        targetStartMs, 
        clockOffsetMs, 
        localProgress, 
        localWpm, 
        guestReady,
        hostReady,
        resetStore 
    } = useRaceStore();

    // Local State for Room Rehydration
    const [roomData, setRoomData] = useState<RoomData | null>(null);
    const [isRoomLoading, setIsRoomLoading] = useState(true);

    // Identify Role
    const isHost = userId === roomData?.host_id;
    const isGuest = userId === roomData?.guest_id;
    const opponentReady = isHost ? guestReady : hostReady;

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
            console.log("[RacePage] Cleaning up store...");
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

    // Handlers
    const handleReady = async () => {
        if (!userId || !roomId) return;
        try {
            await raceApi.ready(roomId, userId);
            toast.success("Ready for the duel!");
        } catch (err) {
            toast.error("Failed to ready up");
        }
    };

    const handleStartRace = async () => {
        if (!userId || !roomId) return;
        try {
            await raceApi.startMultiplayer(roomId, userId);
        } catch (err) {
            toast.error("Failed to start race");
        }
    };

    if (isSessionLoading || isRoomLoading) {
        return (
            <div className="min-h-[calc(100vh-64px)] bg-[#050505] text-white flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#00f3ff] animate-spin" />
                <p className="mt-4 text-[#00f3ff] font-mono tracking-widest text-sm uppercase">Loading Instance...</p>
            </div>
        );
    }

    if (!roomData) return null;

    const isFinished = gameState === 'FINISHED';
    const isAbandoned = gameState === 'ABANDONED';

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#050505] text-white flex flex-col items-center pt-24 px-4 overflow-x-hidden font-mono relative mt-16 pb-20">
            
            {/* Abandoned Overlay */}
            <AnimatePresence>
                {isAbandoned && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#0f0f0f] border-2 border-rose-500/30 p-10 rounded-3xl flex flex-col items-center max-w-md w-full shadow-[0_0_100px_rgba(244,63,94,0.2)] text-center"
                        >
                            <div className="bg-rose-500/10 p-5 rounded-full mb-6 border border-rose-500/30">
                                <AlertCircle className="w-12 h-12 text-rose-500" />
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4 text-white">
                                Race Cancelled
                            </h2>
                            <p className="text-white/50 text-sm mb-10 leading-relaxed font-sans">
                                Connection to the opponent was terminated or they abandoned the duel. The session is no longer valid.
                            </p>
                            <button 
                                onClick={() => router.push('/lobby')}
                                className="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-white/90 transition-all py-5 rounded-2xl font-black tracking-[0.2em] uppercase text-sm"
                            >
                                <LogOut className="w-4 h-4" />
                                Return to Lobby
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="w-full max-w-5xl relative z-10 flex flex-col gap-6">
                
                {/* Header Info */}
                <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-xl p-4 px-6 shadow-inner">
                    <div className="flex items-center gap-4">
                        <div className="py-1 px-3 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded text-xs font-black tracking-widest uppercase">
                            Multiplayer Duel
                        </div>
                        <span className="font-mono text-white/50 text-xs tracking-widest opacity-40 uppercase">Room // {roomId}</span>
                    </div>
                </div>

                {/* Game Board (Tracks) */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-sm">
                    <GhostCar opponentName="Opponent" />
                    <PlayerCar />
                </div>

                {/* Type Input Area */}
                <div className="mt-4">
                     <TypeInput promptText={roomData.prompt_text} />
                </div>
            </div>

            {/* Overlays */}
            <AnimatePresence>
                {/* 1. LOBBY_WAITING - Instant unmount on COUNTDOWN */}
                {gameState === 'LOBBY' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, transition: { duration: 0.1 } }} // Fast exit for pulse transition
                        className="fixed inset-0 z-40 bg-black/80 backdrop-blur-xl flex items-center justify-center pt-16"
                    >
                        <div className="bg-[#0f0f0f] border border-[#00f3ff]/30 p-10 rounded-3xl flex flex-col items-center max-w-md w-full shadow-[0_0_80px_rgba(0,243,255,0.15)]">
                            
                            <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 text-center text-white">
                                {isHost ? "Duel Chamber" : "Challenger Joined"}
                            </h2>
                            
                            <div className="w-full flex flex-col gap-6">
                                <InviteLinkCard roomId={roomId!} />

                                {/* Ready Indicators */}
                                <div className="grid grid-cols-2 gap-3 mb-2">
                                    <div className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${hostReady ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Host</span>
                                        <span className="text-xs font-bold">{hostReady ? 'READY' : 'PREPARING'}</span>
                                    </div>
                                    <div className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${guestReady ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Guest</span>
                                        <span className="text-xs font-bold">{guestReady ? 'READY' : 'PREPARING'}</span>
                                    </div>
                                </div>

                                {/* Host Controls */}
                                {isHost && (
                                    <button 
                                        disabled={!opponentReady}
                                        onClick={handleStartRace}
                                        className="w-full bg-[#00f3ff] hover:bg-[#00f3ff]/90 disabled:bg-white/5 disabled:text-white/20 disabled:border-white/5 text-black transition-all py-5 rounded-2xl font-black tracking-[0.2em] uppercase text-sm shadow-[0_0_40px_rgba(0,243,255,0.3)] disabled:shadow-none mt-2"
                                    >
                                        Start Duel
                                    </button>
                                )}

                                {/* Guest Controls */}
                                {isGuest && (
                                    <>
                                        {guestReady ? (
                                            <div className="w-full flex flex-col items-center gap-4 py-4">
                                                <p className="text-[#00f3ff] text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">
                                                    Waiting for host to initiate sequence...
                                                </p>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={handleReady}
                                                className="w-full bg-[#00f3ff] hover:bg-[#00f3ff]/90 text-black transition-all py-5 rounded-2xl font-black tracking-[0.2em] uppercase text-sm shadow-[0_0_30px_rgba(0,243,255,0.3)]"
                                            >
                                                READY UP
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 2. COUNTDOWN */}
                {gameState === 'COUNTDOWN' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center"
                    >
                        <div className="flex flex-col items-center">
                            {countdownTime > 0 ? (
                                <>
                                    <motion.div 
                                        key={countdownTime}
                                        initial={{ scale: 1.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-[14rem] font-black tracking-tighter text-white drop-shadow-[0_0_80px_rgba(255,255,255,0.2)] select-none pointer-events-none leading-none"
                                    >
                                        {countdownTime}
                                    </motion.div>
                                    <div className="mt-8 text-[#00f3ff] font-black tracking-[0.5em] uppercase text-xl animate-bounce">
                                        Ignition
                                    </div>
                                </>
                            ) : (
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1.2, opacity: 1 }}
                                    className="flex items-center gap-6 drop-shadow-[0_0_100px_rgba(0,243,255,0.8)]"
                                >
                                    <Play className="w-32 h-32 fill-[#00f3ff] text-[#00f3ff]" />
                                    <span className="text-[10rem] font-black tracking-tighter uppercase italic pr-8 text-[#00f3ff]">GO!</span>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. FINISHED (Result Modal) */}
            <ResultsModal 
                isOpen={isFinished} 
                isLoading={false} 
                onReset={async () => {
                    if (!roomId || !userId) return;
                    try {
                        await raceApi.reset(roomId, userId);
                        toast.success("Room reset. Ready up!");
                    } catch (err) {
                        toast.error("Failed to reset room");
                        router.push('/lobby');
                    }
                }} 
            />

        </div>
    );
}

