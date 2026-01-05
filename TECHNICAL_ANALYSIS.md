# Local Events Newsletter - Technical Analysis

## Problem Statement
A web application that aggregates local events (concerts, theater, gatherings) based on user preferences derived from social media accounts (Facebook, Instagram, YouTube, Spotify) and delivers them via weekly newsletters.

---

## Technical Needs & Requirements

### 1. **User Management & Authentication**
- User registration/login system (email-based)
- Email-based profile discovery:
  - User enters email address
  - System searches for public profiles associated with email
  - User selects which profiles belong to them
  - No OAuth required - uses public profile data only
- Session management
- User profile storage (preferences, linked profile URLs)

### 2. **Profile Discovery & Preference Extraction**
- **Profile Discovery (AI-Powered)**
  - User enters email address
  - AI searches for public profiles on:
    - Facebook (public profiles)
    - Instagram (public accounts)
    - YouTube (public channels)
    - Spotify (public playlists/profiles)
    - Twitter/X (public profiles)
    - LinkedIn (public profiles)
  - Return list of potential profiles with:
    - Platform name
    - Profile URL
    - Profile name/username
    - Profile picture (if available)
  - User selects which profiles belong to them
  
- **Public Profile Crawling**
  - For selected profiles, crawl public data:
    - Facebook: Public liked pages, public events, public groups
    - Instagram: Public posts, public followed accounts (if visible)
    - YouTube: Public channel subscriptions, public playlists
    - Spotify: Public playlists, public followed artists
  - Extract interests, genres, categories from public content
  - Use web scraping or AI-powered content analysis

- **Preference Management**
  - Manual preference selection/editing interface
  - Location-based filtering (city/region)
  - Interest categorization (music, theater, sports, etc.)
  - User can add/remove preferences manually

### 3. **Event Aggregation**
- **Option A: Traditional API Approach**
  - Data sources to consider:
    - Facebook Events API
    - Eventbrite API
    - Ticketmaster API
    - Local event websites (web scraping or RSS feeds)
    - Google Events/Calendar
    - Meetup API
  - Event data structure:
    - Title, description, date/time
    - Location (address, coordinates)
    - Category/tags
    - Source URL
    - Image/thumbnail

- **Option B: AI-Powered Approach (RECOMMENDED)**
  - Use AI models with web search capabilities to find events
  - AI services to consider:
    - OpenAI GPT-4 with web browsing
    - Anthropic Claude (with web access)
    - Perplexity API (specialized for web search)
    - Google Gemini (with web search)
  - Benefits:
    - No need to manage multiple API integrations
    - AI can search across all sources simultaneously
    - Better understanding of context and preferences
    - Natural language querying
    - Lower maintenance overhead
  - Event data structure (same as Option A)

### 4. **Matching Algorithm**
- Match events to user preferences
- Location-based filtering (radius from user location)
- Time-based filtering (upcoming events only)
- Relevance scoring based on:
  - Interest overlap
  - Social media activity patterns
  - Historical attendance (if tracked)

### 5. **Newsletter System**
- Weekly email generation
- Email template design
- Email delivery service integration
- Unsubscribe functionality
- Email preference management

### 6. **Data Storage**
- User accounts and profiles
- Social account tokens (encrypted)
- User preferences
- Cached events data
- Newsletter history

### 7. **Background Jobs**
- Periodic event fetching (daily/hourly)
- Weekly newsletter generation and sending
- Social media data refresh (periodic token refresh)

### 8. **API & Infrastructure**
- RESTful API for frontend
- Rate limiting
- Error handling and logging
- CORS configuration
- Environment variable management

---

## Recommended Solution Architecture

### **Tech Stack**

#### Frontend
- **React** (TypeScript) - User interface
- **React Router** - Navigation
- **Tailwind CSS** - Styling (minimal setup, great defaults)
- **React Query / SWR** - Data fetching and caching
- **Zustand / Context API** - State management

#### Backend
- **Express.js** (TypeScript) - API server
- **Prisma** - ORM (works with multiple databases, excellent DX)
- **PostgreSQL** - Primary database (or SQLite for development)
- **Redis** (optional) - Caching and session storage
- **BullMQ** or **node-cron** - Background job scheduling

#### Authentication
- **Passport.js** - OAuth strategy management
- **JWT** - Session tokens
- **bcrypt** - Password hashing

#### Email
- **Resend** or **SendGrid** or **Mailgun** - Transactional email service
- **React Email** or **MJML** - Email template generation

