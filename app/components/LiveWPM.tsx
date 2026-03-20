"use client";

import React, { useState, useEffect, memo } from 'react';

interface LiveWPMProps {
    startTime: number | null;
    currentIndex: number;
    isFinished: boolean;
}

const LiveWPM: React.FC<LiveWPMProps> = ({ startTime, currentIndex, isFinished }) => {
    const [wpm, setWpm] = useState<number | null>(0);

    useEffect(() => {
        if (!startTime || isFinished) {
            if (isFinished && startTime) {
                // Final calculation when finished to ensure accuracy
                const totalTimeInMinutes = (Date.now() - startTime) / 60000;
                if (totalTimeInMinutes > 0 && currentIndex >= 5) {
                    setWpm(Math.round((currentIndex / 5) / totalTimeInMinutes));
                }
            }
            return;
        }

        const interval = setInterval(() => {
            const now = Date.now();
            const elapsedMinutes = (now - startTime) / 60000;

            if (elapsedMinutes > 0 && currentIndex >= 5) {
                const calculatedWpm = Math.round((currentIndex / 5) / elapsedMinutes);
                setWpm(calculatedWpm);
            } else {
                setWpm(0);
            }
        }, 500);

        return () => clearInterval(interval);
    }, [startTime, currentIndex, isFinished]);

    // Reset WPM when startTime is null (e.g., on race reset)
    useEffect(() => {
        if (!startTime) {
            setWpm(0);
        }
    }, [startTime]);

    return (
        <div className="flex flex-col items-end">
            <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-1">
                Real-time Velocity
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black italic text-[var(--primary)] text-neon">
                    {wpm ?? 0}
                </span>
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-tighter">
                    WPM
                </span>
            </div>
        </div>
    );
};

export default memo(LiveWPM);
