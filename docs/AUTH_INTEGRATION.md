# Authentication Integration Guide

This guide explains how to integrate the authentication system with your typeracing features: races, leaderboards, profiles, and realtime multiplayer.

## Table of Contents
1. [Protecting Routes](#protecting-routes)
2. [Attaching User ID to Races](#attaching-user-id-to-races)
3. [User Profiles](#user-profiles)
4. [Leaderboards](#leaderboards)
5. [Realtime Multiplayer Preparation](#realtime-multiplayer-preparation)

---

## Protecting Routes

### Server Components (Recommended)

Use `requireAuth()` to protect entire pages:

```typescript
// app/profile/page.tsx
import { requireAuth } from '@/lib/auth'

export default async function ProfilePage() {
  const user = await requireAuth() // Redirects to /login if not authenticated
  
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Email: {user.email}</p>
    </div>
  )
}
```

### Client Components

Use `useSession()` hook:

```typescript
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProtectedPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])
  
  if (status === 'loading') {
    return <div>Loading...</div>
  }
  
  if (!session) {
    return null
  }
  
  return <div>Protected content</div>
}
```

### Middleware (Route-Level Protection)

Create `middleware.ts` in the root directory:

```typescript
// middleware.ts
import { withAuth } from "next-auth/middleware"

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token
  },
})

export const config = {
  matcher: [
    '/profile/:path*',
    '/race/:path*',
    '/leaderboard/:path*',
  ]
}
```

---

## Attaching User ID to Races

### Creating a Race (Server Action)

```typescript
// app/actions/race.ts
'use server'

import { getUserId } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

export async function createRace(data: {
  wpm: number
  accuracy: number
  timeTaken: number
}) {
  const userId = await getUserId()
  
  if (!userId) {
    throw new Error('You must be logged in to save races')
  }
  
  const race = await prisma.race.create({
    data: {
      userId,
      wpm: data.wpm,
      accuracy: data.accuracy,
      timeTaken: data.timeTaken,
    }
  })
  
  // Update user stats
  await updateUserStats(userId)
  
  revalidatePath('/profile')
  revalidatePath('/leaderboard')
  
  return race
}

async function updateUserStats(userId: string) {
  const races = await prisma.race.findMany({
    where: { userId },
    select: { wpm: true }
  })
  
  const racesPlayed = races.length
  const averageWpm = races.reduce((sum, r) => sum + r.wpm, 0) / racesPlayed
  const bestWpm = Math.max(...races.map(r => r.wpm))
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      racesPlayed,
      averageWpm,
      bestWpm,
    }
  })
}
```

### Using in Client Component

```typescript
'use client'

import { createRace } from '@/app/actions/race'
import { useState } from 'react'

export default function RaceComponent() {
  const [isFinished, setIsFinished] = useState(false)
  
  const handleRaceFinish = async (results: {
    wpm: number
    accuracy: number
    timeTaken: number
  }) => {
    try {
      await createRace(results)
      setIsFinished(true)
    } catch (error) {
      console.error('Failed to save race:', error)
    }
  }
  
  return (
    <div>
      {/* Your race component */}
    </div>
  )
}
```

---

## User Profiles

### Fetching User Profile Data

```typescript
// app/profile/page.tsx
import { requireAuth } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function ProfilePage() {
  const user = await requireAuth()
  
  // Fetch user with races
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      races: {
        orderBy: { createdAt: 'desc' },
        take: 10, // Last 10 races
      }
    }
  })
  
  return (
    <div>
      <h1>{userData?.name || userData?.username}</h1>
      <div>
        <p>Races Played: {userData?.racesPlayed}</p>
        <p>Average WPM: {userData?.averageWpm.toFixed(1)}</p>
        <p>Best WPM: {userData?.bestWpm}</p>
      </div>
      
      <h2>Recent Races</h2>
      <ul>
        {userData?.races.map(race => (
          <li key={race.id}>
            {race.wpm} WPM - {race.accuracy}% accuracy
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### Viewing Other Users' Profiles

```typescript
// app/profile/[username]/page.tsx
import { PrismaClient } from '@prisma/client'
import { notFound } from 'next/navigation'

const prisma = new PrismaClient()

export default async function UserProfilePage({
  params
}: {
  params: { username: string }
}) {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
    include: {
      races: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      }
    }
  })
  
  if (!user) {
    notFound()
  }
  
  return (
    <div>
      <h1>{user.name || user.username}</h1>
      {/* Display public profile data */}
    </div>
  )
}
```

---

## Leaderboards

### Global Leaderboard

```typescript
// app/leaderboard/page.tsx
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function LeaderboardPage() {
  const topPlayers = await prisma.user.findMany({
    where: {
      racesPlayed: { gt: 0 } // Only users who have played
    },
    orderBy: {
      bestWpm: 'desc'
    },
    take: 100,
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      bestWpm: true,
      averageWpm: true,
      racesPlayed: true,
    }
  })
  
  return (
    <div>
      <h1>Leaderboard</h1>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Best WPM</th>
            <th>Avg WPM</th>
            <th>Races</th>
          </tr>
        </thead>
        <tbody>
          {topPlayers.map((player, index) => (
            <tr key={player.id}>
              <td>{index + 1}</td>
              <td>{player.username || player.name}</td>
              <td>{player.bestWpm}</td>
              <td>{player.averageWpm.toFixed(1)}</td>
              <td>{player.racesPlayed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Daily/Weekly Leaderboards

```typescript
// app/leaderboard/daily/page.tsx
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function DailyLeaderboardPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const topRacesToday = await prisma.race.findMany({
    where: {
      createdAt: { gte: today }
    },
    orderBy: {
      wpm: 'desc'
    },
    take: 100,
    include: {
      user: {
        select: {
          username: true,
          name: true,
          image: true,
        }
      }
    }
  })
  
  return (
    <div>
      <h1>Today's Top Races</h1>
      {/* Display races */}
    </div>
  )
}
```

---

## Realtime Multiplayer Preparation

### Database Schema Extension

Add multiplayer-specific models to `schema.prisma`:

```prisma
model MultiplayerRoom {
  id        String   @id @default(uuid())
  code      String   @unique // Join code (e.g., "ABCD1234")
  status    String   // "waiting" | "in_progress" | "finished"
  textId    String   // Text to type
  createdAt DateTime @default(now())
  startedAt DateTime?
  finishedAt DateTime?
  
  participants RoomParticipant[]
  
  @@index([code])
  @@index([status])
}

model RoomParticipant {
  id        String   @id @default(uuid())
  roomId    String
  userId    String
  position  Int      // Final position (1st, 2nd, etc.)
  wpm       Int?
  accuracy  Float?
  progress  Int      @default(0) // Characters typed
  finishedAt DateTime?
  
  room Room @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([roomId, userId])
  @@index([roomId])
  @@index([userId])
}

// Add to User model
model User {
  // ... existing fields
  roomParticipations RoomParticipant[]
}
```

### WebSocket Integration (Pusher/Ably)

```typescript
// lib/pusher.ts
import Pusher from 'pusher'
import PusherClient from 'pusher-js'

// Server-side
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

// Client-side
export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  }
)
```

### Creating a Multiplayer Room

```typescript
// app/actions/multiplayer.ts
'use server'

import { getUserId } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import { pusherServer } from '@/lib/pusher'

const prisma = new PrismaClient()

export async function createRoom() {
  const userId = await getUserId()
  
  if (!userId) {
    throw new Error('Must be logged in')
  }
  
  // Generate unique room code
  const code = generateRoomCode()
  
  const room = await prisma.multiplayerRoom.create({
    data: {
      code,
      status: 'waiting',
      textId: 'some-text-id', // Select random text
      participants: {
        create: {
          userId,
          position: 0,
        }
      }
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
            }
          }
        }
      }
    }
  })
  
  return room
}

export async function joinRoom(code: string) {
  const userId = await getUserId()
  
  if (!userId) {
    throw new Error('Must be logged in')
  }
  
  const room = await prisma.multiplayerRoom.findUnique({
    where: { code },
    include: { participants: true }
  })
  
  if (!room) {
    throw new Error('Room not found')
  }
  
  if (room.status !== 'waiting') {
    throw new Error('Room already started')
  }
  
  // Add participant
  await prisma.roomParticipant.create({
    data: {
      roomId: room.id,
      userId,
      position: 0,
    }
  })
  
  // Notify other participants
  await pusherServer.trigger(`room-${code}`, 'user-joined', {
    userId,
  })
  
  return room
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
```

### Realtime Progress Updates

```typescript
'use client'

import { useEffect, useState } from 'react'
import { pusherClient } from '@/lib/pusher'
import { useSession } from 'next-auth/react'

export default function MultiplayerRace({ roomCode }: { roomCode: string }) {
  const { data: session } = useSession()
  const [participants, setParticipants] = useState([])
  
  useEffect(() => {
    const channel = pusherClient.subscribe(`room-${roomCode}`)
    
    channel.bind('user-joined', (data: any) => {
      // Update participants list
    })
    
    channel.bind('progress-update', (data: any) => {
      // Update participant progress
      setParticipants(prev => 
        prev.map(p => 
          p.userId === data.userId 
            ? { ...p, progress: data.progress }
            : p
        )
      )
    })
    
    channel.bind('race-finished', (data: any) => {
      // Handle race completion
    })
    
    return () => {
      pusherClient.unsubscribe(`room-${roomCode}`)
    }
  }, [roomCode])
  
  const updateProgress = async (progress: number) => {
    // Send progress to server
    await fetch('/api/multiplayer/progress', {
      method: 'POST',
      body: JSON.stringify({
        roomCode,
        progress,
      })
    })
  }
  
  return (
    <div>
      {/* Multiplayer race UI */}
    </div>
  )
}
```

---

## Best Practices

### 1. Always Validate User ID
```typescript
const userId = await getUserId()
if (!userId) {
  throw new Error('Unauthorized')
}
```

### 2. Use Transactions for Related Updates
```typescript
await prisma.$transaction([
  prisma.race.create({ data: raceData }),
  prisma.user.update({ where: { id: userId }, data: statsData })
])
```

### 3. Revalidate Paths After Mutations
```typescript
import { revalidatePath } from 'next/cache'

await createRace(data)
revalidatePath('/profile')
revalidatePath('/leaderboard')
```

### 4. Handle Errors Gracefully
```typescript
try {
  await createRace(data)
} catch (error) {
  if (error instanceof Error) {
    return { error: error.message }
  }
  return { error: 'An unexpected error occurred' }
}
```

---

## Next Steps

1. Implement race creation with user ID attachment
2. Build user profile pages
3. Create leaderboard system
4. Set up WebSocket infrastructure (Pusher/Ably)
5. Implement multiplayer room system
6. Add realtime progress tracking
7. Implement matchmaking system
