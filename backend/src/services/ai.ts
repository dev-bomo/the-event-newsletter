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
  organizer?: string; // For "hate this" exclusions
  artist?: string; // For "hate this" exclusions
  venue?: string; // For "hate this" exclusions
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

IMPORTANT: Return plain text only. Do not use markdown formatting (no **, no *, no code blocks, etc.). Just write natural, flowing text. Do not include any meta-commentary or explanation of what you did—output only the profile text.`;

  try {
    const response = await axios.post(
      PERPLEXITY_API_URL,
      {
        model: "sonar-reasoning-pro",
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
  const sourcesList = Array.isArray(eventSources) ? eventSources : [];
  const eventSourcesText =
    sourcesList.length > 0
      ? `\n\nPages they normally access to find events are:\n${sourcesList.join(
          "\n"
        )}`
      : "";

  const prompt = `You will be given a user profile for event discovery:

User profile:
${userProfile}${eventSourcesText}

City: ${city}
Date window: Next 30 days

Your task is to create a plan for finding events. Break down the search into 5-6 specific tasks or sites to query. Each task should be a specific search query or website/source to check.

Return a JSON object with a "tasks" array. Each task should be a string describing what to search for or which site to query.

Return exactly 5-6 tasks, no more, no less.`;

  const systemPrompt = `You are a planning assistant for event discovery. Return only valid JSON with a "tasks" array containing 5-6 search tasks. Do not include any explanation, reasoning, or commentary—output only the JSON object, no preamble or postamble.`;

  console.log("Step 1: Planning event search...");
  const rawResponse = await callPerplexity(
    "sonar-reasoning-pro",
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
    return { tasks: [], rawResponse };
  }
}

/**
 * Step 2: Parallel search calls for each task
 */
async function searchEventsForTask(
  task: string,
  city: string,
  eventSources?: string[]
): Promise<{ events: any[]; rawResponse: string }> {
  const sourcesList = Array.isArray(eventSources) ? eventSources : [];
  const eventSourcesText =
    sourcesList.length > 0
      ? `\n\nIMPORTANT: The user follows these event sources. If this task relates to any of these sources, prioritize checking them:\n${sourcesList.join(
          "\n"
        )}`
      : "";

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(today.getDate() + 30);
  const dateWindow = `Events must start from ${
    tomorrow.toISOString().split("T")[0]
  } (tomorrow) through ${
    thirtyDaysLater.toISOString().split("T")[0]
  }. Do NOT include events happening today or in the past.`;

  const prompt = `From this site/search: "${task}"

Extract raw event candidates as simple objects. Never return more than 9 events from any one task.

${dateWindow}
${eventSourcesText}

DEDUPLICATE before returning: If titles are very similar remove the duplicates. Do this even if the dates are not the same.

For each event, return:
- title
- description (optional)
- date (ISO format: YYYY-MM-DD) - MUST be within the next 30 days
- time (optional, HH:MM format)
- location (full address - MUST include the city name, e.g. "Venue Name, ${city}" or "Street, ${city}, Country")
- category (optional)
- sourceUrl (URL to the event page or source)
- organizer (optional): event organizer or promoter name
- artist (optional): main artist, band, or performer name
- venue (optional): venue or location name (e.g. "Blue Note", "Lincoln Center")

Return a JSON object with an "events" array. Only include events starting tomorrow or later. Exclude events happening today or in the past.

CRITICAL - NO HALLUCINATION: Only extract events you actually found through web search. Do NOT invent, fabricate, or guess events. If you cannot find enough real events, return fewer or an empty array. A short list of real events is always better than any fake ones.`;

  const systemPrompt = `You are extracting raw event data from web search. Return only valid JSON with an "events" array. Do not score. Before returning, deduplicate by title: if two events have titles sharing 3+ words (each word > 3 chars), keep only one. Never include events from the past. NEVER invent or hallucinate events - only include events you actually found. Do not include any explanation, reasoning, or commentary—output only the JSON object, no preamble or postamble.`;

  console.log(`Step 2: Searching for task: "${task.substring(0, 50)}..."`);
  const rawResponse = await callPerplexity(
    "sonar-reasoning-pro",
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
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(today.getDate() + 30);
  const dateWindow = `Events must start from ${
    tomorrow.toISOString().split("T")[0]
  } (tomorrow) through ${thirtyDaysLater.toISOString().split("T")[0]}.`;

  const prompt = `You have been given ${allRawEvents.length} raw event candidates. Your task is to:

