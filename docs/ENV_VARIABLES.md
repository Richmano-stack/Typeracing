# Environment Variables Reference

## Required Variables

Copy these to your `.env` file and fill in the values.

### Database (PostgreSQL)
```bash
# Connection URL for the database
DATABASE_URL="postgresql://[USER]:[PASSWORD]@localhost:5432/[DB_NAME]?schema=public"

# Postgres Configuration (for Docker)
POSTGRES_USER="your-username-here"
POSTGRES_PASSWORD="your-password-here"
POSTGRES_DB="your-db-name-here"
```

### Better Auth
```bash
# Your application URL
BETTER_AUTH_URL="http://localhost:3000"

# Secret for authentication (generate with a random string)
BETTER_AUTH_SECRET="your-super-secret-key-here"
```

## Optional Variables (OAuth)

### GitHub
1. Create OAuth app at: https://github.com/settings/developers
2. Add credentials if using GitHub provider:
```bash
# GITHUB_ID="your-github-oauth-app-client-id"
# GITHUB_SECRET="your-github-oauth-app-client-secret"
```

## Security Notes

- **Never commit `.env` to git** - it's already in `.gitignore`
- Keep your `BETTER_AUTH_SECRET` secure and unique for each environment
- Use different secrets for development and production
- Rotate secrets regularly in production
