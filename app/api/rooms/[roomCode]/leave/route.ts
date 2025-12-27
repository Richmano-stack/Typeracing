import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
                participants: true,
            },
        });

        if (!room) {
            return new NextResponse("Room not found", { status: 404 });
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
            // For guests, we need guestName from body
            const body = await req.json().catch(() => ({}));
            const { guestName } = body;
            
            if (!guestName) {
                return new NextResponse("Guest name required", { status: 400 });
            }

            participant = await prisma.raceParticipant.findFirst({
                where: {
                    roomId: room.id,
                    userId: null,
                    guestName: guestName,
                },
            });
        }

        if (!participant) {
            return new NextResponse("Participant not found in room", { status: 404 });
        }

        // Check if this is the host
        const isHost = room.hostId === userId;

        // Delete participant
        await prisma.raceParticipant.delete({
            where: { id: participant.id },
        });

        // If host left, check if we should delete room or transfer host
        if (isHost) {
            const remainingParticipants = await prisma.raceParticipant.findMany({
                where: { roomId: room.id },
                orderBy: { joinedAt: 'asc' },
                take: 1,
            });

            if (remainingParticipants.length > 0) {
                // Transfer host to first remaining participant
                await prisma.raceRoom.update({
                    where: { id: room.id },
                    data: {
                        hostId: remainingParticipants[0].userId,
                    },
                });
            } else {
                // No participants left, delete room
                await prisma.raceRoom.delete({
                    where: { id: room.id },
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[ROOMS_LEAVE]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

