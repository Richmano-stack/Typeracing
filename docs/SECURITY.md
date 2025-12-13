# Security Best Practices

## Password Security

### Hashing Strategy
- **Algorithm**: bcryptjs
- **Salt Rounds**: 10 (2^10 = 1,024 iterations)
- **Why bcrypt**: Designed to be slow, resistant to brute-force attacks
- **Auto-salting**: Each password gets a unique salt

```typescript
// Hashing (registration)
const hashedPassword = await bcrypt.hash(password, 10)

// Verification (login)
const isValid = await bcrypt.compare(plainPassword, hashedPassword)
```

### Password Requirements
- **Minimum length**: 8 characters
- **Recommended**: Add complexity requirements (uppercase, numbers, symbols)
- **Future**: Implement password strength meter on frontend

## JWT Security

### Token Configuration
```typescript
session: {
  strategy: "jwt",
  maxAge: 30 * 24 * 60 * 60, // 30 days
}
```

### Best Practices
- ✅ **Secret Key**: Use strong `NEXTAUTH_SECRET` (32+ characters)
- ✅ **HTTP-Only Cookies**: Prevents JavaScript access (XSS protection)
- ✅ **Secure Flag**: HTTPS-only in production
- ✅ **SameSite**: CSRF protection
- ✅ **Expiration**: Tokens auto-expire after 30 days

### Generating Secure Secret
```bash
# Generate a secure random secret
openssl rand -base64 32
```

## Session Storage

### JWT vs Database Sessions

#### JWT (Current Implementation)
**Pros:**
- No database queries per request
- Horizontally scalable
- Faster performance

**Cons:**
- Cannot revoke individual sessions
- Larger cookie size
- Token valid until expiration

#### Database Sessions
**Pros:**
- Can revoke sessions immediately
- Smaller cookie size
- Better audit trail

**Cons:**
- Database query on every request
- Harder to scale

### When to Switch to Database Sessions
- Need to revoke sessions (logout all devices)
- Compliance requirements (audit logs)
- Sensitive applications (banking, healthcare)

## CSRF Protection

### Built-in Protection
Auth.js includes CSRF protection automatically:
- CSRF tokens in forms
- SameSite cookie attribute
- Origin verification

### Additional Measures
```typescript
// In production, verify origin
callbacks: {
  async redirect({ url, baseUrl }) {
    if (new URL(url).origin === baseUrl) return url
    return baseUrl
  }
}
```

## Credential Validation

### Email Validation
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  throw new Error('Invalid email format')
}
```

### Password Validation
```typescript
// Current: Minimum 8 characters
if (password.length < 8) {
  throw new Error('Password must be at least 8 characters')
}

// Recommended: Add complexity requirements
const hasUpperCase = /[A-Z]/.test(password)
const hasLowerCase = /[a-z]/.test(password)
const hasNumber = /[0-9]/.test(password)
const hasSpecialChar = /[!@#$%^&*]/.test(password)

if (!hasUpperCase || !hasLowerCase || !hasNumber) {
  throw new Error('Password must contain uppercase, lowercase, and numbers')
}
```

### Username Validation
```typescript
// Prevent SQL injection, XSS
const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
if (!usernameRegex.test(username)) {
  throw new Error('Username must be 3-20 characters (letters, numbers, _, -)')
}
```

## Rate Limiting

### Why Rate Limiting?
- Prevent brute-force attacks
- Prevent credential stuffing
- Reduce server load from bots

### Implementation Options

#### Option 1: Upstash Rate Limit (Recommended)
```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 m"), // 5 requests per minute
})

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1"
  const { success } = await ratelimit.limit(ip)
  
  if (!success) {
    return new Response("Too many requests", { status: 429 })
  }
  
  // Continue with login logic...
}
```

#### Option 2: Next.js Middleware
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const rateLimit = new Map<string, { count: number; resetTime: number }>()

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/auth')) {
    const ip = request.ip ?? '127.0.0.1'
    const now = Date.now()
    const windowMs = 60 * 1000 // 1 minute
    const maxRequests = 5
    
    const record = rateLimit.get(ip)
    
    if (!record || now > record.resetTime) {
      rateLimit.set(ip, { count: 1, resetTime: now + windowMs })
    } else if (record.count >= maxRequests) {
      return new NextResponse('Too many requests', { status: 429 })
    } else {
      record.count++
    }
  }
  
  return NextResponse.next()
}
```

### Recommended Limits
- **Login**: 5 attempts per minute per IP
- **Registration**: 3 attempts per hour per IP
- **Password Reset**: 3 attempts per hour per email

