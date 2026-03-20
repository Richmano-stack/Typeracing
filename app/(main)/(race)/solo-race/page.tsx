"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { RefreshCw, Zap, AlertTriangle, Loader2 } from 'lucide-react';
import { useSoloRace } from '@/hooks/useSoloRace';
import { useRouter } from 'next/navigation';
import { raceApi, FinishResponse } from '@/services/raceApi';
import ResultsModal from '@/components/ResultsModal';

import { useQueryClient } from '@tanstack/react-query';

const NEON_GREEN = 'var(--primary)';
const BRIGHT_RED = 'var(--error)';
const DIM_RED = 'var(--secondary)';

const SoloRacePage: React.FC = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [text, setText] = useState<string>("");
    const [raceId, setRaceId] = useState<string | null>(null);
    const [isLoadingText, setIsLoadingText] = useState(true);
    const [isDecrypting, setIsDecrypting] = useState(false);
    const [results, setResults] = useState<FinishResponse | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        currentIndex,
        userInput,
        totalCharactersInserted,
        status,
        handleKey,
        reset
    } = useSoloRace(text);

    // 1. Initialize Race (Lifecycle: On Mount)
    const initiateRace = useCallback(async () => {
        setIsLoadingText(true);
        try {
            const data = await raceApi.initiate();
            setText(data.content);
            setRaceId(data.raceId);
        } catch (err) {
            console.error("Failed to initiate race", err);
        } finally {
            setIsLoadingText(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, []);

    useEffect(() => {
        initiateRace();
    }, [initiateRace]);

    // 2. Start Race (Lifecycle: On Start - first keystroke)
    // Hook handles the state change, we trigger the fire-and-forget API call
    const triggerStartApi = useCallback((id: string) => {
        raceApi.start(id).catch(err => {
            console.error("Fire-and-forget start failed", err);
        });
    }, []);

    // 3. Finish Race (Lifecycle: On Finish)
    const onFinish = useCallback(async () => {
        if (!raceId) return;
        setIsDecrypting(true);
        setIsModalOpen(true);
        try {
            const data = await raceApi.finish(raceId, totalCharactersInserted);
            setResults(data);
            
            // Invalidate user-telemetry to update the HUD
            queryClient.invalidateQueries({ queryKey: ['user-telemetry'] });
        } catch (err) {
            console.error("Failed to finish race", err);
        } finally {
            setIsDecrypting(false);
        }
    }, [raceId, totalCharactersInserted, queryClient]);

    useEffect(() => {
        if (status === 'finished') {
            onFinish();
        }
    }, [status, onFinish]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const isFirst = handleKey(e.key);
        if (isFirst && raceId) {
            triggerStartApi(raceId);
        }
    };

    const isBufferFull = userInput.length >= currentIndex + 5 && currentIndex < text.length;

    const renderedText = useMemo(() => {
        if (!text) return null;
        
        const chars = text.split('').map((char, i) => {
            let color = 'var(--text-muted)';
            let backgroundColor = 'transparent';
            let textDecoration = 'none';

            if (i < userInput.length) {
                if (i < currentIndex) {
                    color = NEON_GREEN;
                } else if (i === currentIndex) {
                    backgroundColor = BRIGHT_RED;
                    color = 'white';
                } else {
                    color = DIM_RED;
                    textDecoration = 'underline';
                }
            }

            return (
                <span 
                    key={i} 
                    className="relative"
                    style={{ 
                        color, 
                        backgroundColor, 
                        textDecoration,
                        transition: 'all 0.1s ease-out'
                    }}
                >
                    {status !== 'finished' && i === currentIndex && <span className="caret" />}
                    {char}
                </span>
            );
        });

        // If we've typed everything correctly and are at the end, show caret after last char
        if (status !== 'finished' && currentIndex === text.length) {
            chars.push(<span key="end-caret" className="caret" />);
        }

        return chars;
    }, [text, userInput, currentIndex, status]);

    const handleReset = () => {
        setIsModalOpen(false);
        setResults(null);
        reset(); // Clear hook state
        initiateRace(); // Re-trigger initiate
    };

    if (isLoadingText) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] text-[var(--primary)] font-mono">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin" size={48} />
                    <p className="tracking-[0.2em] animate-pulse text-sm">INITIALIZING TERMINAL...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-base)] text-white font-mono p-4 md:p-8 flex flex-col items-center overflow-hidden">
            <style jsx>{`
                @keyframes pulse-red {
                    0% { box-shadow: 0 0 5px rgba(255, 0, 60, 0.2); }
                    50% { box-shadow: 0 0 20px rgba(255, 0, 60, 0.4); }
                    100% { box-shadow: 0 0 5px rgba(255, 0, 60, 0.2); }
                }
                .buffer-full {
                    animation: pulse-red 1s infinite;
                    border-color: ${BRIGHT_RED} !important;
                }
                .caret {
                    display: inline-block;
                    width: 10px;
                    height: 1.2em;
                    background-color: ${NEON_GREEN};
                    vertical-align: middle;
                    margin-left: 2px;
                    animation: blink 1s step-end infinite;
                }
                @keyframes blink {
                    from, to { opacity: 1; }
                    50% { opacity: 0; }
                }
            `}</style>

            {/* Header / HUD */}
            <div className="w-full max-w-5xl flex justify-between items-start mb-12 border-b border-[var(--border)] pb-6">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter flex items-center gap-3">
                        <Zap className="text-[var(--primary)]" fill="var(--primary)" />
                        CYBER_RACE <span className="text-xs not-italic font-normal tracking-widest text-[var(--text-muted)] ml-2">v2.0.4-SOLO</span>
                    </h1>
                    <div className="mt-2 flex gap-4 text-[10px] tracking-widest uppercase text-[var(--text-secondary)]">
                        <span>LATENCY: 12ms</span>
                        <span>KERNEL: STABLE</span>
                        <span>BUFF_LIMIT: 5_CHAR</span>
                    </div>
                </div>

                <div className="flex gap-12">
                    <div className="text-right">
                        <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-1">Status</div>
                        <div className={`text-sm ${isBufferFull ? 'text-[var(--error)]' : 'text-[var(--primary)]'}`}>
                            {isBufferFull ? '!! BUFFER_FULL !!' : status === 'running' ? 'EXECUTING...' : 'IDLE_WAIT'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Terminal Area */}
            <div className="relative w-full max-w-4xl">
                <div 
                    onClick={() => inputRef.current?.focus()}
                    className={`
                        relative p-10 md:p-14 cyber-card
                        text-2xl md:text-3xl leading-relaxed transition-all duration-300
                        ${isBufferFull ? 'buffer-full' : ''}
                    `}
                >
                    {/* Scanline Effect */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] z-10" />
                    
                    <div className="relative z-20 break-words">
                        {renderedText}
                    </div>

                    {/* Hidden Input field */}
                    <input
                        ref={inputRef}
                        type="text"
                        className="absolute inset-0 opacity-0 cursor-default"
                        value={userInput}
                        onKeyDown={handleKeyDown}
                        onChange={() => {}}
                        readOnly={status === 'finished'}
                        autoFocus
                    />
                </div>

                {/* Warning HUD */}
                {isBufferFull && (
                    <div className="mt-6 flex items-center justify-center gap-3 text-[var(--error)] font-bold text-sm tracking-widest animate-pulse">
                        <AlertTriangle size={18} />
                        CRITICAL ERROR: BUFFER OVERFLOW. CORRECT PREVIOUS INPUT.
                    </div>
                )}
            </div>

            {/* Controls */}
            {status !== 'finished' && (
                <div className="mt-12 flex gap-6">
                    <button 
                        onClick={handleReset}
                        className="px-8 py-3 bg-[var(--bg-primary-subtle)] border border-[var(--border)] hover:bg-[var(--bg-primary-hover)] hover:border-[var(--primary)] transition-all uppercase tracking-widest text-[10px] flex items-center gap-2"
                    >
                        <RefreshCw size={14} /> Re-Initialize Protocol
                    </button>
                    <button 
                        onClick={() => router.push('/dashboard')}
                        className="px-8 py-3 bg-[var(--bg-base)] border border-[var(--border)] hover:border-[var(--secondary)] transition-all uppercase tracking-widest text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                        Abort Mission
                    </button>
                </div>
            )}

            {/* Results Modal */}
            <ResultsModal 
                isOpen={isModalOpen}
                isLoading={isDecrypting}
                results={results}
                onReset={handleReset}
            />
        </div>
    );
};

export default SoloRacePage;