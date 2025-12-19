"use client";

import React, { useEffect, useMemo, useRef } from 'react';
import { RefreshCw, Zap, Play, AlertTriangle } from 'lucide-react';
import { TYPING_TEXTS } from '@/lib/texts';
import { useGuestStats } from '@/hooks/useGuestStats';
import { useRouter } from 'next/navigation';
import CyberButton from '@/components/ui/CyberButton';
import CyberCard from '@/components/ui/CyberCard';
import { useRaceStore } from '@/lib/useRaceStore';
import { useTimerStore } from '@/lib/useTimerStore';
import { useMultiplayerStore } from '@/lib/useMultiplayerStore';

const MAX_ERRORS = 10;

export default function QuickRacePage() {
    const router = useRouter();
    const { stats, saveRace } = useGuestStats();
    const inputRef = useRef<HTMLInputElement>(null);
    // Track saved race IDs to prevent duplicate submissions
    // Using Set for O(1) lookup performance
    const savedRaceIdsRef = useRef<Set<string>>(new Set());

    // Race store
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

    // Timer store
    const {
        elapsed: timer,
        countdown,
        startTimer,
        resetTimer,
        tick,
        startCountdown,
        tickCountdown,
    } = useTimerStore();

    // Multiplayer store
    const {
        racers,
        initializeRacers,
        updateCurrentUserProgress,
        resetRacers,
    } = useMultiplayerStore();

    const [preCountdown, setPreCountdown] = React.useState<boolean>(false);
    const [isSaving, setIsSaving] = React.useState<boolean>(false);

    // Initialize a new race
    const startNewRace = () => {
        const randomIndex = Math.floor(Math.random() * TYPING_TEXTS.length);
        initializeRace(TYPING_TEXTS[randomIndex], randomIndex.toString(), 'race');
        resetRacers();
        setPreCountdown(true);
        startCountdown(3);
        resetTimer();
        // Reset save state for new race
        setIsSaving(false);
    };

    // Countdown effect
    useEffect(() => {
        if (!preCountdown) return;
        if (countdown <= 0) {
            setPreCountdown(false);
            startRace();
            startTimer();
            return;
        }
        const id = setInterval(() => tickCountdown(), 1000);
        return () => clearInterval(id);
    }, [preCountdown, countdown, startRace, startTimer, tickCountdown]);

    // Auto-focus input when race starts
    useEffect(() => {
        if (status === 'running') {
            inputRef.current?.focus();
        }
    }, [status]);

    // Timer while running
    useEffect(() => {
        if (status !== 'running') return;
        const id = setInterval(() => tick(), 1000);
        return () => clearInterval(id);
    }, [status, tick]);

    // Update racer progress when user types
    useEffect(() => {
        if (text.length === 0) return;
        const progress = Math.min(100, (userInput.length / text.length) * 100);
        updateCurrentUserProgress(progress, wpm);
    }, [userInput, text, wpm, updateCurrentUserProgress]);

    // Handle input
    const handleUserInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (status !== 'running') return;
        const newValue = e.target.value;

        // Prevent typing when max errors reached
        if (errors >= MAX_ERRORS && newValue.length > userInput.length) return;

        setUserInput(newValue);
    };

    // Save race results to server (user-initiated)
    const saveRaceToServer = async (): Promise<boolean> => {
        // Early return if race not finished
        if (status !== 'finished') {
            console.log('[RACE_SAVE] Race not finished, cannot save');
            return false;
        }
        
        // ============================================================
        // CRITICAL: Capture ALL values SYNCHRONOUSLY
        // ============================================================
        // We MUST capture these values immediately because:
        // 1. A new race might start, resetting the store
        // 2. React re-renders might change these values
        // 3. Async operations will use stale closures if we don't capture now
        
        const capturedStartTime = startTime;
        const capturedEndTime = endTime;
        const capturedWpm = wpm;
        const capturedAccuracy = accuracy;
        const capturedErrors = errors;
        const capturedText = text;
        const capturedTimer = timer;
        
        // ============================================================
        // Validation: Ensure we have required data
        // ============================================================
        if (!capturedStartTime) {
            console.warn('[RACE_SAVE] Missing required data: startTime');
            return false;
        }
        
        if (!capturedText || capturedText.length === 0) {
            console.warn('[RACE_SAVE] Missing required data: text');
            return false;
        }
        
        // ============================================================
        // Calculate unique race identifier
        // ============================================================
        // Format: `${startTime}-${endTime}-${textHash}`
        // This ensures uniqueness based on:
        // - When the race started (startTime)
        // - When the race ended (endTime)
        // - What text was typed (textHash)
        
        const textHash = capturedText.substring(0, 20).replace(/\s+/g, "_");
        
        // Use endTime if available, otherwise use current time
        const finalEndTime = capturedEndTime || Date.now();
        
        const raceId = `${capturedStartTime}-${finalEndTime}-${textHash}`;
        
        // ============================================================
        // Check if already saved
        // ============================================================
        if (savedRaceIdsRef.current.has(raceId)) {
            console.log('[RACE_SAVE] Race already saved');
            return true; // Already saved, consider it success
        }
        
        // ============================================================
        // Mark as saved IMMEDIATELY (synchronously before async operation)
        // ============================================================
        // This prevents duplicate saves if user clicks button multiple times
        savedRaceIdsRef.current.add(raceId);
        
        // ============================================================
        // Calculate timeTakenMs
        // ============================================================
        let timeTakenMs: number;
        if (capturedStartTime && finalEndTime) {
            timeTakenMs = finalEndTime - capturedStartTime;
        } else if (capturedStartTime) {
            // Fallback: use current time if endTime not set
            timeTakenMs = Date.now() - capturedStartTime;
        } else {
            // Last resort: use timer (in seconds, convert to ms)
            timeTakenMs = capturedTimer * 1000;
        }
        
        // ============================================================
        // Prepare request payload
        // ============================================================
        const payload = {
            wpm: capturedWpm,
            accuracy: capturedAccuracy,
            timeTakenMs: timeTakenMs,
            errors: capturedErrors,
            textHash: textHash,
            raceId: raceId, // Send raceId for server-side duplicate check
        };
        
        // ============================================================
        // Send POST request to server
        // ============================================================
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
            
            // ============================================================
            // Handle Response
            // ============================================================
            if (response.ok) {
                const savedRace = await response.json();
                console.log('[RACE_SAVE] Race saved successfully:', savedRace.id);
                return true;
            } else {
                const errorText = await response.text().catch(() => 'Unknown error');
                console.error('[RACE_SAVE] Save failed:', response.status, errorText);
                
                // Remove from saved set to allow retry
                savedRaceIdsRef.current.delete(raceId);
                
                // Fallback to guest stats
                saveRace(capturedWpm, capturedAccuracy);
                
                return false;
            }
        } catch (error) {
            console.error('[RACE_SAVE] Failed to save race:', error);
            // Remove from saved set to allow retry
            savedRaceIdsRef.current.delete(raceId);
            // Fallback to guest stats
            saveRace(capturedWpm, capturedAccuracy);
            return false;
        }
    };

    // Cleanup: Clear saved race IDs when component unmounts
    // This prevents memory leaks and ensures fresh state on remount
    useEffect(() => {
        return () => {
            savedRaceIdsRef.current.clear();
        };
    }, []);

    // Render text with styling
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

    // Initialize first race on mount
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
                    {status !== 'finished' && (
                        <input
                            ref={inputRef}
                            className="absolute inset-0 opacity-0 cursor-default"
                            value={userInput}
                            onChange={handleUserInput}
                            disabled={status !== 'running'}
                            autoFocus
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
                                    // Save current race if finished and not already saved
                                    if (status === 'finished') {
                                        setIsSaving(true);
                                        try {
                                            await saveRaceToServer();
                                        } catch (error) {
                                            console.error('Failed to save race:', error);
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }
                                    // Start new race after save completes (or immediately if not finished)
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
                                    // Save current race if finished and not already saved
                                    if (status === 'finished') {
                                        setIsSaving(true);
                                        try {
                                            await saveRaceToServer();
                                        } catch (error) {
                                            console.error('Failed to save race:', error);
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }
                                    // Navigate to dashboard after save completes (or immediately if not finished)
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
