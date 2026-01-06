import axios from "axios";

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

export interface DiscoveredEvent {
  title: string;
  description?: string;
  date: string; // ISO format
  time?: string;
  location: string;
  category?: string;
  sourceUrl: string;
  imageUrl?: string;
  score: number; // Relevance score (0-100)
}

/**
 * Discover events from a specific venue/provider URL
 */
export async function discoverEventsFromSource(
  sourceUrl: string,
  sourceName?: string,
  userProfile?: string
): Promise<DiscoveredEvent[]> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error("PERPLEXITY_API_KEY not configured");
  }

  const profileContext = userProfile
    ? `\n\nUser profile (use this to score events):\n${userProfile}`
    : "";

  const query = `Visit this event source URL and find all upcoming events listed there:

Source URL: ${sourceUrl}
${sourceName ? `Source Name: ${sourceName}` : ""}${profileContext}

Please return a JSON object with an "events" array. Each event should have:
- title
- description (optional)
- date (ISO format: YYYY-MM-DD)
- time (optional, HH:MM format)
- location (full address)
- category (optional)
- sourceUrl (link to the specific event page, or the source URL if not available)
- imageUrl (optional, link to event image)
- score (number from 0-100 indicating how well this event matches the user's profile, where 100 is a perfect match. If no profile is provided, use 75 as a default since the user has explicitly added this source)

Only include events that are happening in the next 30 days.
Focus on concerts, theater, community gatherings, art shows, and similar local events.
If no events are found or the page doesn't contain events, return an empty array.`;

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
      `Event source discovery response for ${sourceUrl}:`,
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

    if (!parsed.events || !Array.isArray(parsed.events)) {
      console.warn("Unexpected response format:", parsed);
      // Try to handle if events are at root level
      if (Array.isArray(parsed)) {
        return parsed.map((e: any) => ({
          ...e,
          score: e.score !== undefined ? e.score : 75, // Default score for user-added sources
        }));
      }
      return [];
    }

    // Ensure all events have scores (default to 75 for user-added sources)
    return (parsed.events || []).map((e: any) => ({
      ...e,
      score: e.score !== undefined ? e.score : 75,
    }));
  } catch (error: any) {
    console.error(`Error discovering events from source ${sourceUrl}:`, error);
    // Return empty array on error - don't fail the whole newsletter generation
    return [];
  }
}
