# Authentication Setup Guide

## Quick Start

Follow these steps to complete the authentication setup for your typeracing application.

## Step 1: Environment Variables

### 1.1 Add NEXTAUTH_SECRET

Generate a secure secret:

```bash
openssl rand -base64 32
```

### 1.2 Update your `.env` file

Add the following variables to your `.env` file (create it if it doesn't exist):

```bash
# Database (you should already have these)
DATABASE_URL="your-supabase-pooling-url"
DIRECT_URL="your-supabase-direct-url"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="paste-the-generated-secret-here"

# GitHub OAuth (optional - for GitHub login)
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

# Google OAuth (optional - for Google login)
GOOGLE_ID="your-google-client-id"
GOOGLE_SECRET="your-google-client-secret"
```

> **Note**: See [`ENV_VARIABLES.md`](./ENV_VARIABLES.md) for detailed instructions on obtaining OAuth credentials.

## Step 2: Database Migration

Run these commands to update your database schema:

```bash
# Push schema changes to Supabase Postgres
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

**Expected output:**
```
✔ Generated Prisma Client
```

## Step 3: Verify Installation

### 3.1 Check for TypeScript errors

```bash
pnpm build
# or
yarn build
```

All TypeScript errors related to Prisma should be resolved after running `npx prisma generate`.

### 3.2 Start development server

```bash
pnpm dev
# or
yarn dev
```

## Step 4: Test Authentication

### 4.1 Test Registration

1. Navigate to `http://localhost:3000/register`
2. Fill in:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
3. Click "Sign Up"
4. You should be redirected to `/profile` and logged in

### 4.2 Test Login

1. Navigate to `http://localhost:3000/login`
2. Enter the credentials from registration
3. Click "Sign In"
4. You should be redirected to `/profile`

### 4.3 Verify Database

Open Prisma Studio to verify the user was created:

```bash
npx prisma studio
```

Check the `User` table for your test user.

## Step 5: OAuth Setup (Optional)

### GitHub OAuth

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Typeracing (Dev)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy the **Client ID** and **Client Secret**
6. Add to `.env`:
   ```bash
   GITHUB_ID="your-client-id"
   GITHUB_SECRET="your-client-secret"
   ```
7. Restart dev server

### Google OAuth

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth client ID"
5. Configure consent screen if prompted
6. Select "Web application"
7. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
8. Copy the **Client ID** and **Client Secret**
9. Add to `.env`:
   ```bash
   GOOGLE_ID="your-client-id"
   GOOGLE_SECRET="your-client-secret"
   ```
10. Restart dev server

## Step 6: Clean Up Old Code

The following files are no longer needed and can be deleted:

```bash
# Old Supabase Auth files
rm app/actions.ts
rm app/lib/supabase/server.ts
rm app/components/context/AuthContext.tsx
```

**Note**: Make sure no other files are importing from these before deleting.

## Troubleshooting

### Error: "Module '@prisma/client' has no exported member 'PrismaClient'"

**Solution**: Run `npx prisma generate`

### Error: "Invalid `prisma.user.findUnique()` invocation"

**Solution**: Run `npx prisma db push` to sync your database schema

### Error: "NEXTAUTH_SECRET is not defined"

**Solution**: Add `NEXTAUTH_SECRET` to your `.env` file

### OAuth login redirects to error page

**Solution**: 
1. Verify OAuth credentials in `.env`
2. Check callback URLs match exactly
3. Ensure OAuth app is not in development mode (for production)

### Session not persisting

**Solution**:
1. Clear browser cookies
2. Verify `NEXTAUTH_URL` matches your current URL
3. Check browser console for errors

## Next Steps

Now that authentication is set up, you can:

1. **Protect routes** - See [`AUTH_INTEGRATION.md`](./AUTH_INTEGRATION.md#protecting-routes)
2. **Attach user IDs to races** - See [`AUTH_INTEGRATION.md`](./AUTH_INTEGRATION.md#attaching-user-id-to-races)
3. **Build user profiles** - See [`AUTH_INTEGRATION.md`](./AUTH_INTEGRATION.md#user-profiles)
4. **Create leaderboards** - See [`AUTH_INTEGRATION.md`](./AUTH_INTEGRATION.md#leaderboards)
5. **Prepare for multiplayer** - See [`AUTH_INTEGRATION.md`](./AUTH_INTEGRATION.md#realtime-multiplayer-preparation)

## Production Deployment

Before deploying to production:

1. **Generate new secrets**:
   ```bash
   openssl rand -base64 32  # New NEXTAUTH_SECRET
   ```

2. **Update environment variables**:
   - Set `NEXTAUTH_URL` to your production domain
   - Use production OAuth credentials
   - Use production database URL

3. **Security checklist**:
   - [ ] HTTPS enabled
   - [ ] Strong `NEXTAUTH_SECRET`
   - [ ] OAuth apps configured for production URLs
   - [ ] Rate limiting implemented
   - [ ] Error messages don't leak sensitive info

## Documentation

- [Architecture](./ARCHITECTURE.md) - How Auth.js, Prisma, and Supabase connect
- [Security](./SECURITY.md) - Best practices and security recommendations
- [Integration](./AUTH_INTEGRATION.md) - How to use auth in your app
- [Environment Variables](./ENV_VARIABLES.md) - Complete list of required variables

## Support

If you encounter issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Review the [documentation](#documentation)
3. Check Auth.js docs: https://next-auth.js.org/
4. Check Prisma docs: https://www.prisma.io/docs
