"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw, Save, Trophy, Clock, Target, Zap, Play, AlertTriangle } from 'lucide-react';
import { TYPING_TEXTS } from '@/lib/texts';
import { saveGuestRace } from '@/lib/guestStats';
import { useRouter } from 'next/navigation';
import CyberButton from '@/components/ui/CyberButton';
import CyberCard from '@/components/ui/CyberCard';

const MAX_ERRORS = 10;

interface RaceState {
    text: string;
    textId: string;
    userInput: string;
    status: 'idle' | 'countdown' | 'running' | 'finished';
    startTime: number | null;
    endTime: number | null;
    wpm: number;
    accuracy: number;
    errors: number;
    charsTyped: number;
    charsCorrect: number;
}

interface Racer {
    id: string;
    nickname: string;
    progress: number;
    wpm: number;
    isCurrentUser: boolean;
}

export default function QuickRacePage() {
    const router = useRouter();
    const [raceState, setRaceState] = useState<RaceState>({
        text: '',
        textId: '',
        userInput: '',
        status: 'idle',
        startTime: null,
        endTime: null,
        wpm: 0,
        accuracy: 100,
        errors: 0,
        charsTyped: 0,
        charsCorrect: 0,
    });
    const [timer, setTimer] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const [racers, setRacers] = useState<Racer[]>([
        { id: 'user', nickname: 'YOU', progress: 0, wpm: 0, isCurrentUser: true },
    ]);
    const [preCountdown, setPreCountdown] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<number>(0);

    const [isSaving, setIsSaving] = useState(false);
    const [guestStats, setGuestStats] = useState<any>(null);

    // Initialise a new race
    const startNewRace = () => {
        const randomIndex = Math.floor(Math.random() * TYPING_TEXTS.length);
        setRaceState({
            text: TYPING_TEXTS[randomIndex],
            textId: randomIndex.toString(),
            userInput: '',
            status: 'countdown',
            startTime: null,
            endTime: null,
            wpm: 0,
            accuracy: 100,
            errors: 0,
            charsTyped: 0,
            charsCorrect: 0,
        });
        setRacers(prev => prev.map(r => ({ ...r, progress: 0, wpm: 0 })));
        setPreCountdown(true);
        setCountdown(3); // Faster countdown for game feel
        setTimer(0);
        setGuestStats(null);
        setIsSaving(false);
    };

    // Countdown effect
    useEffect(() => {
        if (!preCountdown) return;
        if (countdown <= 0) {
            setPreCountdown(false);
            setRaceState(prev => ({ ...prev, status: 'running', startTime: Date.now() }));
            return;
        }
        const id = setInterval(() => setCountdown(c => c - 1), 1000);
        return () => clearInterval(id);
    }, [preCountdown, countdown]);

    // Auto-focus input when race starts
    useEffect(() => {
        if (raceState.status === 'running') {
            inputRef.current?.focus();
        }
    }, [raceState.status]);

    // Timer while running
    useEffect(() => {
        if (raceState.status !== 'running') return;
        const id = setInterval(() => setTimer(t => t + 1), 1000);
        return () => clearInterval(id);
    }, [raceState.status]);

    // Update racer progress when user types
    useEffect(() => {
        if (raceState.text.length === 0) return;
        const progress = Math.min(100, (raceState.userInput.length / raceState.text.length) * 100);
        setRacers(prev =>
            prev.map(r => (r.isCurrentUser ? { ...r, progress, wpm: raceState.wpm } : r))
        );
    }, [raceState.userInput, raceState.text, raceState.wpm]);

    // Handle input
    const handleUserInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (raceState.status !== 'running') return;
        const newValue = e.target.value;
        const text = raceState.text;
        if (raceState.errors >= MAX_ERRORS && newValue.length > raceState.userInput.length) return;

        let newStatus: RaceState['status'] = raceState.status;
        let newStart = raceState.startTime;

        let errors = 0;
        let correct = 0;
        for (let i = 0; i < newValue.length; i++) {
            if (i < text.length) {
                if (newValue[i] !== text[i]) errors++;
                else correct++;
            }
        }

        let newEnd = raceState.endTime;
        if (newValue.length >= text.length) {
            newStatus = 'finished';
            newEnd = Date.now();
        }

        let wpm = 0;
        let accuracy = 100;
        if (newStatus === 'running' || newStatus === 'finished') {
            const start = newStart ?? raceState.startTime;
            if (start) {
                const elapsedMin = ((newEnd ?? Date.now()) - start) / 60000;
                if (elapsedMin > 0 && correct > 0) {
                    wpm = Math.floor((correct / 5) / elapsedMin);
                    accuracy = Math.max(0, 100 - (errors / newValue.length) * 100);
                }
            }
        }

        setRaceState(prev => ({
            ...prev,
            userInput: newValue.slice(0, text.length),
            status: newStatus,
            startTime: newStart,
            endTime: newEnd,
            errors,
            wpm,
            accuracy,
            charsTyped: newValue.length,
            charsCorrect: correct,
        }));
    };

    // Save results when finished
    useEffect(() => {
        if (raceState.status !== 'finished' || isSaving) return;
        const save = async () => {
            setIsSaving(true);
            try {
                // Frontend-only: Save to local storage
                const stats = saveGuestRace(raceState.wpm);
                setGuestStats(stats);
            } catch (e) {
                console.error('Failed to save race', e);
            } finally {
                setIsSaving(false);
            }
        };
        save();
    }, [raceState.status, raceState.wpm, isSaving]);

    // Render text with styling
    const renderText = useMemo(() => {
        const textChars = raceState.text.split('');
        const inputChars = raceState.userInput.split('');
        return textChars.map((char, i) => {
            let className = 'transition-colors duration-75 ';
            if (i < inputChars.length) {
                className += inputChars[i] === char ? 'correct-char' : 'wrong-char';
            } else {
                className += 'untyped-char';
            }
            if (i === inputChars.length && raceState.status === 'running') {
                className += ' current-char-position';
            }
            return (
                <span key={i} className={className}>
                    {char}
                </span>
            );
        });
    }, [raceState.text, raceState.userInput, raceState.status]);

    // Initialise first race on mount
    useEffect(() => {
        startNewRace();
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center p-4 md:p-8 relative z-10">

            {/* HUD Header */}
            <div className="w-full max-w-5xl mb-8 flex justify-between items-end border-b border-[var(--border)] pb-4">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-widest text-white flex items-center gap-2">
                        <Zap className="text-[var(--primary)]" />
                        Speed Protocol
                    </h1>
                    <p className="text-[var(--text-secondary)] text-xs font-mono">
                        STATUS: {raceState.status === 'running' ? 'ACTIVE' : raceState.status.toUpperCase()}
                    </p>
                </div>

                {raceState.status !== 'finished' && (
                    <div className="flex gap-8 font-mono text-xl">
                        <div className="text-center">
                            <span className="text-[var(--text-secondary)] text-xs block">TIMER</span>
                            <span className="text-white">{timer}s</span>
                        </div>
                        <div className="text-center">
                            <span className="text-[var(--text-secondary)] text-xs block">WPM</span>
                            <span className="text-[var(--primary)] drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]">{raceState.wpm}</span>
                        </div>
                        <div className="text-center">
                            <span className="text-[var(--text-secondary)] text-xs block">ACCURACY</span>
                            <span className={raceState.accuracy < 90 ? 'text-[var(--error)]' : 'text-[var(--success)]'}>
                                {raceState.accuracy.toFixed(0)}%
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Countdown Overlay */}
            {preCountdown && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-50">
                    <div className="text-9xl font-black text-[var(--primary)] animate-pulse" style={{ textShadow: '0 0 50px var(--primary)' }}>
                        {countdown}
                    </div>
                </div>
            )}

            {/* Main Race Area */}
            <div className="w-full max-w-4xl relative">

                {/* Racers Track (HUD Style) */}
                <div className="mb-8 space-y-2">
                    {racers.map(r => (
                        <div key={r.id} className="relative h-12 bg-[var(--bg-card)] border border-[var(--border)] rounded overflow-hidden">
                            {/* Progress Bar */}
                            <div
                                className="absolute top-0 left-0 h-full bg-[var(--primary)] opacity-20 transition-all duration-300 ease-linear"
                                style={{ width: `${r.progress}%` }}
                            />
                            {/* Racer Info */}
                            <div className="absolute inset-0 flex items-center justify-between px-4">
                                <span className="font-bold text-white tracking-wider flex items-center gap-2">
                                    {r.nickname}
                                    {r.isCurrentUser && <span className="text-[var(--primary)] text-xs bg-[var(--primary)]/10 px-1 rounded">YOU</span>}
                                </span>
                                <span className="font-mono text-[var(--primary)]">{r.wpm} WPM</span>
                            </div>
                            {/* Leading Edge Indicator */}
                            <div
                                className="absolute top-0 bottom-0 w-1 bg-[var(--primary)] shadow-[0_0_10px_var(--primary)] transition-all duration-300 ease-linear"
                                style={{ left: `${r.progress}%` }}
                            />
                        </div>
                    ))}
                </div>

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
                    {raceState.status !== 'finished' && (
                        <input
                            ref={inputRef}
                            className="absolute inset-0 opacity-0 cursor-default"
                            value={raceState.userInput}
                            onChange={handleUserInput}
                            disabled={raceState.status !== 'running'}
                            autoFocus
                        />
                    )}

                    {/* Start Prompt */}
                    {raceState.status === 'idle' && !preCountdown && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <CyberButton onClick={startNewRace} glow>
                                <Play size={20} /> INITIALIZE RACE
                            </CyberButton>
                        </div>
                    )}
                </div>

                {/* Error Warning */}
                {raceState.errors > 0 && raceState.status === 'running' && (
                    <div className="mt-4 flex items-center justify-center text-[var(--error)] animate-pulse font-mono font-bold">
                        <AlertTriangle size={20} className="mr-2" />
                        WARNING: INTEGRITY COMPROMISED ({raceState.errors}/{MAX_ERRORS})
                    </div>
                )}
            </div>

            {/* Results Modal */}
            {raceState.status === 'finished' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <CyberCard className="max-w-2xl w-full animate-in fade-in zoom-in duration-300 border-[var(--primary)] shadow-[0_0_50px_rgba(0,243,255,0.2)]">
                        <div className="text-center mb-8">
                            <h2 className="text-4xl font-black uppercase text-white mb-2" style={{ textShadow: '0 0 20px var(--primary)' }}>
                                Sequence Complete
                            </h2>
                            <p className="text-[var(--text-secondary)] font-mono">DATA UPLOADED TO LOCAL STORAGE</p>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-black/40 p-4 rounded border border-[var(--border)] text-center">
                                <div className="text-[var(--text-secondary)] text-xs uppercase mb-1">Speed</div>
                                <div className="text-4xl font-black text-[var(--primary)]">{raceState.wpm}</div>
                                <div className="text-xs text-[var(--text-muted)]">WPM</div>
                            </div>
                            <div className="bg-black/40 p-4 rounded border border-[var(--border)] text-center">
                                <div className="text-[var(--text-secondary)] text-xs uppercase mb-1">Precision</div>
                                <div className="text-4xl font-black text-[var(--success)]">{raceState.accuracy.toFixed(0)}%</div>
                                <div className="text-xs text-[var(--text-muted)]">ACCURACY</div>
                            </div>
                            <div className="bg-black/40 p-4 rounded border border-[var(--border)] text-center">
                                <div className="text-[var(--text-secondary)] text-xs uppercase mb-1">Time</div>
                                <div className="text-4xl font-black text-white">{timer}s</div>
                                <div className="text-xs text-[var(--text-muted)]">DURATION</div>
                            </div>
                        </div>

                        {guestStats && (
                            <div className="mb-8 p-4 bg-[var(--bg-surface)] rounded border border-[var(--border)]">
                                <h3 className="text-sm font-bold uppercase text-[var(--text-secondary)] mb-2">Personal Best</h3>
                                <div className="flex justify-between items-center font-mono">
                                    <span>Highest WPM: <span className="text-white">{guestStats.bestWpm}</span></span>
                                    <span>Total Races: <span className="text-white">{guestStats.racesPlayed}</span></span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center gap-4">
                            <CyberButton onClick={startNewRace} glow>
                                <RefreshCw size={18} /> RESTART SEQUENCE
                            </CyberButton>
                            <CyberButton variant="secondary" onClick={() => router.push('/dashboard')}>
                                EXIT TO HUB
                            </CyberButton>
                        </div>
                    </CyberCard>
                </div>
            )}
        </div>
    );
}