#### AI Services (for Profile Discovery & Event Discovery)
- **Profile Discovery**: Use AI to search for profiles by email
- **Public Profile Analysis**: Use AI to extract preferences from public profile pages
- **Event Discovery**: Use AI to find local events (see Event Aggregation section)

#### Web Scraping Tools (for Public Profiles)
- **Puppeteer** or **Playwright** - Browser automation for profile crawling
- **Cheerio** - HTML parsing for static content
- **Bright Data** or **ScraperAPI** (optional) - Proxy/rotating IP services for scraping
- **Rate limiting** - Respect robots.txt and implement delays

#### External APIs (Optional - for public data only)
- YouTube Data API v3 (public data, no auth needed for some endpoints)
- Spotify Web API (public playlists, no auth needed)
- Note: Facebook/Instagram require auth for most data, so scraping public pages is alternative

#### AI Services (for Event Discovery)
- **Perplexity API** (Recommended) - Specialized for web search, great for finding events
- **OpenAI GPT-4** - With function calling or web browsing capabilities
- **Anthropic Claude** - With web access (Claude 3.5 Sonnet)
- **Google Gemini** - With web search integration

#### Alternative: Event Aggregation APIs (if not using AI)
- Eventbrite API
- Ticketmaster API
- Facebook Events API
- Meetup API

---

## How It Would Work

### **User Flow**

1. **Registration/Login**
   - User creates account or logs in
   - Option to link social accounts immediately or later

2. **Profile Discovery**
   - User enters email address
   - Backend calls AI service to search for profiles:
     - Query: "Find public social media profiles associated with email [email] on Facebook, Instagram, YouTube, Spotify, Twitter"
     - AI returns list of potential profiles with URLs
   - Frontend displays list of profiles for user to select
   - User selects which profiles belong to them

3. **Public Profile Crawling**
   - For each selected profile:
     - Backend crawls/scrapes public profile page
     - Extract public data:
       - Facebook: Public liked pages, public events attended
       - Instagram: Public posts, public bio, public highlights
       - YouTube: Public channel subscriptions, public playlists
       - Spotify: Public playlists, public followed artists
     - Use AI to analyze content and extract interests:
       - "Analyze this user's public [platform] profile and extract their interests in music, events, entertainment, and local activities"
   - Store extracted preferences

4. **Preference Refinement**
   - Display extracted preferences to user
   - User can manually add/remove preferences
   - Generate initial interest categories
   - User confirms or edits preferences

4. **Location Setup**
   - User sets their city/region
   - Used for filtering local events

5. **Event Discovery (AI-Powered Approach)**
   - Weekly, per user:
     - Build personalized query from:
       - User preferences (extracted from social media)
       - Location (city/region)
       - Interest categories
     - Example query: "Find upcoming concerts, theater plays, and local events in [City] this week. Focus on [genres/interests]. Include events from venues, Facebook, Eventbrite, and local event calendars."
     - Call AI service (Perplexity/Claude/GPT-4) with:
       - Structured prompt with user preferences
       - Request JSON-formatted event list
       - Specify date range (next 7-14 days)
     - AI returns curated list of events with:
       - Title, description, date/time
       - Location
       - Source URL
       - Category tags
     - Store results in database (optional caching)

6. **Event Filtering & Ranking (Optional Enhancement)**
   - Post-process AI results:
     - Deduplicate events
     - Verify dates are upcoming
     - Filter by location radius (if coordinates available)
     - Rank by relevance score (if multiple events returned)
   - Select top N events (e.g., 10-15) for newsletter

7. **Newsletter Generation & Delivery**
   - Weekly scheduled job:
     - Generate personalized newsletter HTML
     - Send via email service
     - Track delivery status
     - Store newsletter history

### **System Architecture**

```
┌─────────────┐
│   React     │  ← User Interface
│  Frontend   │
└──────┬──────┘
       │ HTTP/REST
┌──────▼──────────────────┐
│   Express.js API        │
│   - Auth endpoints      │
│   - Profile endpoints   │
│   - Preferences         │
└──────┬──────────────────┘
       │
       ├──► PostgreSQL (User data, preferences, events cache)
       │
       ├──► AI Service (Perplexity/Claude/GPT-4)
       │   ├── Profile discovery by email
       │   ├── Public profile content analysis
       │   └── Event discovery
       │
       ├──► Web Scraping (Public Profiles)
       │   ├── Facebook public pages
       │   ├── Instagram public profiles
       │   ├── YouTube public channels
       │   └── Spotify public playlists
       │
       └──► Background Workers
            ├── On-demand: Profile discovery & crawling (when user selects profiles)
            ├── Weekly: AI-powered event discovery per user
            ├── Weekly: Generate & send newsletters
            └── Periodic: Refresh profile data (optional)
```

