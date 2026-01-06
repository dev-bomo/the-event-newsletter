import { prisma } from "../lib/prisma.js";
import { discoverEvents } from "../services/ai.js";
import { discoverEventsFromSource } from "../services/eventSources.js";

export async function discoverEventsForUser(userId: string) {
  console.log("discoverEventsForUser called for userId:", userId);

  // Get user with profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.city) {
    throw new Error("User city not set. Please set your city in preferences.");
  }

  if (!user.profile) {
    throw new Error(
      "User profile not generated. Please update your preferences first to generate a profile."
    );
  }

  console.log("Using user profile for event discovery");

  // Discover events using AI with user profile
  console.log("Calling discoverEvents with user profile...");
  const discoveredEvents = await discoverEvents(user.city, user.profile);
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
          source.name || undefined,
          user.profile || undefined
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

  // Ensure all events have scores (default to 50 if missing)
  const eventsWithScores = uniqueEvents.map((event) => ({
    ...event,
    score: event.score !== undefined ? event.score : 50,
  }));

  // Sort events by score (highest first) and limit to 20
  const sortedEvents = eventsWithScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 20);

  // Ensure we have at least 12 events if possible, but don't exceed 20
  const finalEvents =
    sortedEvents.length >= 12 ? sortedEvents : eventsWithScores.slice(0, 12);

  console.log(
    `Selected ${finalEvents.length} events (sorted by score, range: ${
      finalEvents.length >= 1
        ? Math.min(...finalEvents.map((e) => e.score))
        : "N/A"
    }-${
      finalEvents.length >= 1
        ? Math.max(...finalEvents.map((e) => e.score))
        : "N/A"
    })`
  );

  const events = await Promise.all(
    finalEvents.map((event) =>
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
          score: Math.round(event.score), // Round to integer
        },
        update: {
          title: event.title,
          description: event.description,
          date: new Date(event.date),
          time: event.time,
          location: event.location,
          category: event.category,
          imageUrl: event.imageUrl,
          score: Math.round(event.score), // Update score as well
        },
      })
    )
  );

  return events;
}
