# Railway Quick Start Guide

## TL;DR - Quick Deployment Steps

### 1. Create Railway Project
- Go to [railway.app](https://railway.app)
- New Project → Deploy from GitHub repo
- Select your repository

### 2. Add PostgreSQL Database
- In project: New → Database → Add PostgreSQL
- Railway auto-sets `DATABASE_URL`

### 3. Deploy Backend
- New → GitHub Repo → Select same repo
- **Settings** → **Root Directory**: Set to `backend`
- **Variables** → Add:
  ```
  JWT_SECRET=<generate-random-string>
  PERPLEXITY_API_KEY=<your-key>
  RESEND_API_KEY=<your-key>
  FROM_EMAIL=<your-email>
  NODE_ENV=production
  ```
- Railway will auto-detect build/start commands from `railway.json`

### 4. Deploy Frontend
- New → GitHub Repo → Select same repo
- **Settings** → **Root Directory**: Set to `frontend`
- **Variables** → Add:
  ```
  VITE_API_URL=https://<your-backend-service>.railway.app/api
  ```
- Railway will auto-detect build/start commands

### 5. Link Services
- Go to Backend service → Variables
- Add `FRONTEND_URL=https://<your-frontend-service>.railway.app`
- Add `ALLOWED_ORIGINS=https://<your-frontend-service>.railway.app`

### 5b. Watch Paths (optional but recommended)
So only the service that changed redeploys when you push:
- **Backend service** → Settings → **Watch Paths** → add: `backend/**`
- **Frontend service** → Settings → **Watch Paths** → add: `frontend/**`

Then pushes that only touch `frontend/` redeploy the frontend; pushes that only touch `backend/` redeploy the backend.

### 6. Database Access
- Go to PostgreSQL service → Query tab (for web SQL editor)
- Or use `DATABASE_URL` with any PostgreSQL client

### 7. Backups
- Railway automatically backs up PostgreSQL daily
- Backups kept for 7 days (effectively weekly retention)
- Access via PostgreSQL service → Backups tab

## Important Notes

- **Root Directory**: Must be set for each service (`backend` and `frontend`)
- **Watch Paths**: Set `backend/**` and `frontend/**` so only the changed service redeploys
- **Migrations**: Run automatically on backend deploy via `railway:start` script
- **CORS**: Make sure `ALLOWED_ORIGINS` includes your frontend URL
- **Environment Variables**: Set in Railway dashboard, not in `.env` files

## Troubleshooting

**Backend won't start?**
- Verify `DATABASE_URL` is set (auto-set by Railway when you add PostgreSQL)

**Frontend can't connect to backend?**
- Check `VITE_API_URL` points to correct backend URL
- Verify backend `ALLOWED_ORIGINS` includes frontend URL

**Database connection errors?**
- Ensure PostgreSQL service is running and linked to backend

## Next Steps

1. Test the deployment
2. Set up custom domain (optional)
3. Configure monitoring
4. Set up alerts
