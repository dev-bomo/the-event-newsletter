# The Newsletter - Local Events Discovery

A web application that discovers local events based on your social media preferences and delivers them via weekly newsletters.

## Features

- 🔍 **AI-Powered Profile Discovery**: Find your social profiles by email
- 🎯 **Smart Preference Extraction**: Automatically extract interests from public profiles
- 📅 **Local Event Discovery**: AI finds relevant events in your area
- 📧 **Weekly Newsletters**: Personalized event recommendations delivered to your inbox

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express + TypeScript + Prisma
- **Database**: PostgreSQL (or SQLite for development)
- **AI**: Perplexity API (profile discovery, event discovery)
- **Email**: Resend

## Getting Started

See [SETUP.md](./SETUP.md) for detailed setup instructions.

### Quick Start

1. Install dependencies:
   ```bash
   npm run install:all
   ```

2. Set up backend environment:
   ```bash
   cd backend
   # Create .env file with required variables (see SETUP.md)
   npm run prisma:generate
   npm run prisma:migrate
   ```

3. Start development servers:
   ```bash
   npm run dev
   ```

   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000

## Environment Variables

Required environment variables (see `SETUP.md` for details):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT tokens
- `PERPLEXITY_API_KEY` - Perplexity AI API key
- `RESEND_API_KEY` - Resend email API key
- `FROM_EMAIL` - Email address for sending newsletters

## Project Structure

```
├── backend/          # Express API server
├── frontend/         # React application
└── TECHNICAL_ANALYSIS.md  # Technical documentation
```

## License

MIT

