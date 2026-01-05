import axios from "axios";

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

export interface DiscoveredProfile {
  platform: string;
  profileUrl: string;
  username?: string;
  displayName?: string;
  profilePicture?: string;
  confidence: "high" | "medium" | "low";
}

export interface ExtractedPreferences {
  interests: string[];
  genres: string[];
  eventTypes: string[];
  venues: string[];
  artists: string[];
}

export interface DiscoveredEvent {
  title: string;
  description?: string;
  date: string; // ISO format
  time?: string;
  location: string;
  category?: string;
  sourceUrl: string;
  imageUrl?: string;
}

/**
 * Discover social media profiles by email address
 */
export async function discoverProfilesByEmail(
  email: string
): Promise<DiscoveredProfile[]> {
  console.log("discoverProfilesByEmail called with email:", email);
  console.log("PERPLEXITY_API_KEY exists:", !!PERPLEXITY_API_KEY);
  console.log("PERPLEXITY_API_KEY length:", PERPLEXITY_API_KEY?.length || 0);

  if (
    !PERPLEXITY_API_KEY ||
    PERPLEXITY_API_KEY === "your-perplexity-api-key-here" ||
    PERPLEXITY_API_KEY.trim() === ""
  ) {
    throw new Error(
      "PERPLEXITY_API_KEY not configured. Please add your Perplexity API key to the .env file. Get one at https://www.perplexity.ai/"
    );
  }

  const query = `Find public social media profiles associated with email ${email} on:
- Facebook (facebook.com)
- Instagram (instagram.com)
- YouTube (youtube.com)
- Spotify (open.spotify.com)
- Twitter/X (x.com, twitter.com)
- LinkedIn (linkedin.com)

Return a JSON object with a "profiles" array. Each profile should have:
- platform (facebook, instagram, youtube, spotify, twitter, linkedin)
- profileUrl
- username (optional)
- displayName (optional)
- profilePicture (optional, URL)
- confidence (high/medium/low based on email match)

Only include profiles that are publicly accessible. If no profiles are found, return an empty array.`;

  try {
    const response = await axios.post(
      PERPLEXITY_API_URL,
      {
        model: "sonar",
        messages: [
          {
            role: "system",
            content:
              'You are a profile discovery assistant. Return only valid JSON objects with a "profiles" array.',
          },
          {
            role: "user",
            content: query,
          },
        ],
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const content = response.data.choices[0].message.content;

    // Try to extract JSON from the response (might be wrapped in markdown code blocks)
    let jsonContent = content;
    const jsonMatch =
      content.match(/```json\s*([\s\S]*?)\s*```/) ||
      content.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonContent);

    if (!Array.isArray(parsed.profiles)) {
      console.warn("Unexpected response format:", parsed);
      return [];
    }

    return parsed.profiles || [];
  } catch (error: any) {
    console.error("Error discovering profiles - full error:", error);
    console.error("Error response data:", error.response?.data);
    console.error("Error response status:", error.response?.status);

    // Provide more specific error messages
    if (error.response) {
      // API returned an error
      const status = error.response.status;
      const data = error.response.data;
      const message =
        data?.error?.message ||
        data?.message ||
        JSON.stringify(data) ||
        "API error";

      console.error(`Perplexity API returned ${status}:`, message);

      if (status === 401 || status === 403) {
        throw new Error(
          `Invalid Perplexity API key (${status}). Please check your PERPLEXITY_API_KEY in .env`
        );
      }

      throw new Error(`Perplexity API error (${status}): ${message}`);
    } else if (error.request) {
      // Request was made but no response received
      console.error("No response received from Perplexity API");
      throw new Error(
        "No response from Perplexity API. Check your internet connection."
      );
    } else if (error instanceof SyntaxError) {
      // JSON parsing error
      console.error("JSON parsing error:", error.message);
      throw new Error(`Failed to parse AI response: ${error.message}`);
    } else {
      console.error("Unknown error:", error);
      throw new Error(
        `Failed to discover profiles: ${error.message || "Unknown error"}`
      );
    }
  }
}

/**
 * Extract preferences from public profile URL using AI (no scraping needed)
 */
export async function extractPreferencesFromProfileUrl(
  platform: string,
  profileUrl: string
): Promise<ExtractedPreferences> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error("PERPLEXITY_API_KEY not configured");
  }

  const query = `Analyze this public ${platform} profile and extract the user's interests:

Profile URL: ${profileUrl}

Visit the profile and analyze:
- Music genres they like
- Event types they attend (concerts, theater, sports, etc.)
- Venues they frequent
- Artists/creators they follow
- General interests related to local events and entertainment

Return a JSON object with:
- interests: array of interest keywords
- genres: array of music/entertainment genres
- eventTypes: array of event categories
- venues: array of venue names (if identifiable)
- artists: array of artist/creator names

If information is not available, return empty arrays.`;

  try {
    const response = await axios.post(
      PERPLEXITY_API_URL,
      {
        model: "sonar",
        messages: [
          {
            role: "system",
            content:
              "You are a preference extraction assistant. Return only valid JSON objects.",
          },
          {
            role: "user",
            content: query,
          },
        ],
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const content = response.data.choices[0].message.content;
    console.log(
      "Preference extraction response content:",
      content.substring(0, 500)
    );

    // Try to extract JSON from the response (might be wrapped in markdown code blocks)
    let jsonContent = content;
    const jsonMatch =
      content.match(/```json\s*([\s\S]*?)\s*```/) ||
      content.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
      console.log("Extracted JSON from code block");
    }

    const parsed = JSON.parse(jsonContent);

    return {
      interests: parsed.interests || [],
      genres: parsed.genres || [],
      eventTypes: parsed.eventTypes || [],
      venues: parsed.venues || [],
      artists: parsed.artists || [],
    };
  } catch (error: any) {
    console.error("Error extracting preferences - full error:", error);
    if (error instanceof SyntaxError) {
      console.error("JSON parsing error:", error.message);
      console.error(
        "Content that failed to parse:",
        content?.substring(0, 1000)
      );
    }
    // Return empty preferences on error
    return {
      interests: [],
      genres: [],
      eventTypes: [],
      venues: [],
      artists: [],
    };
  }
}

