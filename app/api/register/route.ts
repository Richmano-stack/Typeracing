import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma as db } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, name, password } = body;

        if (!email || !name || !password) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const existingUser = await db.user.findUnique({
            where: {
                email,
            },
        });

        if (existingUser) {
            return new NextResponse("User already exists", { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await db.user.create({
            data: {
                email,
                name,
                hashedPassword,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("[REGISTER_ERROR]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
