# Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (or use SQLite for development)
- Perplexity API key (get one at https://www.perplexity.ai/)
- Resend API key for email (get one at https://resend.com/)

## Installation Steps

### 1. Install Dependencies

```bash
npm run install:all
```

This will install dependencies for both the root workspace and the backend/frontend packages.

### 2. Set Up Backend Environment

Create a `.env` file in the `backend/` directory:

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:

```env
# Server
PORT=3000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database
# Local dev (SQLite): use file:./dev.db and run npm run dev
DATABASE_URL="file:./dev.db"
# Production / Railway uses PostgreSQL (set in Railway dashboard)

# AI Services
PERPLEXITY_API_KEY=your-perplexity-api-key

# Email Service
RESEND_API_KEY=your-resend-api-key
FROM_EMAIL=this-week@event-newsletter.com

# OAuth Services
# YouTube OAuth (Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
YOUTUBE_REDIRECT_URI=http://localhost:3000/api/auth/youtube/callback

# Encryption (for OAuth tokens)
# Generate a 64-character hex string: openssl rand -hex 32
ENCRYPTION_KEY=your-64-character-hex-encryption-key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 3. Set Up Database (local)

For **local development** we use SQLite. From the repo root:

```bash
cd backend
# Ensure .env has DATABASE_URL=file:./dev.db
npm run dev
```

`npm run dev` will generate the Prisma client for SQLite, run `prisma db push` to create/update tables in `dev.db`, then start the server. No separate migrate step needed for SQLite locally.

(Railway/production uses PostgreSQL and `prisma migrate deploy` on deploy.)

### 4. Start Development Servers

From the root directory:

```bash
npm run dev
```

This will start:

- Backend API server on http://localhost:3000
- Frontend React app on http://localhost:5173

Or start them separately:

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

## YouTube OAuth Setup

To enable YouTube account connection:

1. **Create Google Cloud Project**:

   - Go to https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable YouTube Data API v3**:

   - Navigate to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**:

   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:3000/api/auth/youtube/callback` (for development)
   - Add production redirect URI when deploying
   - Copy the Client ID and Client Secret

4. **Add to .env**:

   ```env
   GOOGLE_CLIENT_ID=your-client-id-here
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   YOUTUBE_REDIRECT_URI=http://localhost:3000/api/auth/youtube/callback
   ```

5. **Generate Encryption Key**:
   ```bash
   openssl rand -hex 32
   ```
   Add to .env:
   ```env
   ENCRYPTION_KEY=your-generated-64-character-hex-string
   ```

## Usage

1. **Register/Login**: Create an account or sign in
2. **Connect Social Accounts**: Connect YouTube (and other platforms) to automatically extract preferences
3. **Discover Profiles**: Enter your email to find social media profiles (alternative method)
4. **Select Profiles**: Choose which profiles belong to you
5. **Crawl Profiles**: Extract preferences from your public profiles
6. **Set Preferences**: Review and edit your preferences, set your city
7. **Generate Newsletter**: Create a personalized newsletter with local events
8. **Send Newsletter**: Send the newsletter to your email

## Weekly Newsletter Automation

The system includes a cron job that automatically:

- Generates newsletters for all users every Monday at 9 AM
- Sends them via email

The cron job is set up in `backend/src/services/cron.ts`.

## Development Notes

### Database

- Use PostgreSQL for production
- SQLite can be used for development (change DATABASE_URL in .env)
- Access Prisma Studio: `cd backend && npm run prisma:studio`

### API Endpoints

**Authentication:**

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login

**Profiles:**

- `POST /api/profiles/discover` - Discover profiles by email
- `POST /api/profiles/select` - Select profiles
- `POST /api/profiles/crawl` - Crawl selected profiles

**YouTube OAuth:**

- `GET /api/auth/youtube/connect` - Get YouTube OAuth URL
- `GET /api/auth/youtube/callback` - OAuth callback (public)
- `GET /api/auth/youtube/status` - Check connection status
- `POST /api/auth/youtube/sync` - Manually sync YouTube preferences
- `DELETE /api/auth/youtube/disconnect` - Disconnect YouTube account

**Preferences:**

- `GET /api/preferences` - Get user preferences
- `PUT /api/preferences` - Update preferences
- `PUT /api/preferences/city` - Update city

**Events:**

- `POST /api/events/discover` - Discover events for user

**Newsletters:**

- `POST /api/newsletters/generate` - Generate newsletter
- `POST /api/newsletters/:id/send` - Send newsletter

### Troubleshooting

**Database connection issues:**

- Make sure PostgreSQL is running
- Check DATABASE_URL in .env
- Try using SQLite for development: `DATABASE_URL="file:./dev.db"`

**AI API errors:**

- Verify PERPLEXITY_API_KEY is set correctly
- Check API quota/limits

**Email not sending:**

- Verify RESEND_API_KEY is set
- Check FROM_EMAIL domain is verified in Resend
- For development, emails may not send (check console logs)

**Profile discovery not working:**

- AI may not find profiles if email isn't publicly associated
- Users can manually add profile URLs if needed

## Production Deployment

### Recommended Hosting

1. **Frontend**: Deploy to Vercel

   - Connect GitHub repo
   - Set build command: `cd frontend && npm run build`
   - Set output directory: `frontend/dist`

2. **Backend**: Deploy to Railway or Render

   - Connect GitHub repo
   - Set build command: `cd backend && npm run build`
   - Set start command: `cd backend && npm start`
   - Add PostgreSQL database
   - Set environment variables

3. **Database**: Use PostgreSQL from hosting provider

### Environment Variables for Production

Update these in your hosting platform:

- `NODE_ENV=production`
- `DATABASE_URL` (from hosting provider)
- `JWT_SECRET` (strong random string)
- `FRONTEND_URL` (your frontend domain)
- `PERPLEXITY_API_KEY`
- `RESEND_API_KEY`
- `FROM_EMAIL` (verified domain in Resend)
- `GOOGLE_CLIENT_ID` (YouTube OAuth)
- `GOOGLE_CLIENT_SECRET` (YouTube OAuth)
- `YOUTUBE_REDIRECT_URI` (your production callback URL)
- `ENCRYPTION_KEY` (64-character hex string for token encryption)

## License

MIT
