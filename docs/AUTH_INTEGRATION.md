# Authentication Integration Guide

This guide explains how to integrate the authentication system with your typeracing features.

## Table of Contents
1. [Protecting Routes](#protecting-routes)
2. [User Profiles](#user-profiles)

---

## Protecting Routes

### Server Components (Recommended)

Use `getServerSession` to protect entire pages:

```typescript
// app/profile/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
      redirect("/login");
  }
  
  return (
    <div>
      <h1>Welcome, {session.user?.name}!</h1>
      <p>Email: {session.user?.email}</p>
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

---

## User Profiles

(Database integration pending)
