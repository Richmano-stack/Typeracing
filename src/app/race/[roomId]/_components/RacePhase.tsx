'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useRaceStore } from '@/store/useRaceStore';
import { useRaceSync } from '@/hooks/useRaceSync';
import { multiplayerApi } from '@/services/multiplayerApi';
import { Zap, Trophy, Target, Gauge, MousePointer2 } from 'lucide-react';

interface RacePhaseProps {
    roomId: string;
    userId: string | null;
}

// ── Components ───────────────────────────────────────────────

/**
 * 🏎️ RaceTrack Component
 * Handles the visual representation of both players on the track.
 * Uses framer-motion for smooth 60fps interpolation of progress.
 */
function RaceTrack({ localProgress, opponentProgress, gameState, timeLeft }: { 
    localProgress: number; 
    opponentProgress: number;
    gameState: string;
    timeLeft: number | null;
}) {
    return (
        <div className="relative w-full aspect-[21/7] bg-black/60 border border-white/10 rounded-[2rem] overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.3)]">
            {/* Visual Grid Layer */}
            <div className="absolute inset-0 opacity-[0.03]" 
                 style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
            
            <div className="absolute inset-x-8 inset-y-6 flex flex-col justify-between">
                {/* Lane 1: Local Player (Host/You) */}
                <div className="relative h-1/2 flex items-center border-b border-white/5">
                    <div className="absolute left-0 w-full h-[1px] bg-gradient-to-r from-[#00f3ff]/40 to-transparent" />
                    <motion.div 
                        className="absolute flex flex-col items-center"
                        animate={{ left: `${localProgress}%` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        style={{ x: '-50%' }}
                    >
                        <div className="relative">
                            <div className="absolute -inset-4 bg-[#00f3ff]/20 blur-xl rounded-full animate-pulse" />
                            <div className="w-10 h-10 bg-gray-900 border-2 border-[#00f3ff] rounded-xl flex items-center justify-center relative z-10 shadow-[0_0_15px_rgba(0,243,255,0.4)]">
                                <Zap className="w-5 h-5 text-[#00f3ff]" />
                            </div>
                        </div>
                        <span className="mt-2 text-[8px] font-mono text-[#00f3ff] uppercase tracking-tighter bg-[#00f3ff]/10 px-2 py-0.5 rounded-full border border-[#00f3ff]/20 whitespace-nowrap">You</span>
                    </motion.div>
                </div>

                {/* Lane 2: Opponent */}
                <div className="relative h-1/2 flex items-center">
                    <div className="absolute left-0 w-full h-[1px] bg-gradient-to-r from-[#7700ff]/30 to-transparent" />
                    <motion.div 
                        className="absolute flex flex-col items-center"
                        animate={{ left: `${opponentProgress}%` }}
                        transition={{ type: 'spring', stiffness: 50, damping: 15 }} // Smoother/Slower spring for heartbeat updates
                        style={{ x: '-50%' }}
                    >
                        <div className="relative">
                            <div className="absolute -inset-4 bg-[#7700ff]/10 blur-xl rounded-full" />
                            <div className="w-10 h-10 bg-gray-900 border-2 border-[#7700ff]/50 rounded-xl flex items-center justify-center relative z-10 opacity-80">
                                <MousePointer2 className="w-5 h-5 text-[#7700ff]/60" />
                            </div>
                        </div>
                        <span className="mt-2 text-[8px] font-mono text-[#7700ff]/60 uppercase tracking-tighter whitespace-nowrap">Opponent</span>
                        {/* Finished Indicator */}
                        {gameState !== 'FINISHED' && opponentProgress === 100 && (
                             <div className="absolute -right-6 top-1/2 -translate-y-1/2 ml-2 p-1 bg-[#7700ff]/20 rounded-md animate-pulse">
                                <Trophy className="w-3 h-3 text-[#7700ff]" />
                             </div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Countdown Overlay */}
            {gameState === 'COUNTDOWN' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-8xl font-black text-[#00f3ff] font-mono leading-none drop-shadow-[0_0_30px_rgba(0,243,255,0.6)]"
                    >
                        {timeLeft ?? '...'}
                    </motion.div>
                    <p className="mt-4 text-[#00f3ff] font-mono text-[10px] uppercase tracking-[0.5em] animate-pulse">Get Ready</p>
                </div>
            )}
        </div>
    );
}

/**
 * ⌨️ TypingEngine Component
 * The heart of the zero-latency input.
 */
function TypingEngine({ 
    promptText, 
    onProgressUpdate, 
    gameState, 
    userId, 
    roomId,
    localProgress 
}: { 
    promptText: string; 
    onProgressUpdate: (progress: number, wpm: number) => void;
    gameState: string;
    userId: string | null;
    roomId: string;
    localProgress: number;
}) {
    const [userInput, setUserInput] = useState('');
    const [startTime, setStartTime] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const lastUpdateRef = useRef({ progress: 0, wpm: 0, time: 0 });

    useEffect(() => {
        if (gameState === 'IN_PROGRESS') {
            inputRef.current?.focus();
            if (!startTime) setStartTime(Date.now());
        }
    }, [gameState, startTime]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (gameState !== 'IN_PROGRESS') return;
        const val = e.target.value;
        setUserInput(val);

        // Instant Local Validation
        let correctChars = 0;
        for (let i = 0; i < val.length; i++) {
            if (val[i] === promptText[i]) correctChars++;
            else break;
        }

        const progress = Math.min(100, Math.floor((correctChars / promptText.length) * 100));
        const now = Date.now();
        let wpm = 0;
        if (startTime) {
            const elapsedMins = (now - startTime) / 60000;
            wpm = Math.floor((correctChars / 5) / elapsedMins) || 0;
        }

        // Throttled Global Sync (Vibe over Math)
        const progressChanged = progress !== lastUpdateRef.current.progress;
        const timeToUpdateWpm = now - lastUpdateRef.current.time > 1000;
        const isFinished = progress === 100;

        if (progressChanged || (timeToUpdateWpm && wpm !== lastUpdateRef.current.wpm) || isFinished) {
            onProgressUpdate(progress, wpm);
            lastUpdateRef.current = { progress, wpm, time: now };
        }

        if (isFinished && localProgress < 100) {
            multiplayerApi.saveResults(roomId, userId);
        }
    };

    const renderedText = useMemo(() => {
        return promptText.split('').map((char, i) => {
            let colorClass = 'text-gray-500'; // Upcoming
            let isCurrent = i === userInput.length;
            
            if (i < userInput.length) {
                colorClass = userInput[i] === promptText[i] 
                    ? 'text-[#00f3ff] drop-shadow-[0_0_8px_rgba(0,243,255,0.4)]' 
                    : 'text-red-500 bg-red-500/10 rounded-sm';
            }

            return (
                <span key={i} className={`relative transition-colors duration-75 ${colorClass} ${isCurrent ? 'bg-white/10 rounded-sm' : ''}`}>
                    {char}
                    {isCurrent && (
                        <motion.span 
                            layoutId="cursor"
                            className="absolute left-0 -bottom-1 w-full h-0.5 bg-[#00f3ff]" 
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                    )}
                </span>
            );
        });
    }, [promptText, userInput]);

    return (
        <div className="w-full relative" onClick={() => inputRef.current?.focus()}>
            <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={handleInputChange}
                className="absolute opacity-0 pointer-events-none"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                disabled={localProgress >= 100}
            />
            <div className={`w-full bg-gray-900/30 border border-white/5 rounded-3xl p-10 transition-all duration-500 relative ${gameState === 'COUNTDOWN' ? 'blur-md opacity-20 scale-[0.98]' : 'scale-100 opacity-100 shadow-[20px_20px_60px_rgba(0,0,0,0.4)]'}`}>
                <div className={`relative font-mono text-2xl leading-[1.8] text-justify select-none ${localProgress >= 100 ? 'opacity-30 blur-sm pointer-events-none' : ''}`}>
                    {renderedText}
                </div>
                
                {localProgress >= 100 && gameState === 'IN_PROGRESS' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-20 rounded-3xl animate-in fade-in duration-500">
                        <Trophy className="w-12 h-12 text-yellow-400 mb-4 animate-bounce" />
                        <span className="text-white text-xl font-medium tracking-wide">Finished!</span>
                        <span className="text-emerald-400/80 text-sm font-mono mt-2 animate-pulse">Waiting for opponent...</span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Orchestrator ───────────────────────────────────────────────

export function RacePhase({ roomId, userId }: RacePhaseProps) {
    const { 
        state: gameState, 
        targetStartMs, 
        clockOffsetMs,
        localProgress,
        localWpm,
        opponentProgress,
        opponentFinished,
        promptText,
        updateLocalProgress,
        setGameState,
    } = useRaceStore();

    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    // Sync Pulse (500ms Fire-and-Forget)
    useRaceSync({
        roomId,
        userId,
        currentProgress: localProgress,
        currentWpm: localWpm,
        enabled: gameState === 'COUNTDOWN' || gameState === 'IN_PROGRESS',
    });

    // Countdown Timer
    useEffect(() => {
        if (gameState !== 'COUNTDOWN' || !targetStartMs) return;
        const timer = setInterval(() => {
            const now = Date.now() + (clockOffsetMs || 0);
            const diff = Math.max(0, targetStartMs - now);
            setTimeLeft(Math.ceil(diff / 1000));
            if (diff <= 0) clearInterval(timer);
        }, 100);
        return () => clearInterval(timer);
    }, [gameState, targetStartMs, clockOffsetMs]);

    // TTL Enforcement
    useEffect(() => {
        if (gameState !== 'IN_PROGRESS' || !targetStartMs) return;
        const timer = setInterval(() => {
            const now = Date.now() + (clockOffsetMs || 0);
            if (now - targetStartMs >= 120000) {
                setGameState({ state: 'FINISHED' });
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [gameState, targetStartMs, clockOffsetMs, setGameState]);

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-8 relative">
            
            {/* Header / Stats Bar */}
            <div className="w-full grid grid-cols-3 gap-4 bg-gray-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#00f3ff]/10 rounded-xl border border-[#00f3ff]/20">
                        <Gauge className="w-6 h-6 text-[#00f3ff]" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-mono mb-0.5">Speed</p>
                        <p className="text-xl text-white font-mono font-bold">{localWpm} <span className="text-[10px] text-[#00f3ff]/60 tracking-normal">WPM</span></p>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center border-x border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-mono mb-1">Race Status</p>
                    <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${gameState === 'IN_PROGRESS' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                        <span className="text-xs text-white font-mono uppercase tracking-widest leading-none">
                            {gameState === 'COUNTDOWN' ? 'Awaiting Green' : 'In Flight'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-4">
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-mono mb-0.5">Progress</p>
                        <p className="text-xl text-[#00f3ff] font-mono font-bold">{localProgress}%</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <Trophy className="w-6 h-6 text-yellow-500/80" />
                    </div>
                </div>
            </div>

            {/* Main Stage (The Track) */}
            <RaceTrack 
                localProgress={localProgress} 
                opponentProgress={opponentProgress} 
                gameState={gameState}
                timeLeft={timeLeft}
            />

            {/* Typing Area */}
            {promptText ? (
                <TypingEngine 
                    promptText={promptText}
                    onProgressUpdate={updateLocalProgress}
                    gameState={gameState}
                    userId={userId}
                    roomId={roomId}
                    localProgress={localProgress}
                />
            ) : (
                <div className="w-full h-48 bg-gray-900/30 border border-white/5 rounded-3xl flex flex-col items-center justify-center opacity-40">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#00f3ff]/40 animate-spin mb-4" />
                    <span className="text-xs uppercase tracking-widest text-[#00f3ff]">Decrypting stream...</span>
                </div>
            )}

            {/* Interaction Helper */}
            <div className="flex items-center gap-2 text-gray-700 select-none">
                <Target className="w-3 h-3" />
                <span className="text-[10px] font-mono uppercase tracking-widest">Click anywhere to refocus</span>
            </div>
        </div>
    );
}
