# Quick Fix for 500 Error

## Steps to Fix:

1. **Create `.env` file** in the `backend/` directory with this content:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=dev-secret-key-change-in-production-min-32-chars

DATABASE_URL="file:./prisma/dev.db"

PERPLEXITY_API_KEY=your-perplexity-api-key-here
RESEND_API_KEY=your-resend-api-key-here
FROM_EMAIL=noreply@example.com

FRONTEND_URL=http://localhost:5173
```

2. **Generate Prisma Client**:
```bash
cd backend
npm run prisma:generate
```

3. **Restart your dev server**:
```bash
# Stop the current server (Ctrl+C)
npm run dev
```

## What was wrong:

- Prisma client wasn't generated, causing import errors
- Missing .env file meant JWT_SECRET and DATABASE_URL weren't set
- Errors weren't being logged properly (now fixed)

After these steps, registration should work!

