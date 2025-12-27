import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateRoomCode } from "@/lib/rooms/roomCode";
import { sanitizeGuestName, validateMaxPlayers } from "@/lib/rooms/validation";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const body = await req.json();
        const { maxPlayers, textId, guestName } = body;

        // Validate maxPlayers (2-20 range)
        const maxPlayersNum = maxPlayers ? Number(maxPlayers) : 10;
        if (!validateMaxPlayers(maxPlayersNum)) {
            return new NextResponse("Invalid max players (must be between 2 and 20)", { status: 400 });
        }
        const validatedMaxPlayers = maxPlayersNum;

        // Sanitize guest name if provided
        let sanitizedGuestName: string | undefined;
        if (guestName && typeof guestName === 'string') {
            sanitizedGuestName = sanitizeGuestName(guestName);
            if (!sanitizedGuestName) {
                return new NextResponse("Invalid guest name", { status: 400 });
            }
        }

        // Generate unique room code
        const roomCode = await generateRoomCode();

        // Create room
        const room = await prisma.raceRoom.create({
            data: {
                roomCode,
                hostId: session?.user?.id || null,
                maxPlayers: validatedMaxPlayers,
                textId: textId || null,
                isPrivate: true,
                status: 'WAITING',
            },
        });

        // Create participant entry for the host
        const participant = await prisma.raceParticipant.create({
            data: {
                roomId: room.id,
                userId: session?.user?.id || null,
                guestName: !session?.user?.id ? (sanitizedGuestName || 'Guest') : null,
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

        // Get full room data with participants
        const roomWithParticipants = await prisma.raceRoom.findUnique({
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
                host: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
            },
        });

        return NextResponse.json({
            ...roomWithParticipants,
            inviteLink: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/race/invite/${roomCode}`,
        });
    } catch (error) {
        console.error("[ROOMS_POST]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

