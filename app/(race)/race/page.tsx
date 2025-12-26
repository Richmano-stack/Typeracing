"use client";

import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { RefreshCw, Zap, Play, AlertTriangle, Loader2 } from 'lucide-react';
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
    const raceIdRef = useRef<string | null>(null);
    const [isSaving, setIsSaving] = React.useState<boolean>(false);

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

    const startNewRace = () => {
        raceIdRef.current = null;
        setIsSaving(false);
        const randomIndex = Math.floor(Math.random() * TYPING_TEXTS.length);
        initializeRace(TYPING_TEXTS[randomIndex], randomIndex.toString(), 'race');
        resetRacers();
        resetTimer();
        setPreCountdown(true);
        startCountdown(5);
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
            raceIdRef.current = crypto.randomUUID();
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

    const saveRaceToServer = useCallback(async (): Promise<boolean> => {
        if (!session?.user) {
            return false;
        }
        
        if (status !== 'finished') {
            return false;
        }
        
        const raceId = raceIdRef.current;
        if (!raceId) {
            return false;
        }
        
        // Capture all values at function entry to avoid dependency on changing values
        const capturedStartTime = startTime;
        const capturedEndTime = endTime;
        const capturedWpm = wpm;
        const capturedAccuracy = accuracy;
        const capturedErrors = errors;
        const capturedText = text;
        const capturedTimer = useTimerStore.getState().elapsed;
        
        if (!capturedStartTime || !capturedText || capturedText.length === 0) {
            return false;
        }
        
        const textHash = capturedText.substring(0, 20).replace(/\s+/g, "_");
        
        let timeTakenMs: number;
        if (capturedStartTime && capturedEndTime) {
            timeTakenMs = capturedEndTime - capturedStartTime;
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
            setIsSaving(true);
            const response = await fetch('/api/races', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            
            if (response.ok) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [session, status, startTime, endTime, wpm, accuracy, errors, text]);


    // Save race data when race finishes
    const hasSavedRef = useRef<boolean>(false);
    const saveRaceToServerRef = useRef(saveRaceToServer);
    // Keep ref updated with latest callback
    useEffect(() => {
        saveRaceToServerRef.current = saveRaceToServer;
    }, [saveRaceToServer]);
    
    useEffect(() => {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/b9c85705-8d2a-4030-b8e1-a65a950860c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'race/page.tsx:191',message:'save effect triggered',data:{status,startTime:!!startTime,text:!!text,hasSaved:hasSavedRef.current,wpm,accuracy,errors,timer:useTimerStore.getState().elapsed,endTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        if (status !== 'finished' || !startTime || !text || hasSavedRef.current) {
            if (status !== 'finished') {
                hasSavedRef.current = false;
            }
            return;
        }
        hasSavedRef.current = true;
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/b9c85705-8d2a-4030-b8e1-a65a950860c4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'race/page.tsx:198',message:'saving race',data:{wpm,accuracy,errors,hasSession:!!session?.user},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        // Save locally (guest stats)
        saveRace(wpm, accuracy, 'quick', errors);
        // Save to server (logged-in users only)
        if (session?.user) {
            saveRaceToServerRef.current();
        }
    }, [status, startTime, text, wpm, accuracy, errors, session, saveRace]);

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
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center p-4 md:p-8 relative z-10">
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

            {preCountdown && (
                <div className="fixed inset-0 bg-black/10 z-50 pointer-events-none">
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

            <div className="w-full max-w-4xl relative">
                <div className="mb-8 space-y-2">
                    {racers.map(r => (
                        <div key={r.id} className="relative h-12 bg-[var(--bg-card)] border border-[var(--border)] rounded overflow-hidden">
                            <div
                                className="absolute top-0 left-0 h-full bg-[var(--primary)] opacity-20 transition-all duration-300 ease-linear"
                                style={{ width: `${r.progress}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-between px-4">
                                <span className="font-bold text-white tracking-wider flex items-center gap-2">
                                    {r.nickname}
                                    {r.isCurrentUser && <span className="text-[var(--primary)] text-xs bg-[var(--primary)]/10 px-1 rounded">YOU</span>}
                                </span>
                                <span className="font-mono text-[var(--primary)]">{r.wpm} WPM</span>
                            </div>
                            <div
                                className="absolute top-0 bottom-0 w-1 bg-[var(--primary)] shadow-[0_0_10px_var(--primary)] transition-all duration-300 ease-linear"
                                style={{ left: `${r.progress}%` }}
                            />
                        </div>
                    ))}
                </div>

                <div
                    className="relative p-8 md:p-12 bg-black/40 border border-[var(--border)] rounded-lg backdrop-blur-md min-h-[200px] text-2xl md:text-3xl font-mono leading-relaxed break-words shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] z-10"
                    onClick={() => inputRef.current?.focus()}
                >
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--primary)]" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--primary)]" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[var(--primary)]" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--primary)]" />

                    {renderText}

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

                    {status === 'idle' && !preCountdown && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <CyberButton onClick={startNewRace} glow>
                                <Play size={20} /> INITIALIZE RACE
                            </CyberButton>
                        </div>
                    )}
                </div>

                {errors > 0 && status === 'running' && (
                    <div className="mt-4 flex items-center justify-center text-[var(--error)] animate-pulse font-mono font-bold">
                        <AlertTriangle size={20} className="mr-2" />
                        WARNING: INTEGRITY COMPROMISED ({errors}/{MAX_ERRORS})
                    </div>
                )}
            </div>

            {status === 'finished' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                    <CyberCard className="max-w-2xl w-full animate-in fade-in zoom-in duration-300 border-[var(--primary)] shadow-[0_0_50px_rgba(0,243,255,0.2)]">
                        <div className="text-center mb-8">
                            <h2 className="text-4xl font-black uppercase text-white mb-2" style={{ textShadow: '0 0 20px var(--primary)' }}>
                                Sequence Complete
                            </h2>
                            <p className="text-[var(--text-secondary)] font-mono">
                                {isSaving ? 'UPLOADING TO SERVER...' : 'DATA UPLOADED TO LOCAL STORAGE'}
                            </p>
                            {isSaving && (
                                <div className="flex justify-center mt-4">
                                    <Loader2 className="text-[var(--primary)] animate-spin" size={24} />
                                </div>
                            )}
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
                                onClick={startNewRace}
                                glow
                                disabled={isSaving}
                            >
                                <RefreshCw size={18} /> RESTART SEQUENCE
                            </CyberButton>
                            <CyberButton 
                                variant="secondary" 
                                onClick={() => router.push('/dashboard')}
                                disabled={isSaving}
                            >
                                EXIT TO HUB
                            </CyberButton>
                        </div>
                    </CyberCard>
                </div>
            )}
        </div>
    );
}
