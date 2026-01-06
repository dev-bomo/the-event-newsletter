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
  score: number; // Relevance score (0-100) indicating how well the event matches user preferences
}

/**
 * Generate a user profile for event discovery based on their preferences
 */
export async function generateUserProfile(data: {
  city: string;
  interests: string[];
  genres: string[];
  eventTypes: string[];
  venues: string[];
  artists: string[];
  eventSources: Array<{ url: string; name?: string }>;
}): Promise<string> {
  if (
    !PERPLEXITY_API_KEY ||
    PERPLEXITY_API_KEY === "your-perplexity-api-key-here" ||
    PERPLEXITY_API_KEY.trim() === ""
  ) {
    throw new Error(
      "PERPLEXITY_API_KEY not configured. Please add your Perplexity API key to the .env file."
    );
  }

  // Build the prompt
  const interestsText =
    data.interests.length > 0 ? data.interests.join(", ") : "none specified";
  const genresAndEventTypes = [...data.genres, ...data.eventTypes];
  const genresText =
    genresAndEventTypes.length > 0
      ? genresAndEventTypes.join(", ")
      : "none specified";
  const artistsText =
    data.artists.length > 0 ? data.artists.join(", ") : "none specified";
  const venuesText =
    data.venues.length > 0 ? data.venues.join(", ") : "none specified";
  const eventSourcesText =
    data.eventSources.length > 0
      ? data.eventSources.map((s) => s.url).join(", ")
      : "none specified";

  const prompt = `I live in ${data.city}.
I like ${interestsText}. Specifically ${genresText}.
Here are some artists that I like:
${artistsText}
Here are some venues from ${data.city} where I like to go:
${venuesText}
And here are some direct links to event pages that I like to browse to get my events:
${eventSourcesText}`;

  const systemPrompt = `You are an assistant that creates detailed user profiles for event discovery. Based on the user's preferences, create a comprehensive profile that describes their interests, preferences, and event discovery patterns. The profile should be written in natural language and be suitable for use as a prompt to find relevant events. Make it detailed and specific, capturing the user's taste and preferences.`;

  try {
    const response = await axios.post(
      PERPLEXITY_API_URL,
      {
        model: "sonar",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const content = response.data.choices[0].message.content;

    // Extract text from markdown code blocks if present
    let profileText = content.trim();
    if (profileText.startsWith("```")) {
      const lines = profileText.split("\n");
      lines.shift(); // Remove first line (```)
      lines.pop(); // Remove last line (```)
      profileText = lines.join("\n").trim();
    }

    return profileText;
  } catch (error: any) {
    console.error(
      "Error generating user profile:",
      error.response?.data || error.message
    );
    throw new Error(
      `Failed to generate user profile: ${
        error.response?.data?.message || error.message
      }`
    );
  }
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

  let content: string | undefined;
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

    content = response.data.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from Perplexity API");
    }

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
 * Discover local events based on user profile
 */
export async function discoverEvents(
  city: string,
  userProfile: string
): Promise<DiscoveredEvent[]> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error("PERPLEXITY_API_KEY not configured");
  }

  const query = `Find upcoming local events in ${city} for the next 30 days (one month in advance).

User profile:
${userProfile}

Based on this user profile, find events that match their interests, preferences, and taste. Return between 12 and 20 events that are most relevant to this user.

Please return a JSON object with an "events" array. Each event should have:
- title
- description (optional)
- date (ISO format: YYYY-MM-DD)
- time (optional, HH:MM format)
- location (full address)
- category (optional)
- sourceUrl (link to event page)
- imageUrl (optional, link to event image)
- score (number from 0-100 indicating how well this event matches the user's profile, where 100 is a perfect match)

Focus on: concerts, theater, community gatherings, art shows, local festivals, and similar local events that align with the user's profile.
Include events happening from today up to 30 days in the future.
Exclude: corporate events, private parties, online-only events, events more than 30 days away.

Return between 12 and 20 events, prioritized by relevance to the user's profile. Events with higher scores should be more closely aligned with the user's interests, preferred genres, artists, and venues.`;

  let content: string | undefined;
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

    content = response.data.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from Perplexity API");
    }

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