---

## Minimal Maintenance Hosting Solutions

### **Option 1: Vercel + Railway/Render (Recommended)**
- **Frontend**: Vercel (automatic deployments, zero config)
- **Backend**: Railway or Render (PostgreSQL included, auto-deploy from Git)
- **Background Jobs**: Same backend server with cron jobs, or separate worker
- **Cost**: ~$5-20/month
- **Maintenance**: Minimal - Git push triggers deployments

### **Option 2: Fly.io**
- **Everything**: Fly.io (frontend, backend, database, workers)
- **Cost**: ~$5-15/month
- **Maintenance**: Minimal - Docker-based, auto-scaling

### **Option 3: AWS/GCP Serverless**
- **Frontend**: Vercel or Cloudflare Pages
- **Backend**: AWS Lambda / Cloud Functions
- **Database**: AWS RDS / Cloud SQL
- **Jobs**: AWS EventBridge / Cloud Scheduler
- **Cost**: Pay-as-you-go (can be very cheap for low traffic)
- **Maintenance**: More complex setup initially

### **Option 4: Supabase + Vercel**
- **Frontend**: Vercel
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL + built-in auth)
- **Jobs**: Supabase Edge Functions or external cron
- **Cost**: Free tier available, then ~$25/month
- **Maintenance**: Very minimal

---

## Implementation Phases

### **Phase 1: MVP (Core Functionality)**
1. User registration/login (email-based)
2. AI-powered profile discovery by email
3. User profile selection interface
4. Basic public profile crawling (start with 1-2 platforms)
5. AI-powered preference extraction
6. Manual preference editing
7. AI-powered event discovery (Perplexity API recommended)
8. Basic filtering and ranking
9. Email newsletter (manual trigger for testing)

### **Phase 2: Enhanced Profile Discovery**
1. Expand to all platforms (Facebook, Instagram, YouTube, Spotify, Twitter)
2. Improved AI prompts for better profile matching
3. Enhanced public profile crawling
4. Better preference extraction from profile content
5. User feedback on extracted preferences

### **Phase 3: Enhanced Features**
1. Enhanced AI prompts with better context
2. User feedback loop (mark events as interested/not interested) → improve future queries
3. Newsletter customization options
4. Event caching to reduce API calls

### **Phase 4: Optimization**
1. Caching strategies
2. Performance optimization
3. Analytics and monitoring

---

## Key Considerations

### **Privacy & Security**
- **No OAuth tokens needed** - only public profile data
- Store only profile URLs (not passwords/tokens)
- Respect robots.txt and rate limits when scraping
- GDPR compliance (data deletion, export)
- Secure API keys management
- Rate limiting on scraping and AI APIs
- User consent for profile crawling
- Clear disclosure that only public data is accessed

### **Scalability**
- Database indexing for fast queries
- Caching frequently accessed data
- Background job queue for heavy operations
- CDN for static assets

### **Cost Management**
- **AI API Costs**:
  - **Profile Discovery** (one-time per user): ~$0.01-0.05 per search
  - **Profile Analysis** (one-time per profile): ~$0.01-0.03 per profile
  - **Event Discovery** (weekly per user): ~$0.001-0.01 per query
  - **Total per user**: ~$0.05-0.15 one-time + $0.10-2.00/month
  - For 100 users: ~$5-15 one-time + $10-200/month
- Efficient prompt design (shorter = cheaper)
- Response caching (cache similar queries)
- Scraping costs: Free (self-hosted) or ~$50-200/month (proxy service if needed)
- Email service limits
- Database size optimization

### **Maintenance**
- Error monitoring (Sentry)
- Logging (structured logs)
- Health checks
- Automated backups

---

## Next Steps

1. Set up project structure (monorepo or separate repos)
2. Initialize React + Express with TypeScript
3. Set up database schema (Prisma)
4. Implement basic auth
5. Build preference management UI
6. Integrate first event source
7. Build matching algorithm
8. Set up email service
9. Deploy to chosen hosting platform

---

## AI-Powered Event Discovery: Detailed Approach

### **Why AI Instead of API Crawling?**

**Advantages:**
1. **Zero API Management**: No need to integrate with Facebook Events, Eventbrite, Ticketmaster, etc.
2. **Better Context Understanding**: AI understands natural language preferences better than keyword matching
3. **Comprehensive Coverage**: AI searches across all sources simultaneously (websites, social media, event platforms)
4. **Lower Maintenance**: No API key rotation, rate limit management, or breaking changes
5. **Cost Effective**: At ~$0.01-0.10 per weekly query per user, very affordable
6. **Flexible Queries**: Easy to adjust prompts based on user feedback

