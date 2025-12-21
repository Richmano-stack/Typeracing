"use client";

import React, { useEffect, useMemo, useRef } from 'react';
import { RefreshCw, Zap, Play, AlertTriangle } from 'lucide-react';
import { TYPING_TEXTS } from '@/lib/texts';
import { useGuestStats } from '@/hooks/useGuestStats';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import CyberButton from '@/components/ui/CyberButton';
import CyberCard from '@/components/ui/CyberCard';
import { useRaceStore } from '@/lib/useRaceStore';
import { useTimerStore } from '@/lib/useTimerStore';
import { useMultiplayerStore } from '@/lib/useMultiplayerStore';

const MAX_ERRORS = 10;

export default function QuickRacePage() {
    const router = useRouter();
    const { data: session } = useSession();
    const { stats, saveRace } = useGuestStats();
    const inputRef = useRef<HTMLInputElement>(null);
    const savedRaceIdsRef = useRef<Set<string>>(new Set());

    const {
        text,
        userInput,
        status,
        wpm,
        accuracy,
        errors,
        startTime,
        endTime,
        initializeRace,
        setUserInput,
        startRace,
        resetRace,
    } = useRaceStore();

    const {
        elapsed: timer,
        countdown,
        startTimer,
        resetTimer,
        tick,
        startCountdown,
        tickCountdown,
    } = useTimerStore();

    const {
        racers,
        initializeRacers,
        updateCurrentUserProgress,
        resetRacers,
    } = useMultiplayerStore();

    const [preCountdown, setPreCountdown] = React.useState<boolean>(false);
    const [isSaving, setIsSaving] = React.useState<boolean>(false);

    const startNewRace = () => {
        const randomIndex = Math.floor(Math.random() * TYPING_TEXTS.length);
        initializeRace(TYPING_TEXTS[randomIndex], randomIndex.toString(), 'race');
        resetRacers();
        resetTimer();
        setPreCountdown(true);
        startCountdown(5);
        setIsSaving(false);
    };

    useEffect(() => {
        if (!preCountdown) return;
        
        const id = setInterval(() => {
            const store = useTimerStore.getState();
            const currentCountdown = store.countdown;
            if (currentCountdown > 0) {
                tickCountdown();
            }
        }, 1000);
        
        return () => clearInterval(id);
    }, [preCountdown, tickCountdown]);

    useEffect(() => {
        if (!preCountdown || countdown !== 0) return;

        const startTimeout = setTimeout(() => {
            setPreCountdown(false);
            startRace();
            startTimer();
        }, 800);

        return () => clearTimeout(startTimeout);
    }, [preCountdown, countdown, startRace, startTimer]);

    useEffect(() => {
        if (status === 'running') {
            const focusTimeout = setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => clearTimeout(focusTimeout);
        }
    }, [status]);

    useEffect(() => {
        if (status !== 'running') return;
        const id = setInterval(() => tick(), 1000);
        return () => clearInterval(id);
    }, [status, tick]);

    const handleUserInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (status !== 'running') return;
        const newValue = e.target.value;

        if (errors >= MAX_ERRORS && newValue.length > userInput.length) return;

        setUserInput(newValue);
        
        if (text.length > 0) {
            const progress = Math.min(100, (newValue.length / text.length) * 100);
            updateCurrentUserProgress(progress, wpm);
        }
    };

    const saveRaceToServer = async (): Promise<boolean> => {
        if (!session?.user) {
            console.log('[RACE_SAVE] User not authenticated, skipping server save (guest mode)');
            return false;
        }
        
        if (status !== 'finished') {
            console.log('[RACE_SAVE] Race not finished, cannot save');
            return false;
        }
        
        const capturedStartTime = startTime;
        const capturedEndTime = endTime;
        const capturedWpm = wpm;
        const capturedAccuracy = accuracy;
        const capturedErrors = errors;
        const capturedText = text;
        const capturedTimer = timer;
        
        if (!capturedStartTime) {
            console.warn('[RACE_SAVE] Missing required data: startTime');
            return false;
        }
        
        if (!capturedText || capturedText.length === 0) {
            console.warn('[RACE_SAVE] Missing required data: text');
            return false;
        }
        
        const textHash = capturedText.substring(0, 20).replace(/\s+/g, "_");
        const finalEndTime = capturedEndTime || Date.now();
        const raceId = `${capturedStartTime}-${finalEndTime}-${textHash}`;
        
        if (savedRaceIdsRef.current.has(raceId)) {
            console.log('[RACE_SAVE] Race already saved');
            return true;
        }
        
        savedRaceIdsRef.current.add(raceId);
        
        let timeTakenMs: number;
        if (capturedStartTime && finalEndTime) {
            timeTakenMs = finalEndTime - capturedStartTime;
        } else if (capturedStartTime) {
            timeTakenMs = Date.now() - capturedStartTime;
        } else {
            timeTakenMs = capturedTimer * 1000;
        }
        
        const payload = {
            wpm: capturedWpm,
            accuracy: capturedAccuracy,
            timeTakenMs: timeTakenMs,
            errors: capturedErrors,
            textHash: textHash,
            raceId: raceId,
            raceType: 'quick',
        };
        
        try {
            console.log('[RACE_SAVE] Sending race data to server:', {
                raceId,
                wpm: capturedWpm,
                accuracy: capturedAccuracy,
                timeTakenMs,
                errors: capturedErrors,
            });
            
            const response = await fetch('/api/races', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            
            if (response.ok) {
                const savedRace = await response.json();
                console.log('[RACE_SAVE] Race saved successfully:', savedRace.id);
                return true;
            } else {
                const errorText = await response.text().catch(() => 'Unknown error');
                console.error('[RACE_SAVE] Save failed:', response.status, errorText);
                savedRaceIdsRef.current.delete(raceId);
                return false;
            }
        } catch (error) {
            console.error('[RACE_SAVE] Failed to save race:', error);
            savedRaceIdsRef.current.delete(raceId);
            return false;
        }
    };

    useEffect(() => {
        return () => {
            savedRaceIdsRef.current.clear();
        };
    }, []);

    const renderText = useMemo(() => {
        const textChars = text.split('');
        const inputChars = userInput.split('');
        return textChars.map((char, i) => {
            let className = 'transition-colors duration-75 ';
            if (i < inputChars.length) {
                className += inputChars[i] === char ? 'correct-char' : 'wrong-char';
            } else {
                className += 'untyped-char';
            }
            if (i === inputChars.length && status === 'running') {
                className += ' current-char-position';
            }
            return (
                <span key={i} className={className}>
                    {char}
                </span>
            );
        });
    }, [text, userInput, status]);

    useEffect(() => {
        initializeRacers('user', 'YOU');
        startNewRace();
        // eslint-disable-next-line react-hooks/exhaustive-rules
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

            {/* Countdown Overlay - Very transparent so text is clearly visible */}
            {preCountdown && (
                <div className="fixed inset-0 bg-black/10 z-50 pointer-events-none">
                    {/* Countdown Number - Positioned at top center, above the text area */}
                    <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-50">
                        <div 
                            className="text-9xl font-black text-[var(--primary)] transition-all duration-300 ease-out"
                            style={{ 
                                textShadow: '0 0 50px var(--primary), 0 0 100px var(--primary)',
                                transform: `scale(${countdown > 0 ? 1 : 1.2})`,
                                opacity: 1,
                                animation: countdown > 0 ? 'pulse 1s infinite' : 'none'
                            }}
                        >
                            {countdown > 0 ? countdown : 'GO!'}
                        </div>
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
                    className="relative p-8 md:p-12 bg-black/40 border border-[var(--border)] rounded-lg backdrop-blur-md min-h-[200px] text-2xl md:text-3xl font-mono leading-relaxed break-words shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] z-10"
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
                            disabled={status !== 'running'}
                            autoFocus={status === 'running'}
                        />
                    )}

                    {/* Start Prompt */}
                    {status === 'idle' && !preCountdown && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <CyberButton onClick={startNewRace} glow>
                                <Play size={20} /> INITIALIZE RACE
                            </CyberButton>
                        </div>
                    )}
                </div>

                {/* Error Warning */}
                {errors > 0 && status === 'running' && (
                    <div className="mt-4 flex items-center justify-center text-[var(--error)] animate-pulse font-mono font-bold">
                        <AlertTriangle size={20} className="mr-2" />
                        WARNING: INTEGRITY COMPROMISED ({errors}/{MAX_ERRORS})
                    </div>
                )}
            </div>

            {/* Results Modal */}
            {status === 'finished' && (
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

                        {stats && (
                            <div className="mb-8 p-4 bg-[var(--bg-surface)] rounded border border-[var(--border)]">
                                <h3 className="text-sm font-bold uppercase text-[var(--text-secondary)] mb-2">Personal Best</h3>
                                <div className="flex justify-between items-center font-mono">
                                    <span>Highest WPM: <span className="text-white">{stats.bestWpm}</span></span>
                                    <span>Total Races: <span className="text-white">{stats.racesPlayed}</span></span>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-center gap-4">
                            <CyberButton 
                                onClick={async () => {
                                    if (status === 'finished') {
                                        saveRace(wpm, accuracy, 'quick', errors);
                                        
                                        if (session?.user) {
                                        setIsSaving(true);
                                        try {
                                            await saveRaceToServer();
                                        } catch (error) {
                                            console.error('Failed to save race:', error);
                                        } finally {
                                            setIsSaving(false);
                                            }
                                        }
                                    }
                                    startNewRace();
                                }}
                                glow
                                disabled={isSaving}
                            >
                                <RefreshCw size={18} /> {isSaving ? 'SAVING...' : 'RESTART SEQUENCE'}
                            </CyberButton>
                            <CyberButton 
                                variant="secondary" 
                                onClick={async () => {
                                    if (status === 'finished') {
                                        saveRace(wpm, accuracy, 'quick', errors);
                                        
                                        if (session?.user) {
                                        setIsSaving(true);
                                        try {
                                            await saveRaceToServer();
                                        } catch (error) {
                                            console.error('Failed to save race:', error);
                                        } finally {
                                            setIsSaving(false);
                                            }
                                        }
                                    }
                                    router.push('/dashboard');
                                }}
                                disabled={isSaving}
                            >
                                {isSaving ? 'SAVING...' : 'EXIT TO HUB'}
                            </CyberButton>
                        </div>
                    </CyberCard>
                </div>
            )}
        </div>
    );
}
