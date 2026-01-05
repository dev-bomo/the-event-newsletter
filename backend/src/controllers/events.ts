import { prisma } from "../lib/prisma.js";
import { discoverEvents } from "../services/ai.js";
import { discoverEventsFromSource } from "../services/eventSources.js";

export async function discoverEventsForUser(userId: string) {
  console.log("discoverEventsForUser called for userId:", userId);

  // Get user and preferences
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { preferences: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.city) {
    throw new Error("User city not set. Please set your city in preferences.");
  }

  if (!user.preferences) {
    throw new Error(
      "User preferences not set. Please crawl your profiles first to extract preferences."
    );
  }

  // Parse preferences (they're stored as JSON strings in SQLite)
  const parseArray = (str: string): string[] => {
    try {
      return JSON.parse(str || "[]");
    } catch (error) {
      console.error("Error parsing preference array:", error);
      return [];
    }
  };

  const preferences = {
    interests: parseArray(user.preferences.interests),
    genres: parseArray(user.preferences.genres),
    eventTypes: parseArray(user.preferences.eventTypes),
    venues: parseArray(user.preferences.venues),
    artists: parseArray(user.preferences.artists),
  };

  console.log("User preferences:", {
    city: user.city,
    interestsCount: preferences.interests.length,
    genresCount: preferences.genres.length,
    eventTypesCount: preferences.eventTypes.length,
  });

  // Discover events using AI (general search)
  console.log("Calling discoverEvents...");
  const discoveredEvents = await discoverEvents(user.city, preferences);
  const generalSearchCount = discoveredEvents.length;
  console.log("Discovered", generalSearchCount, "events from general search");

  // Also discover events from user's custom event sources
  const eventSources = await prisma.eventSource.findMany({
    where: { userId },
  });

  let customSourceCount = 0;
  if (eventSources.length > 0) {
    console.log(`Found ${eventSources.length} custom event sources`);
    for (const source of eventSources) {
      try {
        const sourceEvents = await discoverEventsFromSource(
          source.url,
          source.name || undefined
        );
        console.log(
          `Discovered ${sourceEvents.length} events from ${source.url}`
        );
        discoveredEvents.push(...sourceEvents);
        customSourceCount += sourceEvents.length;
      } catch (error: any) {
        console.error(
          `Error discovering events from source ${source.url}:`,
          error.message
        );
        // Continue with other sources
      }
    }
  }

  console.log(
    `Total discovered events: ${discoveredEvents.length} (${generalSearchCount} from general search, ${customSourceCount} from custom sources)`
  );

  // Store events in database (deduplicate by sourceUrl first)
  const uniqueEvents = discoveredEvents.reduce((acc, event) => {
    // Check if we've already seen this sourceUrl
    if (!acc.find((e: any) => e.sourceUrl === event.sourceUrl)) {
      acc.push(event);
    }
    return acc;
  }, [] as typeof discoveredEvents);

  console.log(
    "Deduplicated events:",
    discoveredEvents.length,
    "->",
    uniqueEvents.length
  );

  const events = await Promise.all(
    uniqueEvents.map((event) =>
      prisma.event.upsert({
        where: { sourceUrl: event.sourceUrl },
        create: {
          title: event.title,
          description: event.description,
          date: new Date(event.date),
          time: event.time,
          location: event.location,
          category: event.category,
          sourceUrl: event.sourceUrl,
          imageUrl: event.imageUrl,
        },
        update: {
          title: event.title,
          description: event.description,
          date: new Date(event.date),
          time: event.time,
          location: event.location,
          category: event.category,
          imageUrl: event.imageUrl,
        },
      })
    )
  );

  return events;
}
