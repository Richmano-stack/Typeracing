import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

// Extend the built-in session types
declare module "next-auth" {
    interface Session {
        user: {
            id: string
            email: string
            name: string | null
            image: string | null
        } & DefaultSession["user"]
    }

    interface User extends DefaultUser {
        // No additional fields needed beyond DefaultUser
    }
}

// Extend the built-in JWT types
declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id: string
        email: string
        provider?: string
    }
}
