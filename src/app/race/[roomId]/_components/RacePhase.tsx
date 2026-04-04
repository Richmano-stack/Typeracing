'use client';

import React, { useState, useEffect } from 'react';
import { useRaceStore } from '@/store/useRaceStore';
import { Timer, Zap, Trophy, Target } from 'lucide-react';

export function RacePhase() {
    const { 
        state: gameState, 
        targetStartMs, 
        clockOffsetMs,
        localProgress,
        opponentProgress,
    } = useRaceStore();

    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    // Synchronized Countdown Logic
    useEffect(() => {
        if (gameState !== 'COUNTDOWN' || !targetStartMs) return;

        const timer = setInterval(() => {
            const now = Date.now() + (clockOffsetMs || 0);
            const diff = Math.max(0, targetStartMs - now);
            setTimeLeft(Math.ceil(diff / 1000));

            if (diff <= 0) {
                clearInterval(timer);
            }
        }, 100);

        return () => clearInterval(timer);
    }, [gameState, targetStartMs, clockOffsetMs]);

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-12">
            
            {/* Header / Stats Bar */}
            <div className="w-full flex justify-between items-center bg-gray-900/50 border border-white/10 rounded-2xl px-8 py-4 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#00f3ff]/10 rounded-lg">
                        <Timer className="w-5 h-5 text-[#00f3ff]" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Status</p>
                        <p className="text-sm text-white font-mono uppercase tracking-wider">
                            {gameState === 'COUNTDOWN' ? 'Starting Soon' : 'Race in Progress'}
                        </p>
                    </div>
                </div>
                
                <div className="flex gap-8">
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Your Progress</p>
                        <p className="text-sm text-[#00f3ff] font-mono">{localProgress}%</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Opponent</p>
                        <p className="text-sm text-[#7700ff] font-mono">{opponentProgress}%</p>
                    </div>
                </div>
            </div>

            {/* Main Stage */}
            <div className="relative w-full aspect-[21/9] bg-black/40 border border-[#00f3ff]/20 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                {/* Decorative Grid / Track */}
                <div className="absolute inset-0 opacity-20" 
                     style={{ backgroundImage: 'linear-gradient(#00f3ff 1px, transparent 1px), linear-gradient(90deg, #00f3ff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                
                {gameState === 'COUNTDOWN' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                        <div className="text-[120px] font-black text-[#00f3ff] font-mono leading-none drop-shadow-[0_0_30px_rgba(0,243,255,0.8)] animate-pulse">
                            {timeLeft ?? '...'}
                        </div>
                        <div className="mt-4 flex items-center gap-2 px-4 py-1 bg-[#00f3ff]/20 border border-[#00f3ff]/40 rounded-full">
                            <Zap className="w-3 h-3 text-[#00f3ff] animate-bounce" />
                            <span className="text-[10px] text-[#00f3ff] font-mono uppercase tracking-[0.3em]">Ignition Sequence</span>
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center p-12">
                        <div className="w-full text-center">
                            <div className="inline-flex items-center gap-2 px-6 py-2 bg-green-500/10 border border-green-500/30 rounded-full mb-8">
                                <Target className="w-4 h-4 text-green-400" />
                                <span className="text-xs text-green-400 font-mono uppercase tracking-widest">Type the content below</span>
                            </div>
                            <div className="text-2xl font-mono text-gray-400 leading-relaxed max-w-2xl mx-auto italic">
                                Ready to reveal prompt...
                            </div>
                        </div>
                    </div>
                )}

                {/* Aesthetic Accents */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent opacity-50" />
                <div className="absolute top-4 left-4 flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500/50" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                </div>
            </div>

            {/* Bottom Controls / Prompt Placeholder */}
            <div className="w-full h-32 flex items-center justify-center border-t border-dashed border-white/5 mt-4">
                <p className="text-gray-600 font-mono text-xs uppercase tracking-[0.5em] animate-pulse">
                    Waiting for text stream...
                </p>
            </div>
        </div>
    );
}
