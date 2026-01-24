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

  // Build the prompt with limits to avoid exceeding Perplexity token limits (~8,000 tokens = ~20,000 chars)
  // Limit lists to reasonable sizes to keep prompts manageable
  const MAX_INTERESTS = 20;
  const MAX_GENRES_EVENTTYPES = 30;
  const MAX_ARTISTS = 20; // Limit for profile generation (will be used in event discovery)
  const MAX_VENUES = 15;
  const MAX_EVENT_SOURCES = 10;

  const limitedInterests = data.interests.slice(0, MAX_INTERESTS);
  const limitedGenres = data.genres.slice(0, MAX_GENRES_EVENTTYPES);
  const limitedEventTypes = data.eventTypes.slice(0, MAX_GENRES_EVENTTYPES);
  const limitedArtists = data.artists.slice(0, MAX_ARTISTS);
  const limitedVenues = data.venues.slice(0, MAX_VENUES);
  const limitedEventSources = data.eventSources.slice(0, MAX_EVENT_SOURCES);

  const interestsText =
    limitedInterests.length > 0
      ? limitedInterests.join(", ")
      : "none specified";
  const genresAndEventTypes = [...limitedGenres, ...limitedEventTypes];
  const genresText =
    genresAndEventTypes.length > 0
      ? genresAndEventTypes.join(", ")
      : "none specified";
  const artistsText =
    limitedArtists.length > 0 ? limitedArtists.join(", ") : "none specified";
  const venuesText =
    limitedVenues.length > 0 ? limitedVenues.join(", ") : "none specified";
  const eventSourcesText =
    limitedEventSources.length > 0
      ? limitedEventSources.map((s) => s.url).join(", ")
      : "none specified";

  const prompt = `I live in ${data.city}.

My interests: ${interestsText}

My preferred genres and event types: ${genresText}

Artists I like:
${artistsText}

Venues in ${data.city} where I like to go:
${venuesText}

Direct links to event pages I follow:
${eventSourcesText}`;

  // Log the prompt being sent for debugging
  console.log("Generating user profile with prompt:", prompt);

  const systemPrompt = `You are an assistant that creates concise user profiles for event discovery. Based on the user's preferences provided below, create a brief, clear profile that describes their interests and preferences. Keep it simple and direct - avoid wordy descriptions or unnecessary elaboration. Focus on the key information: their interests, genres, event types, artists, and venues.

The profile should be written in natural language and be suitable for use as a prompt to find relevant events. Be concise and to the point.

IMPORTANT: Return plain text only. Do not use markdown formatting (no **, no *, no code blocks, etc.). Just write natural, flowing text.`;

  try {
    const response = await axios.post(
      PERPLEXITY_API_URL,
      {
        model: "sonar-pro",
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

    // Remove markdown bold formatting (**text** -> text)
    // This removes all instances of ** that are used for bold formatting
    profileText = profileText.replace(/\*\*([^*]+)\*\*/g, "$1");

    // Remove citation markers like [1], [2], [3], etc.
    // These are Perplexity's citation references and aren't needed in plain text
    profileText = profileText.replace(/\[\d+\]/g, "");

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
 * Helper function to make a Perplexity API call
 */
async function callPerplexity(
  model: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7
): Promise<string> {
  const response = await axios.post(
    PERPLEXITY_API_URL,
    {
      model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature,
    },
    {
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const content = response.data.choices[0].message.content;
  if (!content) {
    throw new Error("Empty response from Perplexity API");
  }

  return content;
}

/**
 * Step 1: Planning call to get search tasks
 */
async function planEventSearch(
  city: string,
  userProfile: string,
  eventSources?: string[]
): Promise<{ tasks: string[]; rawResponse: string }> {
  const eventSourcesText =
    eventSources && eventSources.length > 0
      ? `\n\nPages they normally access to find events are:\n${eventSources.join(
          "\n"
        )}`
      : "";

  const prompt = `You will be given a user profile for event discovery:

User profile:
${userProfile}${eventSourcesText}

City: ${city}
Date window: Next 30 days

Your task is to create a plan for finding events. Break down the search into 5-6 specific tasks or sites to query. Each task should be a specific search query or website/source to check.

Return a JSON object with a "tasks" array. Each task should be a string describing what to search for or which site to query. Examples:
- "Search Bandsintown for rock/metal concerts in ${city}"
- "Check iabilet.ro for events at Casa Tineretului"
- "Find stand-up comedy shows in ${city} on Eventbrite"
- "Search for philosophy talks and meetups in ${city}"

Return exactly 5-6 tasks, no more, no less.`;

  const systemPrompt = `You are a planning assistant for event discovery. Return only valid JSON with a "tasks" array containing 5-6 search tasks.`;

  console.log("Step 1: Planning event search...");
  const rawResponse = await callPerplexity(
    "sonar-pro",
    systemPrompt,
    prompt,
    0.7
  );

  console.log("Planning response:", rawResponse.substring(0, 500));

  // Parse tasks from response
  let jsonContent = rawResponse;
  const jsonMatch =
    rawResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
    rawResponse.match(/```\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonContent = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonContent);
    const tasks = parsed.tasks || parsed.task || [];
    if (!Array.isArray(tasks) || tasks.length === 0) {
      throw new Error("Invalid tasks format in planning response");
    }
    console.log(`Planning returned ${tasks.length} tasks`);
    return { tasks: tasks.slice(0, 6), rawResponse }; // Limit to 6 max
  } catch (error) {
    console.error("Failed to parse planning response:", error);
    // Fallback: create default tasks
    const defaultTasks = [
      `Search for concerts and music events in ${city}`,
      `Find theater and performing arts events in ${city}`,
      `Search for meetups and talks in ${city}`,
      `Find comedy shows in ${city}`,
      `Search for sports and running events in ${city}`,
    ];
    return { tasks: defaultTasks, rawResponse };
  }
}

/**
 * Step 2: Parallel search calls for each task
 */
async function searchEventsForTask(
  task: string,
  userProfile: string,
  eventSources?: string[]
): Promise<{ events: any[]; rawResponse: string }> {
  const eventSourcesText =
    eventSources && eventSources.length > 0
      ? `\n\nIMPORTANT: The user follows these event sources. If this task relates to any of these sources, prioritize checking them:\n${eventSources.join("\n")}`
      : "";

  const today = new Date();
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(today.getDate() + 30);
  const dateWindow = `Events must be between ${today.toISOString().split("T")[0]} and ${thirtyDaysLater.toISOString().split("T")[0]} (next 30 days).`;

  const prompt = `From this site/search: "${task}"

Extract raw event candidates as simple objects. Do NOT score, deduplicate, or filter. Just extract all relevant events you can find.

${dateWindow}
${eventSourcesText}

For each event, return:
- title
- description (optional)
- date (ISO format: YYYY-MM-DD) - MUST be within the next 30 days
- time (optional, HH:MM format)
- location (full address)
- category (optional)
- sourceUrl (URL to the event page or source)
- imageUrl (optional)

Return a JSON object with a "events" array containing all events found. Include as many as you can find, even if they seem similar. Only include events within the next 30 days.`;

  const systemPrompt = `You are extracting raw event data. Return only valid JSON with an "events" array. Do not score or deduplicate.`;

  console.log(`Step 2: Searching for task: "${task.substring(0, 50)}..."`);
  // sonar-pro model automatically enables web search
  const rawResponse = await callPerplexity(
    "sonar-pro",
    systemPrompt,
    prompt,
    0.7
  );

  // Parse events from response
  let jsonContent = rawResponse;
  const jsonMatch =
    rawResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
    rawResponse.match(/```\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonContent = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonContent);
    const events = parsed.events || [];
    if (!Array.isArray(events)) {
      return { events: [], rawResponse };
    }
    console.log(`Task returned ${events.length} raw events`);
    return { events, rawResponse };
  } catch (error) {
    console.error(`Failed to parse events from task "${task}":`, error);
    return { events: [], rawResponse };
  }
}

/**
 * Step 3: Merge and score all events
 */
async function mergeAndScoreEvents(
  allRawEvents: any[],
  userProfile: string,
  city: string
): Promise<{ events: DiscoveredEvent[]; rawResponse: string }> {
  const eventsJson = JSON.stringify(allRawEvents.slice(0, 100)); // Limit to 100 events max for prompt

  const today = new Date();
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(today.getDate() + 30);
  const dateWindow = `Events must be between ${today.toISOString().split("T")[0]} and ${thirtyDaysLater.toISOString().split("T")[0]} (next 30 days only).`;

  const prompt = `You have been given ${allRawEvents.length} raw event candidates. Your task is to:

1. Filter events to ONLY include those within the next 30 days (${dateWindow})
2. Filter to keep ONLY events in ${city} - the location field MUST contain "${city}" or a clear reference to ${city}. Exclude festivals, events, or venues in other cities.
3. Deduplicate by artist/band (if multiple events feature the same performer, keep only the most relevant one)
4. Limit to maximum 4 events per sourceUrl (if multiple events share the same sourceUrl, keep only the top 4 by relevance)
5. Validate all URLs - only keep events with real, verifiable sourceUrl
6. Score each event (0-100) based on how well it matches this user profile:
${userProfile}
7. Return between 20-30 events maximum, prioritized by score
8. Ensure all events are real and verifiable - do not include hallucinated events

Return a JSON object with an "events" array. Each event must have:
- title
- description (optional)
- date (ISO format: YYYY-MM-DD) - MUST be within next 30 days
- time (optional, HH:MM format)
- location (full address)
- category (optional)
- sourceUrl (valid, verifiable URL)
- imageUrl (optional)
- score (0-100)

Raw events to process:
${eventsJson}`;

  const systemPrompt = `You are an event scoring and deduplication assistant. Return only valid JSON with an "events" array. Only include real, verifiable events.`;

  console.log(`Step 3: Merging and scoring ${allRawEvents.length} events...`);
  const rawResponse = await callPerplexity(
    "sonar-pro",
    systemPrompt,
    prompt,
    0.5 // Lower temperature for more consistent scoring
  );

  // Parse final events
  let jsonContent = rawResponse;
  const jsonMatch =
    rawResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
    rawResponse.match(/```\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonContent = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonContent);
    const events = parsed.events || [];
    if (!Array.isArray(events)) {
      return { events: [], rawResponse };
    }
    console.log(`Merged to ${events.length} final events`);
    return { events, rawResponse };
  } catch (error) {
    console.error("Failed to parse merged events:", error);
    return { events: [], rawResponse };
  }
}

/**
 * Step 4: Repair call if needed
 */
async function repairOrExpandEvents(
  currentEvents: DiscoveredEvent[],
  userProfile: string,
  city: string,
  issue: "too_few" | "broken_json",
  eventSources?: string[]
): Promise<{ events: DiscoveredEvent[]; rawResponse: string }> {
  const instruction =
    issue === "too_few"
      ? currentEvents.length > 0
        ? `You currently have ${currentEvents.length} events, but need 20-30. Add more event candidates that match the user profile.`
        : `No events were found. Please search for events matching the user profile.`
      : `The previous response had invalid JSON. Please fix it and return valid JSON.`;

  const currentEventsText =
    currentEvents.length > 0
      ? `\n\nCurrent events (${currentEvents.length}):\n${JSON.stringify(currentEvents.slice(0, 10), null, 2)}`
      : "";

  const eventSourcesText =
    eventSources && eventSources.length > 0
      ? `\n\nIMPORTANT: The user follows these event sources. Prioritize checking them:\n${eventSources.join("\n")}`
      : "";

  const today = new Date();
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(today.getDate() + 30);
  const dateWindow = `Events must be between ${today.toISOString().split("T")[0]} and ${thirtyDaysLater.toISOString().split("T")[0]} (next 30 days only).`;

  const prompt = `${instruction}

User profile:
${userProfile}

City: ${city}
${dateWindow}
IMPORTANT: Only include events in ${city}. The location field MUST contain "${city}" or a clear reference to ${city}. Exclude festivals, events, or venues in other cities.
${eventSourcesText}${currentEventsText}

Return a JSON object with an "events" array containing 20-30 events. Each event must have:
- title
- description (optional)
- date (ISO format: YYYY-MM-DD) - MUST be within next 30 days
- time (optional, HH:MM format)
- location (full address) - MUST be in ${city}
- category (optional)
- sourceUrl (valid, verifiable URL)
- imageUrl (optional)
- score (0-100)

Only include real, verifiable events. Deduplicate by artist/band. Limit to maximum 4 events per sourceUrl.`;

  const systemPrompt = `You are repairing/expanding event results. Return only valid JSON with an "events" array.`;

  console.log(`Step 4: Repairing/expanding events (issue: ${issue})...`);
  // sonar-pro model automatically enables web search
  const rawResponse = await callPerplexity(
    "sonar-pro",
    systemPrompt,
    prompt,
    0.7
  );

  // Parse repaired events
  let jsonContent = rawResponse;
  const jsonMatch =
    rawResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
    rawResponse.match(/```\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonContent = jsonMatch[1];
  }

  try {
    const parsed = JSON.parse(jsonContent);
    const events = parsed.events || [];
    if (!Array.isArray(events)) {
      return { events: currentEvents, rawResponse }; // Return original if repair fails
    }
    console.log(`Repair returned ${events.length} events`);
    return { events, rawResponse };
  } catch (error) {
    console.error("Failed to parse repaired events:", error);
    return { events: currentEvents, rawResponse }; // Return original if repair fails
  }
}

/**
 * Discover local events based on user profile using multi-step process
 * Returns both parsed events and raw AI responses from all steps
 */
export async function discoverEvents(
  city: string,
  userProfile: string,
  eventSources?: string[]
): Promise<{ events: DiscoveredEvent[]; rawResponse: string }> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error("PERPLEXITY_API_KEY not configured");
  }

  // Truncate profile if it's too long
  const MAX_PROFILE_LENGTH = 15000;
  const truncatedProfile =
    userProfile.length > MAX_PROFILE_LENGTH
      ? userProfile.substring(0, MAX_PROFILE_LENGTH) +
        "\n\n[Profile truncated for length...]"
      : userProfile;

  const allRawResponses: string[] = [];

  try {
    // Step 1: Planning
    const { tasks, rawResponse: planningResponse } = await planEventSearch(
      city,
      truncatedProfile,
      eventSources
    );
    allRawResponses.push(`=== PLANNING ===\n${planningResponse}`);

    // Step 2: Parallel searches
    console.log(`Step 2: Executing ${tasks.length} parallel searches...`);
    const searchResults = await Promise.all(
      tasks.map((task) =>
        searchEventsForTask(task, truncatedProfile, eventSources)
      )
    );

    const allRawEvents: any[] = [];
    searchResults.forEach((result, index) => {
      allRawResponses.push(`=== SEARCH TASK ${index + 1}: ${tasks[index]} ===\n${result.rawResponse}`);
      allRawEvents.push(...result.events);
    });

    console.log(`Collected ${allRawEvents.length} raw events from all searches`);

    if (allRawEvents.length === 0) {
      console.warn("No events found in search phase");
      return { events: [], rawResponse: allRawResponses.join("\n\n") };
    }

    // Step 3: Merge and score
    let finalEvents: DiscoveredEvent[] = [];
    let mergeResponse: string = "";
    let mergeFailed = false;

    try {
      const result = await mergeAndScoreEvents(
        allRawEvents,
        truncatedProfile,
        city
      );
      finalEvents = result.events;
      mergeResponse = result.rawResponse;
    } catch (error) {
      console.error("Merge step failed:", error);
      mergeFailed = true;
      mergeResponse = `Merge failed: ${error}`;
    }

    allRawResponses.push(`=== MERGE & SCORE ===\n${mergeResponse}`);

    // Step 4: Repair if needed
    let events = finalEvents;
    if (mergeFailed || finalEvents.length === 0) {
      console.log("Merge failed or returned no events, attempting repair...");
      const { events: repairedEvents, rawResponse: repairResponse } =
        await repairOrExpandEvents(
          finalEvents,
          truncatedProfile,
          city,
          mergeFailed ? "broken_json" : "too_few",
          eventSources
        );
      allRawResponses.push(
        `=== REPAIR (${mergeFailed ? "broken_json" : "too_few"}) ===\n${repairResponse}`
      );
      events = repairedEvents;
    } else if (finalEvents.length < 15) {
      console.log("Too few events, attempting repair/expansion...");
      const { events: repairedEvents, rawResponse: repairResponse } =
        await repairOrExpandEvents(
          finalEvents,
          truncatedProfile,
          city,
          "too_few",
          eventSources
        );
      allRawResponses.push(`=== REPAIR (too_few) ===\n${repairResponse}`);
      events = repairedEvents;
    }

    // Helper function to normalize URLs for grouping
    const normalizeSourceUrl = (url: string): string => {
      try {
        const urlObj = new URL(url);
        // Normalize: remove www, trailing slash, and use https
        const hostname = urlObj.hostname.replace(/^www\./, "");
        const pathname = urlObj.pathname.replace(/\/$/, "") || "/";
        // Group by domain + first path segment (e.g., teatrulgerman.ro/program and teatrulgerman.ro/ro/program are different sources)
        // But teatrulgerman.ro/ and teatrulgerman.ro are the same
        const basePath = pathname.split("/").slice(0, 2).join("/"); // Take first 2 path segments
        return `https://${hostname}${basePath}`;
      } catch {
        // If URL parsing fails, try simple normalization
        return url
          .toLowerCase()
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "")
          .replace(/\/$/, "");
      }
    };

    // Post-processing: Filter by date, location, and limit per source
    const today = new Date();
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);

    // Filter events to next 30 days
    const eventsInDateRange = events.filter((e) => {
      if (!e.date) return false;
      const eventDate = new Date(e.date);
      return eventDate >= today && eventDate <= thirtyDaysLater;
    });

    console.log(
      `Filtered ${events.length} events to ${eventsInDateRange.length} events within 30 days`
    );

    // Filter events by location - must be in the specified city
    const cityLower = city.toLowerCase().trim();
    const eventsInCity = eventsInDateRange.filter((e) => {
      if (!e.location) return false;
      const locationLower = e.location.toLowerCase();
      // Check if location contains the city name
      // Also handle common variations (e.g., "Timisoara" vs "Timișoara")
      const cityVariations = [
        cityLower,
        cityLower.replace(/ș/g, "s").replace(/ț/g, "t"), // Remove diacritics
        cityLower.replace(/s/g, "ș").replace(/t/g, "ț"), // Add diacritics
      ];
      return cityVariations.some((variation) => locationLower.includes(variation));
    });

    console.log(
      `Filtered ${eventsInDateRange.length} events to ${eventsInCity.length} events in ${city}`
    );

    // Sort by score (descending) to prioritize higher-scored events
    const sortedEvents = [...eventsInCity].sort((a, b) => {
      const scoreA = a.score || 0;
      const scoreB = b.score || 0;
      return scoreB - scoreA; // Descending order
    });

    // Filter out events with score below 50
    const eventsAboveThreshold = sortedEvents.filter((e) => {
      const score = e.score || 0;
      if (score < 50) {
        console.log(
          `Filtering out event with score below 50: "${e.title}" (score: ${score})`
        );
        return false;
      }
      return true;
    });

    console.log(
      `Filtered ${sortedEvents.length} events to ${eventsAboveThreshold.length} events with score >= 50`
    );

    // Limit to 4 events per normalized sourceUrl, keeping the top 4 by score
    const sourceUrlCounts = new Map<string, number>();
    const limitedBySource = eventsAboveThreshold.filter((e) => {
      if (!e.sourceUrl) return false;
      const normalizedUrl = normalizeSourceUrl(e.sourceUrl);
      const count = sourceUrlCounts.get(normalizedUrl) || 0;
      if (count >= 4) {
        console.log(
          `Limiting events from source: ${normalizedUrl} (original: ${e.sourceUrl}, already have ${count} events, score: ${e.score})`
        );
        return false;
      }
      sourceUrlCounts.set(normalizedUrl, count + 1);
      return true;
    });

    console.log(
      `Limited to ${limitedBySource.length} events (max 4 per source, sorted by score)`
    );

    // Limit to 4-5 events per location, keeping the top 4-5 by score
    const locationCounts = new Map<string, number>();
    const limitedEvents = limitedBySource.filter((e) => {
      if (!e.location) return false;
      const locationNormalized = e.location.toLowerCase().trim();
      const count = locationCounts.get(locationNormalized) || 0;
      const maxPerLocation = 5; // Allow up to 5 events per location
      if (count >= maxPerLocation) {
        console.log(
          `Limiting events at location: ${e.location} (already have ${count} events, score: ${e.score})`
        );
        return false;
      }
      locationCounts.set(locationNormalized, count + 1);
      return true;
    });

    console.log(
      `Limited to ${limitedEvents.length} events (max 5 per location, sorted by score)`
    );

    // Validate events have required fields
    const validEvents = limitedEvents.filter(
      (e) => e.title && e.sourceUrl && e.location && e.date
    );

    console.log(`Final result: ${validEvents.length} valid events`);
    return {
      events: validEvents,
      rawResponse: allRawResponses.join("\n\n"),
    };
  } catch (error: any) {
    console.error("Error in multi-step event discovery:", error);

    // Provide specific error messages
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      const message =
        data?.error?.message ||
        data?.message ||
        JSON.stringify(data) ||
        "API error";

      if (status === 401 || status === 403) {
        throw new Error(
          `Invalid Perplexity API key (${status}). Please check your PERPLEXITY_API_KEY in .env`
        );
      }

      throw new Error(`Perplexity API error (${status}): ${message}`);
    } else if (error.request) {
      throw new Error(
        "No response from Perplexity API. Check your internet connection."
      );
    } else {
      throw new Error(
        `Failed to discover events: ${error.message || "Unknown error"}`
      );
    }
  }
}
