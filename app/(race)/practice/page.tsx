"use client";

import React, { useEffect, useMemo, useRef } from 'react';
import { RefreshCw, Trophy, Zap, AlertTriangle } from 'lucide-react';
import { TYPING_TEXTS } from '@/lib/texts';
import { useRaceStore } from '@/lib/useRaceStore';
import { useTimerStore } from '@/lib/useTimerStore';
import CyberButton from '@/components/ui/CyberButton';
import CyberCard from '@/components/ui/CyberCard';

const MAX_ERRORS = 10;

const PracticePage: React.FC = () => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [bestWpm, setBestWpm] = React.useState<number | null>(null);

    // Race store
    const {
        text,
        userInput,
        status,
        wpm,
        accuracy,
        errors,
        initializeRace,
        setUserInput,
        startRace,
        resetRace,
    } = useRaceStore();

    // Timer store
    const {
        elapsed: timer,
        startTimer,
        resetTimer,
        tick,
    } = useTimerStore();

    // Load best WPM from localStorage on mount
    useEffect(() => {
        const randomText = TYPING_TEXTS[Math.floor(Math.random() * TYPING_TEXTS.length)];
        initializeRace(randomText, '0', 'practice');
        resetTimer(); // Ensure timer is reset on mount - timer will only start when user types

        const saved = localStorage.getItem('bestWpm');
        if (saved) setBestWpm(parseInt(saved));
    }, [initializeRace, resetTimer]);

    // Save best WPM when race finishes
    useEffect(() => {
        if (status === 'finished' && wpm > 0) {
            if (bestWpm === null || wpm > bestWpm) {
                setBestWpm(wpm);
                localStorage.setItem('bestWpm', wpm.toString());
            }
        }
    }, [status, wpm, bestWpm]);

    const handleReset = () => {
        const newText = TYPING_TEXTS[Math.floor(Math.random() * TYPING_TEXTS.length)];
        initializeRace(newText, '0', 'practice');
        resetTimer(); // Reset timer when race is reset
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const renderText = useMemo(() => {
        const textChars = text.split('');
        const inputChars = userInput.split('');
        return textChars.map((char, index) => {
            const inputChar = inputChars[index];
            let className = '';
            if (index < inputChars.length) {
                className = inputChar === char ? 'correct-char' : 'wrong-char';
            } else {
                className = 'untyped-char';
            }
            if (index === inputChars.length && status === 'running') {
                className += ' current-char-position';
            }
            return <span key={index} className={className}>{char}</span>;
        });
    }, [text, userInput, status]);

    const handleUserInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;

        if (status === "finished") return;
        if (errors >= MAX_ERRORS && newValue.length > userInput.length) return;

        // Start race and timer ONLY on first input (when status is idle and user starts typing)
        // This ensures timer doesn't start until user actually begins typing
        if (status === "idle" && newValue.length > 0 && userInput.length === 0) {
            startRace();
            startTimer();
        }

        setUserInput(newValue);
    };

    // Timer tick
    useEffect(() => {
        if (status !== 'running') return;
        const interval = setInterval(() => tick(), 1000);
        return () => clearInterval(interval);
    }, [status, tick]);

    const progressPercentage = text.length > 0
        ? (userInput.length / text.length) * 100
        : 0;

    return (
        <div className="min-h-screen flex flex-col items-center p-4 md:p-8 relative z-10">
            {/* HUD Header */}
            <div className="w-full max-w-5xl mb-8 flex justify-between items-end border-b border-[var(--border)] pb-4">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-widest text-white flex items-center gap-2">
                        <Zap className="text-[var(--primary)]" />
                        Practice Protocol
                    </h1>
                    <p className="text-[var(--text-secondary)] text-xs font-mono">
                        STATUS: {status === 'running' ? 'ACTIVE' : status.toUpperCase()}
                    </p>
                </div>

                {status !== 'finished' && (
                    <div className="flex gap-8 font-mono text-xl">
                        <div className="text-center">
                            <span className="text-[var(--text-secondary)] text-xs block">TIMER</span>
                            <span className="text-white">{timer}s</span>
                        </div>
                        <div className="text-center">
                            <span className="text-[var(--text-secondary)] text-xs block">WPM</span>
                            <span className="text-[var(--primary)] drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">{wpm}</span>
                        </div>
                        <div className="text-center">
                            <span className="text-[var(--text-secondary)] text-xs block">ACCURACY</span>
                            <span className={accuracy < 90 ? 'text-[var(--error)]' : 'text-[var(--success)]'}>
                                {accuracy.toFixed(0)}%
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Personal Best Display */}
            {bestWpm !== null && (
                <div className="w-full max-w-4xl mb-6">
                    <CyberCard className="border-[var(--accent)]">
                        <div className="flex items-center justify-center gap-2">
                            <Trophy size={20} className="text-[var(--accent)]" />
                            <span className="text-white font-mono">
                                Personal Best: <span className="text-[var(--accent)] font-bold">{bestWpm} WPM</span>
                            </span>
                        </div>
                    </CyberCard>
                </div>
            )}

            {/* Main Practice Area */}
            <div className="w-full max-w-4xl relative">
                {/* Text Display (Cockpit) */}
                <div
                    className="relative p-8 md:p-12 bg-black/40 border border-[var(--border)] rounded-lg backdrop-blur-md min-h-[200px] text-2xl md:text-3xl font-mono leading-relaxed break-words shadow-[inset_0_0_50px_rgba(0,0,0,0.5)]"
                    onClick={() => inputRef.current?.focus()}
                >
                    {/* Corner Accents */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--primary)]" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--primary)]" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[var(--primary)]" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--primary)]" />

                    {renderText}

                    {/* Hidden Input */}
                    {status !== 'finished' && (
                        <input
                            ref={inputRef}
                            className="absolute inset-0 opacity-0 cursor-default"
                            value={userInput}
                            onChange={handleUserInput}
                            autoFocus
                        />
                    )}
                </div>

                {/* Error Warning */}
                {errors > 0 && status === 'running' && (
                    <div className="mt-4 flex items-center justify-center text-[var(--error)] animate-pulse font-mono font-bold">
                        <AlertTriangle size={20} className="mr-2" />
                        WARNING: INTEGRITY COMPROMISED ({errors}/{MAX_ERRORS})
                    </div>
                )}

                {/* Reset Button (when not finished) */}
                {status !== 'finished' && (
                    <div className="mt-6 flex justify-center">
                        <CyberButton onClick={handleReset} variant="secondary">
                            <RefreshCw size={18} /> RESET PRACTICE
                        </CyberButton>
                    </div>
                )}
            </div>

            {/* Results Modal */}
            {status === 'finished' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <CyberCard className="max-w-2xl w-full animate-in fade-in zoom-in duration-300 border-[var(--primary)] shadow-[0_0_50px_rgba(0,243,255,0.2)]">
                        <div className="text-center mb-8">
                            <h2 className="text-4xl font-black uppercase text-white mb-2" style={{ textShadow: '0 0 20px var(--primary)' }}>
                                {bestWpm !== null && wpm > bestWpm ? 'NEW RECORD!' : 'Practice Complete'}
                            </h2>
                            <p className="text-[var(--text-secondary)] font-mono">SESSION TERMINATED</p>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-black/40 p-4 rounded border border-[var(--border)] text-center">
                                <div className="text-[var(--text-secondary)] text-xs uppercase mb-1">Speed</div>
                                <div className="text-4xl font-black text-[var(--primary)]">{wpm}</div>
                                <div className="text-xs text-[var(--text-muted)]">WPM</div>
                            </div>
                            <div className="bg-black/40 p-4 rounded border border-[var(--border)] text-center">
                                <div className="text-[var(--text-secondary)] text-xs uppercase mb-1">Precision</div>
                                <div className="text-4xl font-black text-[var(--success)]">{accuracy.toFixed(0)}%</div>
                                <div className="text-xs text-[var(--text-muted)]">ACCURACY</div>
                            </div>
                            <div className="bg-black/40 p-4 rounded border border-[var(--border)] text-center">
                                <div className="text-[var(--text-secondary)] text-xs uppercase mb-1">Time</div>
                                <div className="text-4xl font-black text-white">{timer}s</div>
                                <div className="text-xs text-[var(--text-muted)]">DURATION</div>
                            </div>
                        </div>

                        {bestWpm !== null && (
                            <div className="mb-8 p-4 bg-[var(--bg-surface)] rounded border border-[var(--border)]">
                                <h3 className="text-sm font-bold uppercase text-[var(--text-secondary)] mb-2">Personal Best</h3>
                                <div className="flex justify-between items-center font-mono">
                                    <span>Highest WPM: <span className="text-white">{bestWpm}</span></span>
                                    <span>Errors: <span className="text-white">{errors}</span></span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center gap-4">
                            <CyberButton onClick={handleReset} glow>
                                <RefreshCw size={18} /> PRACTICE AGAIN
                            </CyberButton>
                        </div>
                    </CyberCard>
                </div>
            )}
        </div>
    );
};

export default PracticePage;