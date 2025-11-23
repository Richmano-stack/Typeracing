import { prisma } from '@/lib/prisma';

export interface RacePayload {
    wpm: number;
    accuracy: number;
    durationMs: number;
    charsTyped: number;
    charsCorrect: number;
    mistakes: number;
    textId: string;
}

export function sanitizeAndValidateRacePayload(payload: any): { valid: boolean; reason?: string; data?: RacePayload } {
    const { wpm, accuracy, durationMs, charsTyped, charsCorrect, mistakes, textId } = payload;

    if (typeof wpm !== 'number' || wpm < 0 || wpm > 300) {
        return { valid: false, reason: 'Invalid WPM' };
    }
    if (typeof accuracy !== 'number' || accuracy < 0 || accuracy > 100) {
        return { valid: false, reason: 'Invalid Accuracy' };
    }
    if (typeof durationMs !== 'number' || durationMs < 1000 || durationMs > 3600000) { // 1 sec to 1 hour
        return { valid: false, reason: 'Invalid Duration' };
    }
    if (typeof charsTyped !== 'number' || charsTyped < 0) {
        return { valid: false, reason: 'Invalid Chars Typed' };
    }
    if (typeof charsCorrect !== 'number' || charsCorrect < 0 || charsCorrect > charsTyped) {
        return { valid: false, reason: 'Invalid Chars Correct' };
    }
    if (typeof mistakes !== 'number' || mistakes < 0) {
        return { valid: false, reason: 'Invalid Mistakes' };
    }
    if (typeof textId !== 'string' || !textId) {
        return { valid: false, reason: 'Invalid Text ID' };
    }

    return {
        valid: true,
        data: {
            wpm,
            accuracy,
            durationMs,
            charsTyped,
            charsCorrect,
            mistakes,
            textId,
        },
    };
}

export async function saveRaceResult(userId: string, payload: RacePayload) {
    return await prisma.$transaction(async (tx) => {
        // 1. Create Race
        const race = await tx.race.create({
            data: {
                userId,
                wpm: payload.wpm,
                accuracy: payload.accuracy,
                durationMs: payload.durationMs,
                charsTyped: payload.charsTyped,
                charsCorrect: payload.charsCorrect,
                mistakes: payload.mistakes,
            },
        });

        // 2. Get current user stats
        const user = await tx.user.findUnique({
            where: { id: userId },
            select: { racesPlayed: true, averageWpm: true, bestWpm: true },
        });

        if (!user) throw new Error('User not found');

        // 3. Calculate new stats
        const newRacesPlayed = user.racesPlayed + 1;
        // Formula: ((currentAvg * currentCount) + newWpm) / newCount
        const newAverageWpm = ((user.averageWpm * user.racesPlayed) + payload.wpm) / newRacesPlayed;
        const newBestWpm = Math.max(user.bestWpm, payload.wpm);

        // 4. Update User
        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: {
                racesPlayed: newRacesPlayed,
                averageWpm: newAverageWpm,
                bestWpm: newBestWpm,
                lastRaceAt: new Date(),
            },
        });

        return { race, user: updatedUser };
    });
}
