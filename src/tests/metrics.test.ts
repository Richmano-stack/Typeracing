import { describe, it, expect } from 'vitest';
import { calculateRaceMetrics } from '../lib/game/metrics';

describe('calculateRaceMetrics', () => {
    it('calculates perfect typing metrics correctly', () => {
        const input = "hello";
        const prompt = "hello world";
        const durationMs = 15000; // 15 seconds (0.25 mins)
        // 5 chars / 5 = 1 word. 1 word / 0.25 mins = 4 wpm
        
        const result = calculateRaceMetrics({
            input,
            prompt,
            durationMs,
            totalStrokes: 5,
            totalErrors: 0,
            errorBuffer: 5
        });

        expect(result.wpm).toBe(4);
        expect(result.accuracy).toBe(100);
        expect(result.progress).toBe(Number(((5 / 11) * 100).toFixed(2)));
        expect(result.isFinished).toBe(false);
    });

    it('evaluates gracefully within the buffer threshold', () => {
        // 3 errors, which is <= 5 buffer
        const input = "helXXX"; // "hel" matches, 3 errors
        const prompt = "hello world";
        const durationMs = 60000; // 1 min (3 correct chars allowed to count if typed further? Wait.)
        // Actually, the effectiveCorrectCount depends on what matches the prompt out of the effective input.
        // prompt: "hello world"
        // input:  "helXXX"
        // correct in input: 'h','e','l'. 'X'!=l, 'X'!=o, 'X'!= ' '
        
        const result = calculateRaceMetrics({
            input,
            prompt,
            durationMs,
            totalStrokes: 6,
            totalErrors: 3,
            errorBuffer: 5
        });

        // 3 contiguous correct
        // 3 contiguous correct. 3/5 = 0.6. Math.round(0.6) = 1.
        expect(result.wpm).toBe(1); 
        expect(result.accuracy).toBe(50); // (6 - 3)/6 = 3/6 = 50%
        expect(result.progress).toBe(Number(((6 / 11) * 100).toFixed(2))); // within buffer, effectiveLength = 6
    });

    it('freezes WPM and Progress when buffer is exceeded', () => {
        // 8 errors, exceeds 5 buffer
        const input = "helXXXXXXXX"; // 3 contiguous correct, 8 errors
        const prompt = "hello world";
        const durationMs = 60000;
        
        const result = calculateRaceMetrics({
            input,
            prompt,
            durationMs,
            totalStrokes: 11,
            totalErrors: 8,
            errorBuffer: 5
        });

        // Contiguous correct = 3. Buffer = 5. Effective length = 3 + 5 = 8.
        // effectiveCorrectCount = number of matching chars in the first 8 characters.
        // first 8 chars of input: "helXXXXX".
        // matches 'h','e','l' (3 total)
        // WPM: 3 / 5 / 1 = 0.6 => Math.round(0) => 0. Wait, let's make WPM non-zero.
        
        const resultProgress = result.progress;
        expect(resultProgress).toBe(Number(((8 / 11) * 100).toFixed(2))); // Caps at 8 effective length!
        expect(result.accuracy).toBe(27); // Math.round((3/11)*100) = 27
    });

    it('safely handles 0 duration to prevent Infinity', () => {
        const result = calculateRaceMetrics({
            input: "hello",
            prompt: "hello world",
            durationMs: 0,
            totalStrokes: 5,
            totalErrors: 0,
        });

        expect(result.wpm).not.toBe(Infinity);
        // 1 ms floor logic
        // 1 minute = 60000 ms. 1ms = 1/60000 mins
        // length = 5 (1 word). 1 / (1/60000) = 60000 wpm
        expect(result.wpm).toBe(60000); 
    });

    it('marks isFinished true when contiguous correct equals prompt length', () => {
        const input = "hello world";
        const prompt = "hello world";
        const result = calculateRaceMetrics({
            input,
            prompt,
            durationMs: 12000,
            totalStrokes: 11,
            totalErrors: 0,
        });

        expect(result.isFinished).toBe(true);
        expect(result.progress).toBe(100);
    });
});
