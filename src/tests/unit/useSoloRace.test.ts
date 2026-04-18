import { describe, it, expect, vi, beforeEach } from "vitest";

// Lightweight React Mock to avoid needing @testing-library/react DOM parsers
let stateValues: any[] = [];
let stateIndex = 0;

vi.mock("react", () => ({
    useState: (initial: any) => {
        const id = stateIndex++;
        if (stateValues[id] === undefined) {
            stateValues[id] = typeof initial === "function" ? initial() : initial;
        }
        const setState = (updater: any) => {
            stateValues[id] = typeof updater === "function" ? updater(stateValues[id]) : updater;
        };
        return [stateValues[id], setState];
    },
    useCallback: (fn: any) => fn,
    useMemo: (fn: any) => fn(),
}));

import { useSoloRace } from "@/hooks/useSoloRace";

// Helper to simulate a React render lifecycle
function renderHook(text: string) {
    stateIndex = 0; // reset pointer before rendering
    return useSoloRace(text);
}

describe("useSoloRace Hook - 5-Character Error Buffer", () => {
    beforeEach(() => {
        stateValues = [];
        stateIndex = 0;
    });

    it("verifies that typing matching characters advances currentIndex and userInput", () => {
        let result = renderHook("apple");
        
        result.handleKey("a");
        result = renderHook("apple");

        expect(result.currentIndex).toBe(1);
        expect(result.userInput).toBe("a");
        expect(result.totalCharactersInserted).toBe(1);
    });

    it("verifies that typing a WRONG character keeps currentIndex at the first mismatch", () => {
        let result = renderHook("apple");
        
        result.handleKey("a"); // Correct
        result = renderHook("apple");
        
        result.handleKey("q"); // Wrong: should be 'p'
        result = renderHook("apple");

        expect(result.currentIndex).toBe(1); // Stuck at index 1 ('p')
        expect(result.userInput).toBe("aq");
        expect(result.totalCharactersInserted).toBe(2);
    });

    it("verifies that the user captures input but triggers isOverBufferLimit at currentIndex + 5 during an error", () => {
        let result = renderHook("apple");
        
        // currentIndex: 0
        result.handleKey("1");
        result = renderHook("apple");
        result.handleKey("2");
        result = renderHook("apple");
        result.handleKey("3");
        result = renderHook("apple");
        result.handleKey("4");
        result = renderHook("apple");
        result.handleKey("5");
        result = renderHook("apple");
        
        expect(result.currentIndex).toBe(0);
        expect(result.userInput).toBe("12345");
        expect(result.totalCharactersInserted).toBe(5);
        expect(result.isOverBufferLimit).toBe(true);

        // Attempt 6th character - should NOT be blocked in soft-block, but still over limit
        result.handleKey("6");
        result = renderHook("apple");
        
        expect(result.userInput).toBe("123456"); 
        expect(result.isOverBufferLimit).toBe(true);
        expect(result.totalCharactersInserted).toBe(6);
    });

    it("verifies that Backspace removes characters and totalCharactersInserted does not decrease", () => {
        let result = renderHook("apple");
        
        result.handleKey("a");
        result = renderHook("apple");
        result.handleKey("p");
        result = renderHook("apple");
        result.handleKey("q"); // error at index 2
        result = renderHook("apple");
        
        expect(result.userInput).toBe("apq");
        expect(result.totalCharactersInserted).toBe(3);

        result.handleKey("Backspace");
        result = renderHook("apple");
        
        expect(result.userInput).toBe("ap"); // "q" removed
        expect(result.currentIndex).toBe(2); // Matches up to index 2
        expect(result.totalCharactersInserted).toBe(3); // Does not decrease
    });

    it("verifies that the race finishes only when userInput === text", () => {
        let result = renderHook("hi");
        
        result.handleKey("h");
        result = renderHook("hi");
        result.handleKey("x"); // error
        result = renderHook("hi");
        expect(result.status).toBe("running");

        result.handleKey("Backspace");
        result = renderHook("hi");
        
        result.handleKey("i");
        result = renderHook("hi");
        
        expect(result.status).toBe("finished");
        expect(result.userInput).toBe("hi");
    });

    it("verifies that totalCharactersInserted ignores Shift/Alt/Ctrl", () => {
        let result = renderHook("apple");
        
        result.handleKey("Shift");
        result = renderHook("apple");
        result.handleKey("Alt");
        result = renderHook("apple");
        result.handleKey("Control");
        result = renderHook("apple");
        
        expect(result.totalCharactersInserted).toBe(0);
    });
});
