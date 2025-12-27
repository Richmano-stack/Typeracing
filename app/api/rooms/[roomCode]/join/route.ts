import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sanitizeGuestName } from "@/lib/rooms/validation";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ roomCode: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { roomCode } = await params;
        const body = await req.json();
        const { guestName } = body;

        if (!roomCode || typeof roomCode !== 'string') {
            return new NextResponse("Invalid room code", { status: 400 });
        }

        // Find room
        const room = await prisma.raceRoom.findUnique({
            where: { roomCode },
            include: {
                participants: true,
            },
        });

        if (!room) {
            return new NextResponse("Room not found", { status: 404 });
        }

        // Check if room is full
        if (room.participants.length >= room.maxPlayers) {
            return new NextResponse("Room is full", { status: 403 });
        }

        // Check if room is already in progress
        if (room.status === 'IN_PROGRESS' || room.status === 'STARTING') {
            return new NextResponse("Race has already started", { status: 403 });
        }

        const userId = session?.user?.id || null;
        let finalGuestName: string | null = null;
        
        if (!userId) {
            if (!guestName || typeof guestName !== 'string') {
                return new NextResponse("Guest name required", { status: 400 });
            }
            const sanitized = sanitizeGuestName(guestName);
            if (!sanitized) {
                return new NextResponse("Invalid guest name", { status: 400 });
            }
            finalGuestName = sanitized;
        }

        // Check if user/guest is already in room
        if (userId) {
            const existingParticipant = await prisma.raceParticipant.findFirst({
                where: {
                    roomId: room.id,
                    userId: userId,
                },
            });

            if (existingParticipant) {
                return NextResponse.json({
                    message: "Already in room",
                    participant: existingParticipant,
                });
            }
        } else {
            // For guests, check by guestName (simple check, not perfect but works)
            const existingGuest = await prisma.raceParticipant.findFirst({
                where: {
                    roomId: room.id,
                    userId: null,
                    guestName: finalGuestName,
                },
            });

            if (existingGuest) {
                return NextResponse.json({
                    message: "Already in room",
                    participant: existingGuest,
                });
            }
        }

        // Create participant
        const participant = await prisma.raceParticipant.create({
            data: {
                roomId: room.id,
                userId: userId,
                guestName: finalGuestName,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
        });

        // Get updated room with all participants
        const updatedRoom = await prisma.raceRoom.findUnique({
            where: { id: room.id },
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
            participant,
            room: updatedRoom,
        });
    } catch (error) {
        console.error("[ROOMS_JOIN]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

