"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { RefreshCw, Save, Trophy, Clock, Target, Zap } from 'lucide-react';
import { TYPING_TEXTS } from '@/lib/texts';
import { useSession } from 'next-auth/react';
import { saveGuestRace } from '@/lib/guestStats';

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

interface ServerStats {
    racesPlayed: number;
    averageWpm: number;
    bestWpm: number;
    rank?: string;
}

const QuickRacePage: React.FC = () => {
    const { data: session } = useSession();
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
        { id: 'user', nickname: 'You', progress: 0, wpm: 0, isCurrentUser: true },
    ]);
    const [preCountdown, setPreCountdown] = useState<boolean>(false);
    const [countdown, setCountdown] = useState<number>(0);

    const [isSaving, setIsSaving] = useState(false);
    const [serverStats, setServerStats] = useState<ServerStats | null>(null);
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
        setCountdown(10);
        setTimer(0);
        setServerStats(null);
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

        let newStatus = raceState.status;
        let newStart = raceState.startTime;
        if (newStatus === 'idle' && newValue.length > 0) {
            newStatus = 'running';
            newStart = Date.now();
        }

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
            const payload = {
                wpm: raceState.wpm,
                accuracy: raceState.accuracy,
                durationMs: (raceState.endTime ?? Date.now()) - (raceState.startTime ?? Date.now()),
                charsTyped: raceState.charsTyped,
                charsCorrect: raceState.charsCorrect,
                mistakes: raceState.errors,
                textId: raceState.textId,
            };
            try {
                const res = await fetch('/api/race/finish', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                const data = await res.json();
                if (session?.user && data.user) setServerStats(data.user);
                else setGuestStats(saveGuestRace(raceState.wpm));
            } catch (e) {
                console.error('Failed to save race', e);
            } finally {
                setIsSaving(false);
            }
        };
        save();
    }, [raceState.status, raceState.wpm, raceState.accuracy, raceState.endTime, raceState.startTime, raceState.charsTyped, raceState.charsCorrect, raceState.errors, raceState.textId, session]);

    // Render text with styling
    const renderText = useMemo(() => {
        const textChars = raceState.text.split('');
        const inputChars = raceState.userInput.split('');
        return textChars.map((char, i) => {
            let className = '';
            if (i < inputChars.length) {
                className = inputChars[i] === char ? 'correct-char' : 'wrong-char';
            } else {
                className = 'untyped-char';
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
        <div className="container mx-auto p-4 md:p-8 min-h-[80vh] flex flex-col items-center relative">
            <h1 className="text-3xl font-extrabold mb-8" style={{ color: 'var(--text-primary)' }}>
                Quick Race
            </h1>

            {/* Countdown overlay */}
            {preCountdown && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="text-6xl font-bold" style={{ color: 'var(--accent)' }}>
                        {countdown}
                    </div>
                </div>
            )}

            {/* Racers track */}
            <div className="w-full max-w-4xl mb-6">
                <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                    Racers
                </h2>
                <div className="space-y-3">
                    {racers.map(r => (
                        <div
                            key={r.id}
                            className={`p-3 rounded-lg border ${r.isCurrentUser ? 'border-2' : 'border'}`}
                            style={{
                                backgroundColor: 'var(--bg-card)',
                                borderColor: r.isCurrentUser ? 'var(--accent)' : 'var(--border)',
                            }}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold" style={{ color: r.isCurrentUser ? 'var(--accent)' : 'var(--text-primary)' }}>
                                    {r.nickname} {r.isCurrentUser && '(You)'}
                                </span>
                                <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                                    {r.wpm} WPM | {r.progress.toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                                <div
                                    className="h-full transition-all duration-300"
                                    style={{ width: `${r.progress}%`, backgroundColor: r.isCurrentUser ? 'var(--accent)' : 'var(--text-muted)' }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Live stats */}
            {raceState.status !== 'finished' && (
                <div className="flex justify-between w-full max-w-4xl mb-4 text-xl font-mono" style={{ color: 'var(--text-secondary)' }}>
                    <span>Temps: {timer}s</span>
                    <span>WPM: {raceState.wpm}</span>
                    <span>Erreurs: {raceState.errors}/{MAX_ERRORS}</span>
                    <span>Précision: {raceState.accuracy.toFixed(1)}%</span>
                </div>
            )}

            {/* Text display */}
            <div className="w-full max-w-4xl mb-4 p-4 bg-[var(--bg-surface)] rounded-lg border border-[var(--border)]" style={{ minHeight: '8rem' }}>
                {renderText}
            </div>

            {/* Input */}
            {raceState.status !== 'finished' && (
                <input
                    ref={inputRef}
                    className="w-full max-w-4xl p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    placeholder="Start typing..."
                    value={raceState.userInput}
                    onChange={handleUserInput}
                    disabled={raceState.status !== 'running'}
                />
            )}

            {/* Results */}
            {raceState.status === 'finished' && (
                <div className="mt-6 p-6 bg-[var(--bg-card)] rounded-lg shadow-md text-center">
                    <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        Résultat de la course
                    </h2>
                    <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                        WPM: {raceState.wpm} | Précision: {raceState.accuracy.toFixed(1)}% | Temps: {timer}s
                    </p>
                    {serverStats && (
                        <div className="mt-4 text-left">
                            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Statistiques du serveur</h3>
                            <p>Races jouées: {serverStats.racesPlayed}</p>
                            <p>WPM moyen: {serverStats.averageWpm}</p>
                            <p>Meilleur WPM: {serverStats.bestWpm}</p>
                        </div>
                    )}
                    {guestStats && (
                        <div className="mt-4 text-left">
                            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Statistiques invité</h3>
                            <p>Races jouées: {guestStats.racesPlayed}</p>
                            <p>Meilleur WPM: {guestStats.bestWpm}</p>
                        </div>
                    )}
                    <button
                        className="mt-4 bg-[var(--accent)] text-[var(--bg-base)] py-2 px-4 rounded"
                        onClick={startNewRace}
                    >
                        Rejouer
                    </button>
                </div>
            )}
        </div>
    );
};

export default QuickRacePage;
