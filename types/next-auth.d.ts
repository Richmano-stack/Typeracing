import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

// Extend the built-in session types
declare module "next-auth" {
    interface Session {
        user: {
            id: string
            email: string
            name: string | null
            username: string | null
            image: string | null
        } & DefaultSession["user"]
    }

    interface User extends DefaultUser {
        username: string | null
    }
}

// Extend the built-in JWT types
declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id: string
        email: string
        username: string | null
        provider?: string
    }
}
