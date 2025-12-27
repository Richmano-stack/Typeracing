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
        const { isReady, guestName } = body;

        if (!roomCode || typeof roomCode !== 'string') {
            return new NextResponse("Invalid room code", { status: 400 });
        }

        // Find room
        const room = await prisma.raceRoom.findUnique({
            where: { roomCode },
        });

        if (!room) {
            return new NextResponse("Room not found", { status: 404 });
        }

        // Check if room is already in progress
        if (room.status === 'IN_PROGRESS' || room.status === 'STARTING') {
            return new NextResponse("Race has already started", { status: 403 });
        }

        const userId = session?.user?.id || null;

        // Find participant
        let participant;
        if (userId) {
            participant = await prisma.raceParticipant.findFirst({
                where: {
                    roomId: room.id,
                    userId: userId,
                },
            });
        } else {
            if (!guestName || typeof guestName !== 'string') {
                return new NextResponse("Guest name required", { status: 400 });
            }

            const sanitizedGuestName = sanitizeGuestName(guestName);
            if (!sanitizedGuestName) {
                return new NextResponse("Invalid guest name", { status: 400 });
            }

            participant = await prisma.raceParticipant.findFirst({
                where: {
                    roomId: room.id,
                    userId: null,
                    guestName: sanitizedGuestName,
                },
            });
        }

        if (!participant) {
            return new NextResponse("Participant not found in room", { status: 404 });
        }

        // Update ready status
        const updatedParticipant = await prisma.raceParticipant.update({
            where: { id: participant.id },
            data: {
                isReady: isReady !== undefined ? isReady : !participant.isReady,
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

        // Get all participants
        const participants = await prisma.raceParticipant.findMany({
            where: { roomId: room.id },
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
        });

        return NextResponse.json({
            participant: updatedParticipant,
            participants,
        });
    } catch (error) {
        console.error("[ROOMS_READY]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

