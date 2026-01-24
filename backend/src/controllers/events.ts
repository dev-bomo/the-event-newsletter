import { prisma } from "../lib/prisma.js";
import { discoverEvents } from "../services/ai.js";
import { discoverEventsFromSource } from "../services/eventSources.js";

export async function discoverEventsForUser(userId: string): Promise<{
  events: Awaited<ReturnType<typeof prisma.event.findMany>>;
  rawResponses: string[];
}> {
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

  // Get event sources for the general search
  const eventSources = await prisma.eventSource.findMany({
    where: { userId },
  });
  const eventSourceUrls = eventSources.map((source) => source.url);

  // Discover events using AI with user profile and event sources
  console.log("Calling discoverEvents with user profile...");
  const { events: discoveredEvents, rawResponse: generalSearchRawResponse } =
    await discoverEvents(user.city, user.profile, eventSourceUrls);
  const generalSearchCount = discoveredEvents.length;
  console.log("Discovered", generalSearchCount, "events from general search");

  // Collect raw responses for debugging
  const rawResponses: string[] = [generalSearchRawResponse];

  // Also discover events from user's custom event sources (individual source crawling)
  // Note: eventSources was already fetched above for the general search

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
        // Note: discoverEventsFromSource doesn't return raw response yet
        // We can add that later if needed
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

  // Filter out events with missing required fields (sourceUrl and location are required)
  const validEvents = discoveredEvents.filter((event) => {
    if (
      !event.sourceUrl ||
      typeof event.sourceUrl !== "string" ||
      event.sourceUrl.trim() === ""
    ) {
      console.warn(
        "Skipping event with missing/invalid sourceUrl:",
        event.title
      );
      return false;
    }
    if (
      !event.location ||
      typeof event.location !== "string" ||
      event.location.trim() === ""
    ) {
      console.warn(
        "Skipping event with missing/invalid location:",
        event.title
      );
      return false;
    }
    if (
      !event.title ||
      typeof event.title !== "string" ||
      event.title.trim() === ""
    ) {
      console.warn("Skipping event with missing/invalid title");
      return false;
    }
    return true;
  });

  const removedByValidation = discoveredEvents.length - validEvents.length;
  console.log(
    `Filtered valid events: ${discoveredEvents.length} -> ${validEvents.length} (removed ${removedByValidation} due to missing fields)`
  );

  // Helper function to normalize title for comparison
  const normalizeTitle = (title: string): string => {
    return title.trim().toLowerCase().replace(/\s+/g, " ");
  };

  // Store events in database (deduplicate by title only)
  const uniqueEvents = validEvents.reduce((acc, event) => {
    const normalizedTitle = normalizeTitle(event.title || "");

    // Check if we've already seen a title that matches (case-insensitive)
    const isDuplicate = acc.find((e: any) => {
      const existingNormalizedTitle = normalizeTitle(e.title || "");
      return normalizedTitle && existingNormalizedTitle === normalizedTitle;
    });

    if (!isDuplicate) {
      acc.push(event);
    } else {
      console.log(`Skipping duplicate event by title: "${event.title}"`);
    }
    return acc;
  }, [] as typeof validEvents);

  const removedByDedup = validEvents.length - uniqueEvents.length;
  console.log(
    `Deduplicated events (by title): ${validEvents.length} -> ${uniqueEvents.length} (removed ${removedByDedup} duplicates)`
  );

  // Ensure all events have scores (default to 50 if missing)
  const eventsWithScores = uniqueEvents.map((event) => ({
    ...event,
    score: event.score !== undefined ? event.score : 50,
  }));

  // Sort events by score (highest first)
  const sortedEvents = eventsWithScores.sort((a, b) => b.score - a.score);

  // Log all events with scores before trimming
  console.log(
    `Events sorted by score (${sortedEvents.length} total):`,
    sortedEvents.map((e) => `"${e.title}" (score: ${e.score})`).join(", ")
  );

  // Limit to 20
  const top20Events = sortedEvents.slice(0, 20);

  // Ensure we have at least 12 events if possible, but don't exceed 20
  const finalEvents =
    top20Events.length >= 12 ? top20Events : sortedEvents.slice(0, 12);

  const removedByLimit = sortedEvents.length - finalEvents.length;
  if (removedByLimit > 0) {
    console.log(
      `Removed ${removedByLimit} events due to limit (kept top ${finalEvents.length}):`
    );
    const removed = sortedEvents.slice(finalEvents.length);
    removed.forEach((e) => {
      console.log(`  - "${e.title}" (score: ${e.score})`);
    });
  }

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

  if (finalEvents.length === 0) {
    throw new Error(
      "No valid events found to save. All events were missing required fields (sourceUrl, location, or title)."
    );
  }

  // Create events (no longer using sourceUrl as unique identifier)
  // Check for existing events with same title, date, and location to avoid true duplicates
  const events = await Promise.all(
    finalEvents.map(async (event) => {
      // Check if an event with the same title, date, and location already exists
      const existing = await prisma.event.findFirst({
        where: {
          title: event.title!,
          date: new Date(event.date),
          location: event.location!,
        },
      });

      if (existing) {
        // Update the existing event with new score and sourceUrl if different
        return prisma.event.update({
          where: { id: existing.id },
          data: {
            description: event.description || existing.description,
            time: event.time || existing.time,
            category: event.category || existing.category,
            sourceUrl: event.sourceUrl!, // Update sourceUrl in case it's different
            imageUrl: event.imageUrl || existing.imageUrl,
            score: Math.round(event.score), // Update score
          },
        });
      } else {
        // Create new event
        return prisma.event.create({
          data: {
            title: event.title!,
            description: event.description || null,
            date: new Date(event.date),
            time: event.time || null,
            location: event.location!,
            category: event.category || null,
            sourceUrl: event.sourceUrl!,
            imageUrl: event.imageUrl || null,
            score: Math.round(event.score),
          },
        });
      }
    })
  );

  console.log(
    `Created/updated ${events.length} events from ${finalEvents.length} discovered events`
  );

  return { events, rawResponses };
}
