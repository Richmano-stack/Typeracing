# Database & Authentication Setup Guide

## 📝 Steps to Complete Setup

### 1. Update Environment Variables

Create a `.env` file in the root directory with the following content:

```env
# Database URLs (Supabase) - UPDATE THE PASSWORD
DATABASE_URL="postgresql://postgres.fjauxmwwhlpkhzixrnfc:[YOUR-PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

DIRECT_URL="postgresql://postgres.fjauxmwwhlpkhzixrnfc:[YOUR-PASSWORD]@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

# NextAuth Configuration
# Generate a secret with: openssl rand -base64 32
NEXTAUTH_SECRET="generate-a-random-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

**To generate NEXTAUTH_SECRET:**
```bash
# On Windows (PowerShell):
$bytes = New-Object byte[] 32
(New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
[Convert]::ToBase64String($bytes)

# Or use an online generator: https://generate-secret.vercel.app/32
```

### 2. Run Prisma Migrations

After updating the `.env` file with your actual password:

```bash
# Generate Prisma Client
npx prisma generate

# Push the schema to your database (for initial setup)
npx prisma db push

# Or create a migration (recommended for production)
npx prisma migrate dev --name init
```

### 3. Test Database Connection

```bash
# Open Prisma Studio to view your database
npx prisma studio
```

---

## 🗃️ Database Schema Overview

### NextAuth Tables
- **User** - Stores user accounts
- **Account** - OAuth account connections
- **Session** - Active user sessions
- **VerificationToken** - Email verification tokens

### Typeracing Tables
- **Race** - Stores all race results
  - Links to User
  - Tracks WPM, accuracy, errors
  - Supports practice/race/multiplayer modes

---

## 🔐 Authentication Flow

1. User registers via `/register`
2. Password is hashed with bcrypt
3. User logs in via `/login`
4. NextAuth creates JWT session
5. Protected routes check session

---

## 📦 Installed Packages

✅ `next-auth` - Authentication
✅ `@auth/prisma-adapter` - Prisma integration
✅ `@prisma/client` - Database client
✅ `bcryptjs` - Password hashing
✅ `@types/bcryptjs` - TypeScript types

---

## 🚀 Next Steps

1. **Update `.env`** with your actual database password
2. **Generate secret** for NEXTAUTH_SECRET
3. **Run migrations**: `npx prisma db push`
4. **Test auth** by visiting `/register` and `/login`

---

## 🔧 Files Created

- `prisma/schema.prisma` - Database schema
- `app/api/auth/[...nextauth]/route.ts` - NextAuth handler
- `app/lib/prisma.ts` - Prisma client singleton

---

## ⚙️ Configuration Details

### Transaction Pooler (Port 6543)
- Used for all Prisma Client queries
- Efficient for serverless
- Handles high concurrency

### Session Pooler (Port 5432)
- Used for migrations only
- Full PostgreSQL features
- Required for schema changes

---

## 🐛 Troubleshooting

**Error: "Can't reach database server"**
- Check if password is correct in `.env`
- Ensure database URLs are properly formatted

**Error: "Environment variable not found"**
- Make sure `.env` file is in root directory
- Restart your dev server after changing `.env`

**Migration issues:**
- Use `DIRECT_URL` (port 5432) for migrations
- Use `DATABASE_URL` (port 6543) for queries