1. Filter events to ONLY include those starting tomorrow or later (${dateWindow}). Exclude ALL events happening today or in the past.
2. Filter to keep ONLY events in ${city}. The location field MUST include the city name (e.g. "Venue, ${city}" or "Address, ${city}, Romania"). Exclude festivals, events, or venues in other cities.
3. Deduplicate by artist/band (if multiple events feature the same performer, keep only the most relevant one)
4. Limit to maximum 4 events per sourceUrl (if multiple events share the same sourceUrl, keep only the top 4 by relevance)
5. Validate all URLs - only keep events with real, verifiable sourceUrl
6. Score each event (0-100) based on how well it matches this user profile:
${userProfile}
7. Return between 20-30 events maximum, prioritized by score
8. CRITICAL - NO HALLUCINATION: Only keep events from the raw candidates provided that have real, verifiable sourceUrl. Remove any that appear fabricated or that you cannot verify. Do NOT add or invent events. If few candidates are real, return fewer events.

Return a JSON object with an "events" array. Each event must have:
- title
- description (optional)
- date (ISO format: YYYY-MM-DD) - MUST be tomorrow or later
- time (optional, HH:MM format)
- location (full address - MUST include "${city}", e.g. "Venue, ${city}" or "Address, ${city}")
- category (optional)
- sourceUrl (valid, verifiable URL)
- imageUrl (optional)
- score (0-100)
- organizer (optional): event organizer or promoter
- artist (optional): main artist, band, or performer
- venue (optional): venue name

Raw events to process:
${eventsJson}`;

  const systemPrompt = `You are an event scoring and deduplication assistant. Return only valid JSON with an "events" array. Only include real, verifiable events from the raw candidates. Never invent or hallucinate events. Never include events from the past. Do not include any explanation, reasoning, or commentary—output only the JSON object, no preamble or postamble.`;

  console.log(`Step 3: Merging and scoring ${allRawEvents.length} events...`);
  const rawResponse = await callPerplexity(
    "sonar-reasoning-pro",
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
        ? `You currently have ${currentEvents.length} events, but need 20-30. Search for more real events that match the user profile. CRITICAL: Only add events you actually find through web search with verifiable URLs. If you cannot find more real events, return the current list as-is. NEVER invent or hallucinate events - it is better to return fewer real events than to include any fake ones.`
        : `No events were found. Search for events matching the user profile. CRITICAL: Only return events you actually find through web search with verifiable URLs. If you cannot find any real events, return an empty array. NEVER invent or hallucinate events.`
      : `The previous response had invalid JSON. Please fix it and return valid JSON.`;

  const currentEventsText =
    currentEvents.length > 0
      ? `\n\nCurrent events (${currentEvents.length}):\n${JSON.stringify(
          currentEvents.slice(0, 10),
          null,
          2
        )}`
      : "";

  const sourcesList = Array.isArray(eventSources) ? eventSources : [];
  const eventSourcesText =
    sourcesList.length > 0
      ? `\n\nIMPORTANT: The user follows these event sources. Prioritize checking them:\n${sourcesList.join(
          "\n"
        )}`
      : "";

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const thirtyDaysLater = new Date(today);
  thirtyDaysLater.setDate(today.getDate() + 30);
  const dateWindow = `Events must start from ${
    tomorrow.toISOString().split("T")[0]
  } (tomorrow) through ${
    thirtyDaysLater.toISOString().split("T")[0]
  }. Do NOT include events happening today or in the past.`;

  const prompt = `${instruction}

User profile:
${userProfile}

City: ${city}
${dateWindow}
IMPORTANT: Only include events in ${city}. The location field MUST include the city name (e.g. "Venue, ${city}" or "Address, ${city}, Romania"). Exclude festivals, events, or venues in other cities.
${eventSourcesText}${currentEventsText}

