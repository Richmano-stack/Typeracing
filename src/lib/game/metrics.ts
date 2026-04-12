export interface MetricInputs {
    input: string;
    prompt: string;
    durationMs: number;
    totalStrokes: number;
    totalErrors: number;
    /** Game Mechanic: How many characters you can type past an error before the engine freezes progress */
    errorBuffer?: number;
}

export interface RaceMetrics {
    wpm: number;
    accuracy: number;
    progress: number;
    isFinished: boolean;
    totalStrokes: number;
    totalErrors: number;
}

export function calculateRaceMetrics(params: MetricInputs): RaceMetrics {
    const { input, prompt, durationMs, totalStrokes, totalErrors, errorBuffer = 5 } = params;
    
    // 1. Calculate accuracy (Shared logic)
    let accuracy = 100;
    if (totalStrokes > 0) {
        accuracy = Math.max(0, Math.round(((totalStrokes - totalErrors) / totalStrokes) * 100));
    }
    
    // 2. Determine contiguous correct prefix and total correct characters
    let contiguousCorrect = 0;
    let totalCorrectCount = 0;
    let hasError = false;
    
    for (let i = 0; i < input.length; i++) {
        if (input[i] === prompt[i]) {
            totalCorrectCount++;
            if (!hasError) contiguousCorrect++;
        } else {
            hasError = true;
        }
    }
    
    const currentErrors = input.length - contiguousCorrect;
    
    // 3. Apply the 5-character buffer logic
    let effectiveInputLength = input.length;
    let effectiveCorrectCount = totalCorrectCount;
    
    if (currentErrors > errorBuffer) {
        // Freeze at the buffer threshold
        effectiveInputLength = contiguousCorrect + errorBuffer;
        
        // Re-evaluate correct count up to the frozen boundary
        effectiveCorrectCount = 0;
        for (let i = 0; i < effectiveInputLength; i++) {
            if (input[i] === prompt[i]) {
                effectiveCorrectCount++;
            }
        }
    }
    
    // 4. Progress tracking
    const progressRaw = prompt.length > 0 ? (effectiveInputLength / prompt.length) * 100 : 0;
    const progress = Math.min(100, Number(progressRaw.toFixed(2))); // 2-decimal precision
    const isFinished = contiguousCorrect === prompt.length;

    // 5. WPM Calculation
    const elapsedMins = Math.max(1, durationMs) / 60000;
    let wpm = 0;
    wpm = Math.max(0, Math.round((effectiveCorrectCount / 5) / elapsedMins));
    
    return { wpm, accuracy, progress, isFinished, totalErrors, totalStrokes };
}
