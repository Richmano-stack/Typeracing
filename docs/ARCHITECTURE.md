# Authentication Architecture

## Overview

This typeracing application uses **Auth.js (NextAuth v4)** for authentication, **Prisma** as the ORM, and **Supabase Postgres** as the database. This document explains how these technologies connect and work together.

## Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        A[Browser/User]
        B[Login/Register Pages]
        C[useSession Hook]
    end
    
    subgraph "Next.js App Router"
        D[/api/auth/[...nextauth]]
        E[/api/register]
        F[Server Components]
        G[Server Actions]
    end
    
    subgraph "Auth.js Layer"
        H[NextAuth Core]
        I[Prisma Adapter]
        J[Providers]
        K[Session Management]
    end
    
    subgraph "Data Layer"
        L[Prisma Client]
        M[Supabase Postgres]
    end
    
    A --> B
    B --> C
    C --> D
    B --> E
    F --> H
    G --> H
    D --> H
    H --> I
    H --> J
    H --> K
    I --> L
    L --> M
    
    style M fill:#3ECF8E
    style H fill:#7C3AED
    style L fill:#2D3748
```

## How It Works

### 1. User Registration Flow

1. **User fills registration form** (`/register`)
2. **Form submits to `/api/register`** (API Route)
3. **API validates input**:
   - Email format
   - Password strength (min 8 chars)
   - Duplicate email/username check
4. **Password is hashed** using bcryptjs (10 salt rounds)
5. **User created in database** via Prisma
6. **Auto-login** using NextAuth credentials provider
7. **Redirect to profile**

### 2. Email/Password Login Flow

1. **User fills login form** (`/login`)
2. **Form calls `signIn('credentials')`** from NextAuth
3. **NextAuth routes to Credentials Provider** in `/api/auth/[...nextauth]/route.ts`
4. **Provider's `authorize` function**:
   - Finds user by email (Prisma)
   - Verifies password (bcrypt.compare)
   - Returns user object or throws error
5. **JWT created** with user data
6. **Session established** (stored in HTTP-only cookie)
7. **Redirect to profile**

### 3. OAuth Login Flow (GitHub/Google)

1. **User clicks OAuth button** (GitHub or Google)
2. **Form calls `signIn('github')` or `signIn('google')`**
3. **NextAuth redirects to OAuth provider**
4. **User authorizes on provider's site**
5. **Provider redirects back with authorization code**
6. **NextAuth exchanges code for tokens**
7. **Profile data fetched from provider**
8. **Prisma Adapter checks if user exists**:
   - If exists: Link account and sign in
   - If new: Create User + Account records
9. **JWT created** with user data
10. **Session established**
11. **Redirect to profile**

### 4. Session Management

#### JWT Strategy (Current Implementation)

- **Stateless**: No database queries on every request
- **Scalable**: Better for high-traffic applications
- **Storage**: Encrypted in HTTP-only cookie
- **Expiration**: 30 days (configurable)
- **Security**: Signed with `NEXTAUTH_SECRET`

#### How Sessions Work

1. **Login** → JWT created and stored in cookie
2. **Request** → Cookie sent automatically
3. **Server** → JWT verified and decoded
4. **Client** → `useSession()` hook provides user data
5. **Logout** → Cookie cleared

### 5. Database Schema

#### User Table
- **Primary user record**
- Stores: email, username, name, hashedPassword, game stats
- Relations: races, accounts, sessions

#### Account Table
- **OAuth provider accounts**
- Links users to GitHub/Google accounts
- Stores: provider, providerAccountId, tokens

#### Session Table
- **Database sessions** (if using database strategy)
- Currently unused (using JWT strategy)
- Can be enabled for better security/control

#### VerificationToken Table
- **Email verification tokens**
- **Password reset tokens**
- Currently unused (can be implemented later)

## Data Flow Examples

### Creating a Race (with User ID)

```typescript
// In a Server Component or Server Action
import { getUserId } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createRace(wpm: number, accuracy: number, timeTaken: number) {
  const userId = await getUserId()
  
  if (!userId) {
    throw new Error('Not authenticated')
  }
  
  const race = await prisma.race.create({
    data: {
      userId,
      wpm,
      accuracy,
      timeTaken,
    }
  })
  
  return race
}
```

### Protecting a Server Component

```typescript
// app/profile/page.tsx
import { requireAuth } from '@/lib/auth'

export default async function ProfilePage() {
  const user = await requireAuth() // Redirects to /login if not authenticated
  
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
    </div>
  )
}
```

### Using Session in Client Component

```typescript
'use client'

import { useSession } from 'next-auth/react'

export default function UserProfile() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') return <div>Loading...</div>
  if (status === 'unauthenticated') return <div>Not logged in</div>
  
  return (
    <div>
      <h1>Hello, {session.user.name}!</h1>
      <p>Email: {session.user.email}</p>
      <p>Username: {session.user.username}</p>
    </div>
  )
}
```

## Technology Stack Details

### Auth.js (NextAuth)
- **Version**: 4.24.13
- **Purpose**: Authentication framework
- **Features**: Multiple providers, session management, callbacks
- **Docs**: https://next-auth.js.org/

### Prisma
- **Version**: 6.19.0
- **Purpose**: ORM (Object-Relational Mapping)
- **Features**: Type-safe database queries, migrations, schema management
- **Docs**: https://www.prisma.io/docs

### Supabase Postgres
- **Purpose**: PostgreSQL database hosting
- **Features**: Connection pooling, direct connections, backups
- **Note**: Only using database, not Supabase Auth
- **Docs**: https://supabase.com/docs/guides/database

### Prisma Adapter
- **Package**: @auth/prisma-adapter
- **Purpose**: Connect Auth.js to Prisma
- **Features**: Automatic user/account/session management
- **Docs**: https://authjs.dev/reference/adapter/prisma

## Security Features

1. **Password Hashing**: bcryptjs with 10 salt rounds
2. **JWT Signing**: NEXTAUTH_SECRET for token integrity
3. **HTTP-Only Cookies**: Prevents XSS attacks
4. **Secure Cookies**: HTTPS-only in production
5. **CSRF Protection**: Built into NextAuth
6. **Session Expiration**: 30-day max age
7. **Input Validation**: Email format, password strength
8. **SQL Injection Protection**: Prisma parameterized queries

## Environment Variables

See [`docs/ENV_VARIABLES.md`](./ENV_VARIABLES.md) for complete list.

## Next Steps

- Implement email verification
- Add password reset functionality
- Implement rate limiting for login attempts
- Add two-factor authentication (2FA)
- Implement session management UI (view active sessions, revoke)
