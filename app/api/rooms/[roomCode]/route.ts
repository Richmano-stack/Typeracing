import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ roomCode: string }> }
) {
    try {
        const { roomCode } = await params;

        if (!roomCode || typeof roomCode !== 'string') {
            return new NextResponse("Invalid room code", { status: 400 });
        }

        const room = await prisma.raceRoom.findUnique({
            where: { roomCode },
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

        if (!room) {
            return new NextResponse("Room not found", { status: 404 });
        }

        return NextResponse.json({
            ...room,
            inviteLink: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/race/invite/${roomCode}`,
        });
    } catch (error) {
        console.error("[ROOMS_GET]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

