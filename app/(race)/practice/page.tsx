"use client";

import React, { useEffect, useMemo } from 'react';
import { RefreshCw, Trophy } from 'lucide-react';
import { TYPING_TEXTS } from '@/lib/texts';
import { useRaceStore } from '@/lib/useRaceStore';
import { useTimerStore } from '@/lib/useTimerStore';

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

        const saved = localStorage.getItem('bestWpm');
        if (saved) setBestWpm(parseInt(saved));
    }, [initializeRace]);

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
        resetTimer();
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

        // Start race on first input
        if (status === "idle" && newValue.length > 0) {
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
        <div className="container mx-auto p-4 md:p-8 min-h-[80vh] flex flex-col items-center">
            <h1 className="text-3xl font-extrabold mb-8" style={{ color: 'var(--text-primary)' }}>
                Practice Mode
            </h1>

            {bestWpm !== null && (
                <div className="w-full max-w-4xl mb-4 p-3 rounded-lg border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--accent)' }}>
                    <div className="flex items-center justify-center gap-2">
                        <Trophy size={20} style={{ color: 'var(--accent)' }} />
                        <span style={{ color: 'var(--text-primary)' }}>
                            Personal Best: <strong style={{ color: 'var(--accent)' }}>{bestWpm} WPM</strong>
                        </span>
                    </div>
                </div>
            )}

            <div className="w-full max-w-4xl mb-6">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-bold" style={{ color: 'var(--text-primary)' }}>Your Progress</span>
                    <span className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {wpm} WPM | {progressPercentage.toFixed(1)}%
                    </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-4 overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                    <div className="h-full transition-all duration-300" style={{ width: `${progressPercentage}%`, backgroundColor: 'var(--accent)' }} />
                </div>
            </div>

            {status !== 'finished' && (
                <div className="flex justify-between w-full max-w-4xl mb-4 text-xl font-mono" style={{ color: 'var(--text-secondary)' }}>
                    <span>Temps: {timer}s</span>
                    <span>WPM: {wpm}</span>
                    <span>Erreurs: {errors}/{MAX_ERRORS}</span>
                    <span>Précision: {accuracy.toFixed(1)}%</span>
                </div>
            )}

            <div className="ui-card w-full max-w-4xl p-6 mb-6 text-2xl tracking-wide leading-relaxed" style={{ backgroundColor: 'var(--bg-card)' }}>
                <p>{renderText}</p>
            </div>

            {status === 'finished' && (
                <div className="w-full max-w-4xl mb-6 p-6 rounded-xl border-2" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--accent)' }}>
                    <h2 className="text-4xl font-extrabold mb-4 text-center" style={{ color: 'var(--accent)' }}>
                        {bestWpm !== null && wpm > bestWpm ? '🎉 New Record!' : 'Practice Complete!'}
                    </h2>
                    <p className="text-2xl font-bold text-center" style={{ color: 'var(--text-primary)' }}>WPM: {wpm}</p>
                    <p className="text-lg text-center" style={{ color: 'var(--text-secondary)' }}>
                        Précision: {accuracy.toFixed(1)}% | Erreurs: {errors}
                    </p>
                    {bestWpm !== null && wpm <= bestWpm && (
                        <p className="text-sm mt-2 text-center" style={{ color: 'var(--text-muted)' }}>Best: {bestWpm} WPM</p>
                    )}
                    <div className="flex justify-center">
                        <button onClick={handleReset} className="mt-6 py-3 px-6 rounded-md text-xl font-bold flex items-center transition hover:opacity-90" style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-base)' }}>
                            <RefreshCw size={20} className="mr-2" /> Practice Again
                        </button>
                    </div>
                </div>
            )}

            <input
                ref={inputRef}
                type="text"
                className="w-full max-w-4xl p-4 text-2xl ui-card focus:outline-none"
                style={{
                    backgroundColor: 'var(--bg-surface)',
                    color: "var(--text-primary)",
                    borderColor: errors > 0 ? '#ff4d4d' : 'var(--accent)',
                    caretColor: 'var(--accent)',
                    opacity: status === 'finished' ? 0 : 1,
                }}
                value={userInput}
                onChange={handleUserInput}
                disabled={status === 'finished'}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
            />

            {errors >= MAX_ERRORS && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500 font-bold animate-pulse">
                    ⚠️ You are typing it wrong! Please correct your errors.
                </div>
            )}

            {status !== 'finished' && (
                <button onClick={handleReset} className="mt-12 py-2 px-4 rounded-md flex items-center transition hover:opacity-80" style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-base)' }}>
                    <RefreshCw size={18} className="mr-2" /> Redémarrer
                </button>
            )}
        </div>
    );
};

export default PracticePage;