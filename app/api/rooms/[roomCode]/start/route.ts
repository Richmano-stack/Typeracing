import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TYPING_TEXTS } from "@/lib/texts";

// Simple rate limiting: track room creation per user
const roomCreationTimes = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_ROOMS_PER_HOUR = 5;

export async function POST(
    req: Request,
    { params }: { params: Promise<{ roomCode: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { roomCode } = await params;

        if (!roomCode || typeof roomCode !== 'string') {
            return new NextResponse("Invalid room code", { status: 400 });
        }

        // Find room
        const room = await prisma.raceRoom.findUnique({
            where: { roomCode },
            include: {
                participants: {
                    where: {
                        isReady: true,
                    },
                },
            },
        });

        if (!room) {
            return new NextResponse("Room not found", { status: 404 });
        }

        // Verify requester is host
        const userId = session?.user?.id || null;
        if (room.hostId !== userId) {
            return new NextResponse("Only the host can start the race", { status: 403 });
        }

        // Rate limiting check (simple in-memory, should use Redis in production)
        if (userId) {
            const now = Date.now();
            const userTimes = roomCreationTimes.get(userId) || [];
            const recentTimes = userTimes.filter(time => now - time < RATE_LIMIT_WINDOW);
            
            if (recentTimes.length >= MAX_ROOMS_PER_HOUR) {
                return new NextResponse("Rate limit exceeded. Please wait before starting another race.", { status: 429 });
            }
            
            roomCreationTimes.set(userId, [...recentTimes, now]);
        }

        // Validate minimum participants (at least 2)
        if (room.participants.length < 2) {
            return new NextResponse("At least 2 ready participants required", { status: 400 });
        }

        // Check if room is already in progress
        if (room.status === 'IN_PROGRESS' || room.status === 'STARTING') {
            return new NextResponse("Race has already started", { status: 403 });
        }

        // Select random text
        const randomIndex = Math.floor(Math.random() * TYPING_TEXTS.length);
        const selectedText = TYPING_TEXTS[randomIndex];

        // Update room status to STARTING
        const updatedRoom = await prisma.raceRoom.update({
            where: { id: room.id },
            data: {
                status: 'STARTING',
                currentText: selectedText,
                textId: randomIndex.toString(),
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                            },
                        },
                    },
                    orderBy: {
                        joinedAt: 'asc',
                    },
                },
            },
        });

        return NextResponse.json({
            room: updatedRoom,
            text: selectedText,
            textId: randomIndex.toString(),
            countdownStartTime: Date.now(),
        });
    } catch (error) {
        console.error("[ROOMS_START]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