Return a JSON object with an "events" array (20-30 events if you can find that many). Each event must have:
- title
- description (optional)
- date (ISO format: YYYY-MM-DD) - MUST be tomorrow or later
- time (optional, HH:MM format)
- location (full address - MUST include "${city}", e.g. "Venue, ${city}" or "Address, ${city}")
- category (optional)
- sourceUrl (valid, verifiable URL)
- imageUrl (optional)
- score (0-100)
- organizer (optional): event organizer or promoter
- artist (optional): main artist, band, or performer
- venue (optional): venue name

Only include real, verifiable events you found through web search. Deduplicate by artist/band. Limit to maximum 4 events per sourceUrl. NEVER invent events - if few exist, return fewer.`;

  const systemPrompt = `You are repairing/expanding event results. Return only valid JSON with an "events" array. Never invent or hallucinate events - only include events you actually found. Never include events from the past. Do not include any explanation, reasoning, or commentary—output only the JSON object, no preamble or postamble.`;

  console.log(`Step 4: Repairing/expanding events (issue: ${issue})...`);
  const rawResponse = await callPerplexity(
    "sonar-reasoning-pro",
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
        searchEventsForTask(task, city, eventSources)
      )
    );

    const allRawEvents: any[] = [];
    searchResults.forEach((result, index) => {
      allRawResponses.push(
        `=== SEARCH TASK ${index + 1}: ${tasks[index]} ===\n${
          result.rawResponse
        }`
      );
      allRawEvents.push(...result.events);
    });

    console.log(
      `Collected ${allRawEvents.length} raw events from all searches`
    );

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
        `=== REPAIR (${
          mergeFailed ? "broken_json" : "too_few"
        }) ===\n${repairResponse}`
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

    // Post-processing: Filter by date (tomorrow onward), location, and limit per source
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);

    // Filter events to tomorrow through 30 days (exclude same-day)
    const eventsInDateRange = events.filter((e) => {
      if (!e.date) {
        console.log(`[date filter] excluded "${e.title}": no date`);
        return false;
      }
      const eventDate = new Date(e.date);
      eventDate.setHours(0, 0, 0, 0);
      if (eventDate < tomorrow) {
        console.log(
          `[date filter] excluded "${e.title}": date ${e.date} is today or in the past`
        );
        return false;
      }
      if (eventDate > thirtyDaysLater) {
        console.log(
          `[date filter] excluded "${e.title}": date ${e.date} is after 30 days`
        );
        return false;
      }
      return true;
    });

    console.log(
      `Filtered ${events.length} events to ${eventsInDateRange.length} events (tomorrow through 30 days)`
    );

    // Filter events by city - check location, venue, and description for city name.
    // Normalize diacritics so "Timisoara" matches "Timișoara" (ș = s with comma below, can be different code points).
    const normalizeForCityMatch = (s: string): string => {
      return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // strip combining diacritical marks (e.g. ș → s, ț → t)
        .replace(/\u0219/g, "s") // ș (s with comma below) if not decomposed
        .replace(/\u021b/g, "t"); // ț (t with comma below) if not decomposed
    };
    const cityNormalized = normalizeForCityMatch(city);
    const textContainsCity = (text: string | null | undefined): boolean => {
      if (!text || typeof text !== "string") return false;
      return normalizeForCityMatch(text).includes(cityNormalized);
    };
    let eventsInCity = eventsInDateRange.filter((e) => {
      const inLocation = textContainsCity(e.location);
      const inVenue = textContainsCity(e.venue);
      const inDescription = textContainsCity(e.description);
      const keep = inLocation || inVenue || inDescription;
      if (!keep) {
        const loc = (e.location || "(empty)").slice(0, 50);
        const ven = (e.venue || "(empty)").slice(0, 30);
        const desc = (e.description || "(empty)").slice(0, 30);
        console.log(
          `[city filter] excluded "${e.title}": city "${city}" not in location="${loc}" venue="${ven}" description="${desc}"`
        );
      }
      return keep;
    });

    // If city filter would remove everything, skip it (merge/repair were already scoped to city)
    if (eventsInCity.length === 0 && eventsInDateRange.length > 0) {
      console.log(
        `[city filter] would remove all ${eventsInDateRange.length} events (no location/venue/description contained "${city}"); keeping them as fallback`
      );
      eventsInCity = eventsInDateRange;
    }

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
      const score = e.score ?? 0;
      if (score < 50) {
        console.log(
          `[score filter] excluded "${e.title}": score ${score} < 50`
        );
        return false;
      }
      return true;
    });

    console.log(
      `Filtered ${sortedEvents.length} events to ${eventsAboveThreshold.length} events with score >= 50`
    );

    // Limit events when venue or artist has >4 events sharing the same "significant" name
    // Key = words longer than 3 chars, normalized. Only apply when key has >3 such words (substantial name).
    const getSignificantWordsKey = (
      text: string | null | undefined
    ): string | null => {
      if (!text || typeof text !== "string") return null;
      const words = text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3);
      if (words.length <= 3) return null; // need more than 3 words > 3 chars
      return words.sort().join(" ");
    };
    const MAX_PER_VENUE_OR_ARTIST = 4;
    const toRemoveByVenueArtist = new Set<number>();
    for (const field of ["venue", "artist"] as const) {
      const groups = new Map<
        string,
        Array<{ e: (typeof eventsAboveThreshold)[0]; i: number }>
      >();
      for (let i = 0; i < eventsAboveThreshold.length; i++) {
        const e = eventsAboveThreshold[i];
        const key = getSignificantWordsKey(e[field]);
        if (!key) continue;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push({ e, i });
      }
      for (const [key, group] of groups) {
        if (group.length <= MAX_PER_VENUE_OR_ARTIST) continue;
        const sorted = group.sort(
          (a, b) => (b.e.score ?? 0) - (a.e.score ?? 0)
        );
        for (let j = MAX_PER_VENUE_OR_ARTIST; j < sorted.length; j++) {
          const { e: item, i: idx } = sorted[j];
          toRemoveByVenueArtist.add(idx);
          console.log(
            `[venue/artist limit] excluded "${item.title}": >${MAX_PER_VENUE_OR_ARTIST} events with same ${field} (key="${key}"), kept top by score`
          );
        }
      }
    }
    const limitedByVenueArtist = eventsAboveThreshold.filter(
      (_, i) => !toRemoveByVenueArtist.has(i)
    );

    console.log(
      `Limited ${eventsAboveThreshold.length} to ${limitedByVenueArtist.length} events (max ${MAX_PER_VENUE_OR_ARTIST} per venue/artist with 4+ significant words)`
    );

    // Limit to 4 events per normalized sourceUrl, keeping the top 4 by score
    const sourceUrlCounts = new Map<string, number>();
    const limitedBySource = limitedByVenueArtist.filter((e) => {
      if (!e.sourceUrl) return false;
      const normalizedUrl = normalizeSourceUrl(e.sourceUrl);
      const count = sourceUrlCounts.get(normalizedUrl) || 0;
      if (count >= 4) {
        console.log(
          `[source limit] excluded "${e.title}": already ${count} events from source ${normalizedUrl} (max 4)`
        );
        return false;
      }
      sourceUrlCounts.set(normalizedUrl, count + 1);
      return true;
    });

    console.log(
      `Limited to ${limitedBySource.length} events (max 4 per source)`
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
          `[location limit] excluded "${e.title}": already ${count} events at location "${e.location}" (max 5)`
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
    const validEvents = limitedEvents.filter((e) => {
      const missing: string[] = [];
      if (!e.title) missing.push("title");
      if (!e.sourceUrl) missing.push("sourceUrl");
      if (!e.location) missing.push("location");
      if (!e.date) missing.push("date");
      if (missing.length > 0) {
        console.log(
          `[required fields] excluded "${
            e.title || "(no title)"
          }": missing ${missing.join(", ")}`
        );
        return false;
      }
      return true;
    });

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
