import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/api/auth/[...nextauth]/route";
import { getUserProfile } from "@/lib/data";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // We use email here because session.user.id might not be available if the session callback isn't set up perfectly yet,
    // but ideally we should use ID. Let's assume ID is available as per your request.
    // If ID is missing, we can fallback to fetching by email if we modified getUserProfile, but let's stick to ID as planned.

    if (!session.user.id) {
        return NextResponse.json({ error: "User ID missing in session" }, { status: 400 });
    }

    const user = await getUserProfile(session.user.id);

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
}