**How It Works:**

1. **Build Personalized Query**
   ```typescript
   const buildEventQuery = (user: User) => {
     return `Find upcoming local events in ${user.city} for the next 7 days.
     
     User interests: ${user.interests.join(', ')}
     Preferred categories: ${user.categories.join(', ')}
     Social media insights: ${user.socialInsights}
     
     Please return a JSON array of events with:
     - title
     - description
     - date (ISO format)
     - time
     - location (address)
     - category
     - sourceUrl
     - imageUrl (if available)
     
     Focus on: concerts, theater, community gatherings, art shows, and similar local events.
     Exclude: corporate events, private parties, online-only events.`;
   };
   ```

2. **Call AI Service**
   - Use Perplexity API (recommended for web search)
   - Or Claude/GPT-4 with web browsing enabled
   - Request structured JSON response

3. **Parse & Store Results**
   - Validate JSON structure
   - Deduplicate events
   - Store in database (optional: cache for similar users)

4. **Cost Example**
   - 100 users × 4 weeks/month = 400 queries
   - Perplexity: ~$0.40-4.00/month
   - Claude: ~$1.20-6.00/month
   - GPT-4: ~$12-40/month
   - **Recommendation: Start with Perplexity (best price/performance for web search)**

### **AI Service Comparison**

| Service | Cost per Query | Web Search Quality | JSON Output | Best For |
|---------|---------------|-------------------|-------------|----------|
| **Perplexity API** | $0.001-0.01 | ⭐⭐⭐⭐⭐ Excellent | ✅ Yes | **Recommended** - Best for event discovery |
| **Claude 3.5 Sonnet** | $0.003-0.015 | ⭐⭐⭐⭐ Very Good | ✅ Yes | Great balance of cost/quality |
| **GPT-4 (web)** | $0.03-0.10 | ⭐⭐⭐⭐ Very Good | ✅ Yes | More expensive but reliable |
| **Gemini** | $0.001-0.01 | ⭐⭐⭐ Good | ✅ Yes | Budget option |

### **Implementation Example (Perplexity API)**

```typescript
import { Perplexity } from '@perplexity/ai';

async function discoverEvents(user: User) {
  const query = buildEventQuery(user);
  
  const response = await perplexity.chat.completions.create({
    model: 'llama-3.1-sonar-large-128k-online',
    messages: [
      {
        role: 'system',
        content: 'You are an event discovery assistant. Return only valid JSON arrays.'
      },
      {
        role: 'user',
        content: query
      }
    ],
    response_format: { type: 'json_object' }
  });
  
  const events = JSON.parse(response.choices[0].message.content);
  return events;
}
```

### **Hybrid Approach (Optional)**
- Use AI for primary discovery
- Supplement with 1-2 key APIs (e.g., Facebook Events) for verification
- Best of both worlds: AI flexibility + API reliability

---

## Email-Based Profile Discovery: Detailed Approach

### **Why Email-Based Discovery Instead of OAuth?**

**Advantages:**
1. **No OAuth Complexity**: Users don't need to grant permissions or manage API tokens
2. **Better UX**: Simple email input → select your profiles → done
3. **User Control**: Users explicitly choose which profiles to link
4. **Privacy Friendly**: Only uses public data, no private API access needed
5. **Lower Maintenance**: No OAuth token refresh, expiration handling
6. **Works for All Platforms**: Even platforms without OAuth support

**How It Works:**

### **Step 1: Profile Discovery by Email**

