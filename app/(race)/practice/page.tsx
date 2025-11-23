"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Trophy } from 'lucide-react';
import { TYPING_TEXTS } from '@/lib/texts';

const MAX_ERRORS = 10;
interface PracticeState {
    text: string;
    userInput: string;
    status: 'idle' | 'running' | 'finished';
    startTime: number | null;
    endTime: number | null;
    wpm: number;
    accuracy: number;
    errors: number;
}

const PracticePage: React.FC = () => {
    const [practiceState, setPracticeState] = useState<PracticeState>({
        text: "",
        userInput: "",
        status: 'idle',
        startTime: null,
        endTime: null,
        wpm: 0,
        accuracy: 100,
        errors: 0,
    });
    const [timer, setTimer] = useState(0);
    const [bestWpm, setBestWpm] = useState<number | null>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        setPracticeState(prev => ({
            ...prev,
            text: TYPING_TEXTS[Math.floor(Math.random() * TYPING_TEXTS.length)]
        }));
        const saved = localStorage.getItem('bestWpm');
        if (saved) setBestWpm(parseInt(saved));
    }, []);

    useEffect(() => {
        if (practiceState.status === 'finished' && practiceState.wpm > 0) {
            if (bestWpm === null || practiceState.wpm > bestWpm) {
                setBestWpm(practiceState.wpm);
                localStorage.setItem('bestWpm', practiceState.wpm.toString());
            }
        }
    }, [practiceState.status, practiceState.wpm, bestWpm]);

    const handleReset = () => {
        const newText = TYPING_TEXTS[Math.floor(Math.random() * TYPING_TEXTS.length)];
        setPracticeState({
            text: newText,
            userInput: "",
            status: 'idle',
            startTime: null,
            endTime: null,
            wpm: 0,
            accuracy: 100,
            errors: 0,
        });
        setTimer(0);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const renderText = useMemo(() => {
        const textChars = practiceState.text.split('');
        const inputChars = practiceState.userInput.split('');
        return textChars.map((char, index) => {
            const inputChar = inputChars[index];
            let className = '';
            if (index < inputChars.length) {
                className = inputChar === char ? 'correct-char' : 'wrong-char';
            } else {
                className = 'untyped-char';
            }
            if (index === inputChars.length && practiceState.status === 'running') {
                className += ' current-char-position';
            }
            return <span key={index} className={className}>{char}</span>;
        });
    }, [practiceState.text, practiceState.userInput, practiceState.status]);

    const handleUserInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        const text = practiceState.text;
        if (practiceState.status === "finished") return;
        if (practiceState.errors >= MAX_ERRORS && newValue.length > practiceState.userInput.length) return;

        let newStatus: PracticeState["status"] = practiceState.status;
        let newStartTime: number | null = practiceState.startTime;
        let errors = 0;

        if (newStatus === "idle" && newValue.length > 0) {
            newStatus = "running";
            newStartTime = Date.now();
        }

        for (let i = 0; i < newValue.length; i++) {
            if (i < text.length && newValue[i] !== text[i]) errors++;
        }

        let newEndTime: number | null = practiceState.endTime;
        if (newValue.length >= text.length) {
            newStatus = "finished";
            newEndTime = practiceState.endTime || Date.now();
        }

        setPracticeState(prevState => {
            let wpm = 0;
            let accuracy = 100;
            const currentInputLength = newValue.length;

            if (newStatus === "running" || newStatus === "finished") {
                const startTime = newStartTime || prevState.startTime;
                if (startTime) {
                    const timeElapsedMs = (newEndTime || Date.now()) - startTime;
                    const timeElapsedMin = timeElapsedMs / 60000;
                    if (timeElapsedMin > 0 && currentInputLength > 0) {
                        const netChars = currentInputLength - errors;
                        wpm = Math.max(0, Math.floor((netChars / 5) / timeElapsedMin));
                        accuracy = Math.max(0, 100 - (errors / currentInputLength) * 100);
                    }
                }
            }

            return {
                ...prevState,
                userInput: newValue.slice(0, text.length),
                status: newStatus,
                startTime: newStartTime,
                endTime: newEndTime,
                errors,
                wpm,
                accuracy,
            };
        });
    };

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (practiceState.status === 'running') {
            interval = setInterval(() => setTimer(prev => prev + 1), 1000);
        }
        return () => interval && clearInterval(interval);
    }, [practiceState.status]);

    const progressPercentage = practiceState.text.length > 0
        ? (practiceState.userInput.length / practiceState.text.length) * 100
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
                        {practiceState.wpm} WPM | {progressPercentage.toFixed(1)}%
                    </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-4 overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                    <div className="h-full transition-all duration-300" style={{ width: `${progressPercentage}%`, backgroundColor: 'var(--accent)' }} />
                </div>
            </div>

            {practiceState.status !== 'finished' && (
                <div className="flex justify-between w-full max-w-4xl mb-4 text-xl font-mono" style={{ color: 'var(--text-secondary)' }}>
                    <span>Temps: {timer}s</span>
                    <span>WPM: {practiceState.wpm}</span>
                    <span>Erreurs: {practiceState.errors}/{MAX_ERRORS}</span>
                    <span>Précision: {practiceState.accuracy.toFixed(1)}%</span>
                </div>
            )}

            <div className="ui-card w-full max-w-4xl p-6 mb-6 text-2xl tracking-wide leading-relaxed" style={{ backgroundColor: 'var(--bg-card)' }}>
                <p>{renderText}</p>
            </div>

            {practiceState.status === 'finished' && (
                <div className="w-full max-w-4xl mb-6 p-6 rounded-xl border-2" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--accent)' }}>
                    <h2 className="text-4xl font-extrabold mb-4 text-center" style={{ color: 'var(--accent)' }}>
                        {bestWpm !== null && practiceState.wpm > bestWpm ? '🎉 New Record!' : 'Practice Complete!'}
                    </h2>
                    <p className="text-2xl font-bold text-center" style={{ color: 'var(--text-primary)' }}>WPM: {practiceState.wpm}</p>
                    <p className="text-lg text-center" style={{ color: 'var(--text-secondary)' }}>
                        Précision: {practiceState.accuracy.toFixed(1)}% | Erreurs: {practiceState.errors}
                    </p>
                    {bestWpm !== null && practiceState.wpm <= bestWpm && (
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
                    borderColor: practiceState.errors > 0 ? '#ff4d4d' : 'var(--accent)',
                    caretColor: 'var(--accent)',
                    opacity: practiceState.status === 'finished' ? 0 : 1,
                }}
                value={practiceState.userInput}
                onChange={handleUserInput}
                disabled={practiceState.status === 'finished'}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
            />

            {practiceState.errors >= MAX_ERRORS && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500 font-bold animate-pulse">
                    ⚠️ You are typing it wrong! Please correct your errors.
                </div>
            )}

            {practiceState.status !== 'finished' && (
                <button onClick={handleReset} className="mt-12 py-2 px-4 rounded-md flex items-center transition hover:opacity-80" style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-base)' }}>
                    <RefreshCw size={18} className="mr-2" /> Redémarrer
                </button>
            )}
        </div>
    );
};

export default PracticePage;