import NextAuth, { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import type { Adapter } from "next-auth/adapters"

export const authOptions: NextAuthOptions = {
    // Use Prisma adapter to connect Auth.js with your Supabase Postgres database
    adapter: PrismaAdapter(prisma) as Adapter,

    // Configure authentication providers
    providers: [
        // ============================================
        // CREDENTIALS PROVIDER (Email/Password)
        // ============================================
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                // Validate input
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials")
                }

                // Find user by email
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                })

                // Check if user exists and has a password (not OAuth-only)
                if (!user || !user.hashedPassword) {
                    throw new Error("Invalid credentials")
                }

                // Verify password
                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.hashedPassword
                )

                if (!isPasswordValid) {
                    throw new Error("Invalid credentials")
                }

                // Return user object (will be stored in JWT)
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    username: user.username,
                    image: user.image,
                }
            }
        }),

        // ============================================
        // GITHUB OAUTH PROVIDER
        // ============================================
        GithubProvider({
            clientId: process.env.GITHUB_ID as string,
            clientSecret: process.env.GITHUB_SECRET as string,
            profile(profile) {
                return {
                    id: profile.id.toString(),
                    email: profile.email,
                    name: profile.name || profile.login,
                    username: profile.login,
                    image: profile.avatar_url,
                }
            }
        }),

        // ============================================
        // GOOGLE OAUTH PROVIDER
        // ============================================
        GoogleProvider({
            clientId: process.env.GOOGLE_ID as string,
            clientSecret: process.env.GOOGLE_SECRET as string,
            profile(profile) {
                return {
                    id: profile.sub,
                    email: profile.email,
                    name: profile.name,
                    username: profile.email?.split('@')[0] || null, // Use email prefix as username
                    image: profile.picture,
                    emailVerified: profile.email_verified ? new Date() : null,
                }
            }
        }),
    ],

    // ============================================
    // SESSION STRATEGY
    // ============================================
    session: {
        strategy: "jwt", // Use JWT for stateless sessions (better for scalability)
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },

    // ============================================
    // PAGES (Custom auth pages)
    // ============================================
    pages: {
        signIn: "/login",
        // signOut: '/auth/signout',
        // error: '/auth/error',
        // verifyRequest: '/auth/verify-request',
    },

    // ============================================
    // CALLBACKS (Customize session and JWT)
    // ============================================
    callbacks: {
        // JWT callback - runs when JWT is created or updated
        async jwt({ token, user, account }) {
            // Initial sign in
            if (user) {
                token.id = user.id
                token.email = user.email
                token.name = user.name
                token.username = (user as any).username
                token.image = user.image
            }

            // OAuth sign in - store provider info
            if (account) {
                token.provider = account.provider
            }

            return token
        },

        // Session callback - runs when session is checked
        async session({ session, token }) {
            if (token && session.user) {
                // Validate that the user actually exists in the database
                // This prevents "ghost" sessions after a database reset
                const dbUser = await prisma.user.findUnique({
                    where: { id: token.id as string }
                });

                if (!dbUser) {
                    // User not found in DB (likely deleted/reset)
                    // Return session without user to force logout/guest state
                    // @ts-ignore
                    session.user = null;
                    return session;
                }

                session.user.id = token.id as string
                session.user.email = token.email as string
                session.user.name = token.name as string
                session.user.username = token.username as string
                session.user.image = token.image as string
            }

            return session
        },

        // Redirect callback - customize redirects after sign in/out
        async redirect({ url, baseUrl }) {
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`
            // Allows callback URLs on the same origin
            else if (new URL(url).origin === baseUrl) return url
            return baseUrl
        },
    },

    // ============================================
    // EVENTS (Optional logging/analytics)
    // ============================================
    events: {
        async signIn({ user, account, profile, isNewUser }) {
            console.log(`User signed in: ${user.email}`)
            if (isNewUser) {
                console.log(`New user created: ${user.email}`)
            }

            // Update lastLogin timestamp
            if (user.email) {
                try {
                    await prisma.user.update({
                        where: { email: user.email },
                        data: { lastLogin: new Date() }
                    })
                } catch (error) {
                    console.error("Error updating lastLogin:", error)
                }
            }
        },
        async signOut({ token }) {
            console.log(`User signed out: ${token.email}`)
        },
    },

    // ============================================
    // SECURITY
    // ============================================
    secret: process.env.NEXTAUTH_SECRET,

    // Enable debug messages in development
    debug: process.env.NODE_ENV === "development",
}

// Export handlers for App Router
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
