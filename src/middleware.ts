import { betterFetch } from "@better-fetch/fetch";
import { NextResponse, type NextRequest } from "next/server";
import type { Session } from "better-auth/types";

export default async function middleware(request: NextRequest) {
    const { data: session } = await betterFetch<Session>(
        "/api/auth/get-session",
        {
            baseURL: request.nextUrl.origin,
            headers: {
                // Essential: Pass the cookies from the request to BetterAuth
                cookie: request.headers.get("cookie") || "",
            },
        }
    );

    const isAuthPage = request.nextUrl.pathname.startsWith("/login") ||
        request.nextUrl.pathname.startsWith("/register");
    const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");

    if (!session && isDashboardPage) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    if (session && isAuthPage) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

// Optimization: Only run middleware on these paths
export const config = {
    matcher: ["/dashboard/:path*", "/login", "/register"],
};