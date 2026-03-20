import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getRecentStats } from "@/lib/stats";

/**
 * GET /api/user/stats
 * Retrieves a "System Snapshot" for the authenticated user based on recent activity.
 */
export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await getRecentStats(session.user.id);

    if (!stats) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Telemetry API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