## OAuth Security

### Provider Configuration
```typescript
GithubProvider({
  clientId: process.env.GITHUB_ID,
  clientSecret: process.env.GITHUB_SECRET,
  // Only request necessary scopes
  authorization: {
    params: {
      scope: 'read:user user:email'
    }
  }
})
```

### Best Practices
- ✅ Only request necessary scopes
- ✅ Verify email from OAuth provider
- ✅ Store tokens securely (database, encrypted)
- ✅ Refresh tokens before expiration
- ✅ Validate OAuth state parameter (CSRF)

## Environment Variables Security

### Critical Rules
1. **Never commit `.env` to git** (already in `.gitignore`)
2. **Use different secrets for dev/prod**
3. **Rotate secrets regularly** (every 90 days)
4. **Use environment-specific files**:
   - `.env.local` (local development)
   - `.env.production` (production)

### Secure Storage
- **Development**: `.env.local` (gitignored)
- **Production**: Use platform environment variables
  - Vercel: Project Settings → Environment Variables
  - Railway: Project → Variables

## SQL Injection Protection

### Prisma's Built-in Protection
Prisma uses parameterized queries automatically:

```typescript
// ✅ SAFE - Prisma parameterizes automatically
const user = await prisma.user.findUnique({
  where: { email: userInput }
})

// ❌ NEVER DO THIS - Raw SQL with user input
await prisma.$executeRaw`SELECT * FROM User WHERE email = ${userInput}`

// ✅ SAFE - Use Prisma.sql for raw queries
import { Prisma } from '@prisma/client'
await prisma.$executeRaw(
  Prisma.sql`SELECT * FROM User WHERE email = ${userInput}`
)
```

## XSS Protection

### React's Built-in Protection
React escapes content automatically:

```tsx
// ✅ SAFE - React escapes automatically
<div>{user.name}</div>

// ❌ DANGEROUS - Bypasses escaping
<div dangerouslySetInnerHTML={{ __html: user.name }} />
```

### Additional Measures
- Validate and sanitize user input
- Use Content Security Policy (CSP) headers
- Avoid `eval()` and `Function()` constructors

## HTTPS Enforcement

### Production Configuration
```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          }
        ]
      }
    ]
  }
}
```

## Security Headers

### Recommended Headers
```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]
```

## Monitoring & Logging

### What to Log
- ✅ Failed login attempts
- ✅ Account creation
- ✅ Password changes
- ✅ OAuth connections
- ❌ Passwords (never log)
- ❌ Tokens (never log)

### Example Logging
```typescript
events: {
  async signIn({ user, account }) {
    console.log(`[AUTH] User ${user.email} signed in via ${account?.provider}`)
  },
  async signOut({ token }) {
    console.log(`[AUTH] User ${token.email} signed out`)
  }
}
```

## Security Checklist

### Before Production
- [ ] `NEXTAUTH_SECRET` is strong and unique
- [ ] All environment variables are set
- [ ] HTTPS is enforced
- [ ] Rate limiting is implemented
- [ ] Security headers are configured
- [ ] Password requirements are enforced
- [ ] OAuth scopes are minimal
- [ ] Logging is implemented
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies are up to date (`npm audit`)

### Regular Maintenance
- [ ] Rotate secrets every 90 days
- [ ] Review and revoke unused OAuth apps
- [ ] Monitor failed login attempts
- [ ] Update dependencies monthly
- [ ] Review access logs weekly
- [ ] Test authentication flows quarterly

## Common Vulnerabilities to Avoid

### 1. Timing Attacks
```typescript
// ❌ BAD - Reveals if email exists
if (!user) return { error: 'Email not found' }
if (!validPassword) return { error: 'Wrong password' }

// ✅ GOOD - Generic error message
if (!user || !validPassword) {
  return { error: 'Invalid credentials' }
}
```

### 2. User Enumeration
```typescript
// ❌ BAD - Reveals if email is registered
if (existingUser) {
  return { error: 'Email already registered' }
}

// ✅ BETTER - Generic message
return { error: 'Registration failed' }

// ✅ BEST - Send email to existing users
if (existingUser) {
  await sendEmail(email, 'Account already exists')
}
return { success: 'Check your email' }
```

### 3. Session Fixation
Auth.js handles this automatically by regenerating session IDs after login.

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Auth.js Security](https://next-auth.js.org/configuration/options#security)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Prisma Security](https://www.prisma.io/docs/guides/database/advanced-database-tasks/sql-injection)
