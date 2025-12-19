import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma as db } from "@/lib/prisma";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(db),
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials.password) return null;

                const user = await db.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.hashedPassword) return null;

                const isValid = await bcrypt.compare(
                    credentials.password,
                    user.hashedPassword
                );

                return isValid ? user : null;
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async session({ session, token }) {
            if (token && session.user) {
                // Ensure user ID is set from token.sub
                session.user.id = (token.sub as string) || (token.id as string);
                // Populate name from username stored in token
                session.user.name = (token.username as string) || session.user.email || null;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                // Set token.sub to user.id (required for NextAuth)
                token.sub = user.id;
                // Also store id separately for easier access
                token.id = user.id;
                // Store username for session
                token.username = (user as any).username;
            } else if (token.email && !token.sub) {
                // Fallback: if token doesn't have sub but has email, fetch user ID and username from database
                try {
                    const dbUser = await db.user.findUnique({
                        where: { email: token.email as string },
                        select: { id: true, username: true },
                    });
                    if (dbUser) {
                        token.sub = dbUser.id;
                        token.id = dbUser.id;
                        token.username = dbUser.username;
                    }
                } catch (error) {
                    console.error("[AUTH] Error fetching user ID:", error);
                }
            }
            return token;
        }
    }
};
