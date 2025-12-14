# Setup Guide

## 📝 Steps to Complete Setup

### 1. Update Environment Variables

Create a `.env` file in the root directory with the following content:

```env
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

### 2. Test Auth

Visit `/login` to test the authentication UI. Note that registration is currently disabled as the database has been removed.

---

## 📦 Installed Packages

✅ `next-auth` - Authentication
✅ `bcryptjs` - Password hashing
✅ `@types/bcryptjs` - TypeScript types

---

## 🚀 Next Steps

1. **Update `.env`**
2. **Generate secret** for NEXTAUTH_SECRET
3. **Implement new database solution**

---

## 🔧 Files Created

- `app/api/auth/[...nextauth]/route.ts` - NextAuth handler
