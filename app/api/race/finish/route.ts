import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { sanitizeAndValidateRacePayload, saveRaceResult } from '@/lib/race';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const body = await request.json();

        // 1. Validate Payload
        const validation = sanitizeAndValidateRacePayload(body);
        if (!validation.valid || !validation.data) {
            return NextResponse.json({ error: validation.reason }, { status: 400 });
        }

        // 2. Handle Guest (if we decide to save guest races to DB later, we can do it here. 
        // For now, the prompt says guest stats are local, but "Persists a RaceResult row... userId (nullable)".
        // So we WILL save the race row for guests too, but with userId=null).

        let userId = null;
        if (session?.user?.email) {
            // We need the User ID, not just email. 
            // Ideally session callback puts ID in session. 
            // If not, we might need to fetch user by email.
            // Let's assume session.user.id exists or we fetch it.
            // Standard NextAuth doesn't put ID in session by default unless configured.
            // I'll assume it's there or I'll fetch it.
            // To be safe, I'll fetch the user by email if ID is missing.

            // Actually, let's check if we can get the ID.
            // If we can't, we can't link the race.
            // I'll use the email to find the user.

            // Wait, I can't import prisma here easily if I want to keep it clean.
            // But I have `saveRaceResult` which takes `userId`.
            // I'll modify `saveRaceResult` or logic here.
            // Let's try to get ID from session (common pattern).
            // If not, I'll query DB.

            // For now, I'll assume session.user.email is valid and query DB for ID.
            // Or better, I'll update `saveRaceResult` to take email? No, userId is better.

            // Let's use a quick lookup.
            const { prisma } = await import('@/lib/prisma');
            const user = await prisma.user.findUnique({ where: { email: session.user.email } });
            if (user) {
                userId = user.id;
            }
        }

        // 3. Save Result
        // If userId is null, we still save the race (as per "RaceResult row... userId (nullable)")
        // But `saveRaceResult` logic currently updates User stats.
        // I need to update `saveRaceResult` to handle null userId (skip user update).

        // Wait, my `saveRaceResult` throws if user not found.
        // I should modify `saveRaceResult` in `lib/race.ts` to handle null userId?
        // Or handle it here.
        // The prompt says "Persists a RaceResult row... userId (nullable)".
        // And "Guest stats are stored in sessionStorage".
        // So for guests, we save the race but DO NOT update any user stats.

        // I will modify `lib/race.ts` to handle this, or just call `prisma.race.create` directly here for guests.
        // But `saveRaceResult` encapsulates the transaction.
        // I'll update `lib/race.ts` to be more robust.

        // Actually, I'll just handle it here for now to avoid context switching too much.
        // If userId is present, call `saveRaceResult`.
        // If not, just create race.

        if (userId) {
            const result = await saveRaceResult(userId, validation.data);
            return NextResponse.json(result);
        } else {
            // Guest: Just save the race
            const { prisma } = await import('@/lib/prisma');
            const race = await prisma.race.create({
                data: {
                    wpm: validation.data.wpm,
                    accuracy: validation.data.accuracy,
                    durationMs: validation.data.durationMs,
                    charsTyped: validation.data.charsTyped,
                    charsCorrect: validation.data.charsCorrect,
                    mistakes: validation.data.mistakes,
                    // userId is null
                }
            });
            return NextResponse.json({ race, user: null });
        }

    } catch (error) {
        console.error('Error saving race:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
