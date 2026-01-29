# Railway Deployment Guide

This guide will help you deploy both the frontend and backend to Railway.

## Prerequisites

- Railway account (you already have this)
- GitHub repository with your code
- All environment variables ready

## Deployment Steps

### 1. Create a New Project in Railway

1. Go to [Railway](https://railway.app) and create a new project
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account and select the repository

### 2. Add PostgreSQL Database

1. In your Railway project, click "New" → "Database" → "Add PostgreSQL"
2. Railway will automatically create a PostgreSQL database
3. Note the `DATABASE_URL` that Railway provides (it will be set automatically)

### 3. Deploy Backend Service

1. In your Railway project, click "New" → "GitHub Repo"
2. Select your repository
3. Railway will detect it's a monorepo - you'll need to configure it:
   - **Root Directory**: `/backend`
   - **Build Command**: `npm install && npm run build && npm run prisma:generate`
   - **Start Command**: `npm run railway:start`
   - **Watch Paths**: `backend/**`

4. Set environment variables in Railway dashboard:
   - `DATABASE_URL` - Automatically set by Railway (from PostgreSQL service)
   - `DATABASE_PROVIDER=postgresql` - Set this to use PostgreSQL
   - `JWT_SECRET` - Your JWT secret (generate a strong random string)
   - `PERPLEXITY_API_KEY` - Your Perplexity API key
   - `RESEND_API_KEY` - Your Resend API key
   - `FROM_EMAIL` - Your sender email address
   - `FRONTEND_URL` - Your frontend URL (set after deploying frontend)
   - `ALLOWED_ORIGINS` - Comma-separated list of allowed origins (e.g., `https://yourdomain.com,https://www.yourdomain.com`)
   - `PORT` - Railway sets this automatically, but you can use `3000` as default
   - `NODE_ENV=production`

5. Railway will automatically:
   - Run `npm install`
   - Run `npm run build`
   - Run `prisma generate`
   - Run migrations (`prisma migrate deploy`)
   - Start the server

### 4. Deploy Frontend Service

1. In the same Railway project, click "New" → "GitHub Repo" again
2. Select the same repository
3. Configure it:
   - **Root Directory**: `/frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve -s dist -l $PORT`
   - **Watch Paths**: `frontend/**`

4. Set environment variables:
   - `VITE_API_URL` - Your backend URL (e.g., `https://your-backend.railway.app/api`)
   - `PORT` - Railway sets this automatically

5. Railway will automatically build and serve your frontend

### 5. Configure Database Backups

Railway provides automatic daily backups for PostgreSQL databases. To configure weekly backups:

1. Go to your PostgreSQL service in Railway
2. Click on "Settings"
3. Under "Backups", you can see backup retention settings
4. Railway keeps backups for 7 days by default
5. For weekly backups, you can:
   - Use Railway's daily backups (they're kept for a week)
   - Or set up a custom backup script (see below)

### 6. Access Your Database

Railway provides multiple ways to access your PostgreSQL database:

**Option 1: Railway Dashboard**
1. Go to your PostgreSQL service
2. Click "Query" tab
3. Run SQL queries directly in the browser

**Option 2: Railway CLI**
```bash
railway connect postgres
```

**Option 3: External Tools**
- Use the `DATABASE_URL` connection string with any PostgreSQL client
- Tools like pgAdmin, DBeaver, or TablePlus work great
- The connection string format: `postgresql://user:password@host:port/database`

### 7. Update Frontend URL in Backend

After deploying the frontend, update the backend's `FRONTEND_URL` environment variable:
1. Go to your backend service in Railway
2. Click "Variables"
3. Update `FRONTEND_URL` to your frontend Railway URL
4. Update `ALLOWED_ORIGINS` to include your frontend URL

### 8. Custom Domain (Optional)

1. In Railway, go to your service
2. Click "Settings" → "Networking"
3. Add your custom domain
4. Railway will provide DNS records to add to your domain registrar

## Environment Variables Summary

### Backend
```
DATABASE_URL=<auto-set-by-railway>
DATABASE_PROVIDER=postgresql
JWT_SECRET=<your-secret>
PERPLEXITY_API_KEY=<your-key>
RESEND_API_KEY=<your-key>
FROM_EMAIL=<your-email>
FRONTEND_URL=<your-frontend-url>
ALLOWED_ORIGINS=<comma-separated-origins>
PORT=3000
NODE_ENV=production
```

### Frontend
```
VITE_API_URL=<your-backend-url>/api
PORT=<auto-set-by-railway>
```

## Running Migrations

Migrations run automatically on deploy via the `railway:start` script. If you need to run migrations manually:

```bash
railway run --service backend npm run prisma:migrate:deploy
```

## Troubleshooting

### Database Connection Issues
- Ensure `DATABASE_PROVIDER=postgresql` is set
- Check that `DATABASE_URL` is correctly set by Railway
- Verify the database service is running

### CORS Issues
- Make sure `ALLOWED_ORIGINS` includes your frontend URL
- Check that `FRONTEND_URL` matches your actual frontend domain

### Build Failures
- Check Railway logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

## Weekly Backup Script (Optional)

If you want custom weekly backups, you can add a cron job:

1. Create a backup script in your backend
2. Use Railway's cron service or a scheduled task
3. Store backups in Railway's volume or external storage (S3, etc.)

Railway's built-in daily backups should be sufficient for most use cases.

## Monitoring

Railway provides:
- Real-time logs
- Metrics and monitoring
- Health checks (via `/health` endpoint)
- Automatic restarts on failure

## Cost Estimation

Railway pricing:
- **Free tier**: $5 credit/month
- **Hobby**: $20/month (includes database)
- **Pro**: $100/month (more resources)

For a small app with PostgreSQL, the Hobby plan is usually sufficient.

## Next Steps

1. Deploy backend and frontend services
2. Set up environment variables
3. Test the deployment
4. Configure custom domain (optional)
5. Set up monitoring and alerts
