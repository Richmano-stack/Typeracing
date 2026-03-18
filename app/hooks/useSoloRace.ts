import { useState, useCallback, useMemo } from 'react';

export type RaceStatus = 'idle' | 'running' | 'finished';

export function useSoloRace(text: string) {
    const [userInput, setUserInput] = useState('');
    const [totalCharactersInserted, setTotalCharactersInserted] = useState(0);
    const [status, setStatus] = useState<RaceStatus>('idle');

    // currentIndex is the first index where userInput[i] !== text[i]
    // If userInput matches text from the start, currentIndex is userInput.length
    const currentIndex = useMemo(() => {
        for (let i = 0; i < userInput.length; i++) {
            if (userInput[i] !== text[i]) {
                return i;
            }
        }
        return userInput.length;
    }, [userInput, text]);

    const handleKey = useCallback((key: string) => {
        if (status === 'finished' || !text) return false;

        // Handle Backspace
        if (key === 'Backspace') {
            setUserInput((prev) => prev.slice(0, -1));
            return false;
        }

        // Only handle single printable characters
        if (key.length !== 1 || key === 'Shift' || key === 'Alt' || key === 'Control') {
            return false;
        }

        // Telemetry: increment on every printable character attempt
        setTotalCharactersInserted((prev) => prev + 1);

        // 5-Character Error Buffer Rule:
        // Block if userInput.length === currentIndex + 5
        if (userInput.length >= currentIndex + 5) {
            return false;
        }

        let isFirstChar = false;
        const newUserInput = userInput + key;

        // Transition to running on first character
        if (status === 'idle') {
            setStatus('running');
            isFirstChar = true;
        }

        setUserInput(newUserInput);

        // Check for race finish: exact match required
        if (newUserInput === text) {
            setStatus('finished');
        }

        return isFirstChar;
    }, [userInput, currentIndex, status, text]);

    const reset = useCallback(() => {
        setUserInput('');
        setTotalCharactersInserted(0);
        setStatus('idle');
    }, []);

    return {
        currentIndex,
        userInput,
        totalCharsTyped: totalCharactersInserted,
        totalCharactersInserted,
        status,
        handleKey,
        reset,
    };
}