```typescript
async function discoverProfilesByEmail(email: string) {
  const query = `Find public social media profiles associated with email ${email} on:
  - Facebook (facebook.com)
  - Instagram (instagram.com)
  - YouTube (youtube.com)
  - Spotify (open.spotify.com)
  - Twitter/X (x.com, twitter.com)
  - LinkedIn (linkedin.com)
  
  Return a JSON array with:
  - platform (facebook, instagram, youtube, spotify, twitter, linkedin)
  - profileUrl
  - username
  - displayName
  - profilePicture (if available)
  - confidence (high/medium/low based on email match)
  
  Only include profiles that are publicly accessible.`;
  
  const response = await aiService.chat({
    model: 'perplexity-sonar',
    messages: [{ role: 'user', content: query }],
    response_format: { type: 'json_object' }
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

**User Experience:**
1. User enters email: `user@example.com`
2. System shows loading: "Searching for your profiles..."
3. System displays list:
   ```
   📘 Facebook: John Doe (facebook.com/john.doe)
   📷 Instagram: @johndoe (instagram.com/johndoe)
   🎵 Spotify: John's Playlists (open.spotify.com/user/johndoe)
   🎥 YouTube: John's Channel (youtube.com/@johndoe)
   ```
4. User selects: "These are my profiles" (checkbox selection)
5. User clicks "Continue"

### **Step 2: Public Profile Crawling**

For each selected profile, crawl public data:

```typescript
async function crawlPublicProfile(profileUrl: string, platform: string) {
  // Use Puppeteer or Playwright for dynamic content
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.goto(profileUrl);
  
  let publicData;
  
  switch (platform) {
    case 'facebook':
      // Extract public liked pages, public events
      publicData = await extractFacebookPublicData(page);
      break;
    case 'instagram':
      // Extract public posts, bio, highlights
      publicData = await extractInstagramPublicData(page);
      break;
    case 'youtube':
      // Extract public subscriptions, playlists
      publicData = await extractYouTubePublicData(page);
      break;
    case 'spotify':
      // Extract public playlists, followed artists
      publicData = await extractSpotifyPublicData(page);
      break;
  }
  
  await browser.close();
  return publicData;
}
```

**What to Extract:**
- **Facebook**: Public liked pages (venues, artists, event pages)
- **Instagram**: Public posts (event attendance, venue check-ins), bio keywords
- **YouTube**: Public channel subscriptions, public playlists
- **Spotify**: Public playlists, public followed artists

### **Step 3: AI-Powered Preference Extraction**

Analyze crawled content to extract preferences:

```typescript
async function extractPreferencesFromProfile(
  platform: string,
  publicData: any
) {
  const query = `Analyze this user's public ${platform} profile data and extract their interests:
  
  Profile Data:
  ${JSON.stringify(publicData, null, 2)}
  
  Extract:
  - Music genres they like
  - Event types they attend (concerts, theater, sports, etc.)
  - Venues they frequent
  - Artists/creators they follow
  - General interests related to local events and entertainment
  
  Return JSON with:
  - interests: array of interest keywords
  - genres: array of music/entertainment genres
  - eventTypes: array of event categories
  - venues: array of venue names (if identifiable)
  - artists: array of artist/creator names`;
  
  const response = await aiService.chat({
    model: 'claude-3-5-sonnet',
    messages: [{ role: 'user', content: query }],
    response_format: { type: 'json_object' }
  });
  
  return JSON.parse(response.choices[0].message.content);
}
```

### **Implementation Considerations**

**1. Rate Limiting & Respectful Scraping**
```typescript
// Add delays between requests
await delay(2000); // 2 seconds between profile crawls

// Respect robots.txt
import robotsParser from 'robots-parser';
const robots = robotsParser(robotsUrl);
if (!robots.isAllowed(profileUrl, 'User-agent')) {
  throw new Error('Not allowed by robots.txt');
}
```

**2. Error Handling**
- Some profiles may be private → skip gracefully
- Some platforms may block scraping → use proxy rotation
- AI may not find profiles → allow manual profile URL input

**3. Fallback Options**
- If AI doesn't find profiles, allow manual entry:
  - "Can't find your profiles? Enter them manually"
  - User can paste profile URLs directly

**4. Privacy & Legal**
- Only access public data
- Clear user consent: "We'll only access public profile information"
- Store only profile URLs, not scraped content long-term
- Allow users to remove profiles anytime

### **Cost Breakdown**

**Per User (One-Time Setup):**
- Profile discovery: 1 AI query × $0.01-0.05 = **$0.01-0.05**
- Profile crawling: Free (self-hosted) or proxy costs
- Profile analysis: 2-4 profiles × $0.01-0.03 = **$0.02-0.12**
- **Total one-time: ~$0.03-0.17 per user**

**For 100 users: ~$3-17 one-time cost**

### **Alternative: Hybrid Approach**

If scraping becomes unreliable:
1. Use AI for profile discovery (email → profile URLs)
2. Use official APIs for public data where available:
   - YouTube Data API (public subscriptions, no auth needed)
   - Spotify Web API (public playlists, no auth needed)
3. Scrape only when APIs aren't available

---

Would you like me to start implementing this solution? I can begin with the project setup and Phase 1 MVP using:
- Email-based profile discovery (AI-powered)
- Public profile crawling
- AI-powered preference extraction
- AI-powered event discovery

