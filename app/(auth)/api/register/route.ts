import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";


export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, username, password } = body;

        if (!email || !username || !password) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (existingUser) {
            return NextResponse.json({ message: "User already exists" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                email,
                username,
                hashedPassword,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("[REGISTER_ERROR]", error);
        return NextResponse.json({ message: `Internal Error: ${error instanceof Error ? error.message : 'Unknown error'}` }, { status: 500 });
    }
}
