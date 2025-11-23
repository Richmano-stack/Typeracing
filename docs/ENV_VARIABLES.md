# Environment Variables Reference

## Required Variables

Copy these to your `.env` file and fill in the values.

### Database (Supabase Postgres)
```bash
# Connection pooling URL (for Prisma queries)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection URL (for migrations)
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

### Auth.js (NextAuth)
```bash
# Your application URL
NEXTAUTH_URL="http://localhost:3000"

# Secret for JWT signing (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-super-secret-key-here"
```

### OAuth Providers

#### GitHub
1. Create OAuth app at: https://github.com/settings/developers
2. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
3. Add credentials:
```bash
GITHUB_ID="your-github-oauth-app-client-id"
GITHUB_SECRET="your-github-oauth-app-client-secret"
```

#### Google
1. Create credentials at: https://console.cloud.google.com/apis/credentials
2. Set Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
3. Add credentials:
```bash
GOOGLE_ID="your-google-oauth-client-id"
GOOGLE_SECRET="your-google-oauth-client-secret"
```

## Optional Variables

```bash
# Base URL for email verification links
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

## Security Notes

- **Never commit `.env` to git** - it's already in `.gitignore`
- Generate `NEXTAUTH_SECRET` with: `openssl rand -base64 32`
- Use different secrets for development and production
- Rotate secrets regularly in production
