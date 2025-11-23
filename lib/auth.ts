import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

/**
 * Get the current user session in Server Components
 * @returns User session or null if not authenticated
 */
export async function getCurrentUser() {
    const session = await getServerSession(authOptions)
    return session?.user || null
}

/**
 * Require authentication - redirect to login if not authenticated
 * Use this in Server Components or Server Actions to protect routes
 * @returns User session
 */
export async function requireAuth() {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
        redirect("/login")
    }

    return session.user
}

/**
 * Check if user is authenticated (boolean)
 * @returns true if authenticated, false otherwise
 */
export async function isAuthenticated() {
    const session = await getServerSession(authOptions)
    return !!session?.user
}

/**
 * Get user ID from session
 * @returns User ID or null
 */
export async function getUserId() {
    const session = await getServerSession(authOptions)
    return session?.user?.id || null
}