/**
 * Discover local events based on user preferences
 */
export async function discoverEvents(
  city: string,
  preferences: ExtractedPreferences
): Promise<DiscoveredEvent[]> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error("PERPLEXITY_API_KEY not configured");
  }

  const interests = preferences.interests.join(", ");
  const genres = preferences.genres.join(", ");
  const eventTypes = preferences.eventTypes.join(", ");
  const artists = preferences.artists.slice(0, 10).join(", "); // Limit artists

  const query = `Find upcoming local events in ${city} for the next 30 days (one month in advance).

User interests: ${interests || "general entertainment"}
Preferred genres: ${genres || "various"}
Event types: ${eventTypes || "concerts, theater, community gatherings"}
Followed artists: ${artists || "none"}

Please return a JSON object with an "events" array. Each event should have:
- title
- description (optional)
- date (ISO format: YYYY-MM-DD)
- time (optional, HH:MM format)
- location (full address)
- category (optional)
- sourceUrl (link to event page)
- imageUrl (optional, link to event image)

Focus on: concerts, theater, community gatherings, art shows, local festivals, and similar local events.
Include events happening from today up to 30 days in the future.
Exclude: corporate events, private parties, online-only events, events more than 30 days away.

Return up to 20 events (prioritize events happening in the next 2 weeks, but include events up to 30 days out).`;

  try {
    const response = await axios.post(
      PERPLEXITY_API_URL,
      {
        model: "sonar",
        messages: [
          {
            role: "system",
            content:
              'You are an event discovery assistant. Return only valid JSON objects with an "events" array.',
          },
          {
            role: "user",
            content: query,
          },
        ],
        temperature: 0.4,
      },
      {
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const content = response.data.choices[0].message.content;
    console.log("Event discovery response content:", content.substring(0, 500)); // Log first 500 chars

    // Try to extract JSON from the response (might be wrapped in markdown code blocks)
    let jsonContent = content;
    const jsonMatch =
      content.match(/```json\s*([\s\S]*?)\s*```/) ||
      content.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
      console.log("Extracted JSON from code block");
    }

    const parsed = JSON.parse(jsonContent);

    if (!parsed.events || !Array.isArray(parsed.events)) {
      console.warn("Unexpected response format:", parsed);
      // Try to handle if events are at root level
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return [];
    }

    return parsed.events || [];
  } catch (error: any) {
    console.error("Error discovering events - full error:", error);
    console.error("Error response data:", error.response?.data);
    console.error("Error response status:", error.response?.status);

    // Provide more specific error messages
    if (error.response) {
      // API returned an error
      const status = error.response.status;
      const data = error.response.data;
      const message =
        data?.error?.message ||
        data?.message ||
        JSON.stringify(data) ||
        "API error";

      console.error(`Perplexity API returned ${status}:`, message);

      if (status === 401 || status === 403) {
        throw new Error(
          `Invalid Perplexity API key (${status}). Please check your PERPLEXITY_API_KEY in .env`
        );
      }

      throw new Error(`Perplexity API error (${status}): ${message}`);
    } else if (error.request) {
      // Request was made but no response received
      console.error("No response received from Perplexity API");
      throw new Error(
        "No response from Perplexity API. Check your internet connection."
      );
    } else if (error instanceof SyntaxError) {
      // JSON parsing error
      console.error("JSON parsing error:", error.message);
      console.error(
        "Content that failed to parse:",
        error.message.includes("JSON")
          ? "See above"
          : content?.substring(0, 1000)
      );
      throw new Error(
        `Failed to parse AI response: ${error.message}. The API might have returned invalid JSON.`
      );
    } else {
      console.error("Unknown error:", error);
      throw new Error(
        `Failed to discover events: ${error.message || "Unknown error"}`
      );
    }
  }
}
