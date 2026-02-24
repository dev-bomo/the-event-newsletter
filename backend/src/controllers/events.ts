import { prisma } from "../lib/prisma.js";
import { discoverEvents } from "../services/ai.js";
import { discoverEventsFromSource } from "../services/eventSources.js";
import { updateUserProfile } from "./preferences.js";

export async function discoverEventsForUser(userId: string): Promise<{
  events: Awaited<ReturnType<typeof prisma.event.findMany>>;
  rawResponses: string[];
}> {
  console.log("discoverEventsForUser called for userId:", userId);

  // Get user with profile
  let user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.city) {
    throw new Error("User city not set. Please set your city in preferences.");
  }

  // Refresh profile if missing or dirty (e.g. after preference/city/source changes)
  if (!user.profile || user.profileIsDirty) {
    await updateUserProfile(userId);
    user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new Error("User not found");
  }

  if (!user.profile) {
    throw new Error(
      "User profile not generated. Please update your preferences first to generate a profile."
    );
  }

  console.log("Using user profile for event discovery");

  // Get user's "hates" (exclusions: organizer, artist, venue)
  const eventHates = await prisma.eventHate.findMany({
    where: { userId },
  });
  const hatesByType = {
    organizer: eventHates.filter((h) => h.type === "organizer").map((h) => h.value.toLowerCase()),
    artist: eventHates.filter((h) => h.type === "artist").map((h) => h.value.toLowerCase()),
    venue: eventHates.filter((h) => h.type === "venue").map((h) => h.value.toLowerCase()),
  };
  const hasHates = eventHates.length > 0;
  if (hasHates) {
    console.log(`User has ${eventHates.length} exclusions:`, eventHates.map((h) => `${h.type}=${h.value}`));
  }

  // Build effective profile: base profile + hates (so AI takes them into account)
  // Group by type: organizer/artist/venue = exclude; event = penalize similar
  let effectiveProfile = user.profile;
  if (hasHates) {
    const byType = {
      organizer: eventHates.filter((h) => h.type === "organizer").map((h) => h.value),
      artist: eventHates.filter((h) => h.type === "artist").map((h) => h.value),
      venue: eventHates.filter((h) => h.type === "venue").map((h) => h.value),
      event: eventHates.filter((h) => h.type === "event").map((h) => h.value),
    };
    const lines: string[] = [];
    if (byType.organizer.length) lines.push(`Organizers to exclude: ${byType.organizer.join(", ")}`);
    if (byType.artist.length) lines.push(`Artists to exclude: ${byType.artist.join(", ")}`);
    if (byType.venue.length) lines.push(`Venues to exclude: ${byType.venue.join(", ")}`);
    if (byType.event.length) {
      const eventHatesOrdered = eventHates
        .filter((h) => h.type === "event")
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 15);
      const eventPhrases = eventHatesOrdered.map((h) =>
        h.value.includes("|") ? h.value.split("|")[0].trim() : h.value
      );
      if (eventPhrases.length) {
        lines.push(`Events the user disliked (lower the relevance score by 15-20 points for similar events - same/similar title, venue, artist, or type): ${eventPhrases.join("; ")}`);
      }
    }
    const hatesText = lines.join("\n");
    effectiveProfile = `${user.profile}\n\nEXCLUSIONS AND PREFERENCES:\n${hatesText}`;
    console.log("Appended hates to profile for AI context");
  }

  // Get event sources for the general search
  const eventSources = await prisma.eventSource.findMany({
    where: { userId },
  });
  const eventSourceUrls = eventSources.map((source) => source.url);

  // Discover events using AI with user profile and event sources
  console.log("Calling discoverEvents with user profile...");
  const { events: discoveredEvents, rawResponse: generalSearchRawResponse } =
    await discoverEvents(user.city!, effectiveProfile, eventSourceUrls);
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
          effectiveProfile
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

  // Filter out events with missing required fields, past dates, and same-day events
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

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
    // Filter out events on or before today (only include events starting tomorrow onward)
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    if (eventDate < tomorrow) {
      console.warn(
        "Skipping event (past or same-day):",
        event.title,
        event.date
      );
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

  // Filter out events matching user's hates (organizer, artist, venue)
  let eventsAfterHates = sortedEvents;
  if (hasHates) {
    eventsAfterHates = sortedEvents.filter((event) => {
      if (hatesByType.organizer.length > 0 && event.organizer) {
        const orgLower = event.organizer.toLowerCase();
        if (hatesByType.organizer.some((h) => orgLower.includes(h) || h.includes(orgLower))) {
          console.log(`Excluded by organizer hate: "${event.title}" (organizer: ${event.organizer})`);
          return false;
        }
      }
      if (hatesByType.artist.length > 0 && event.artist) {
        const artistLower = event.artist.toLowerCase();
        if (hatesByType.artist.some((h) => artistLower.includes(h) || h.includes(artistLower))) {
          console.log(`Excluded by artist hate: "${event.title}" (artist: ${event.artist})`);
          return false;
        }
      }
      if (hatesByType.venue.length > 0) {
        const venueLower = (event.venue || event.location || "").toLowerCase();
        if (hatesByType.venue.some((h) => venueLower.includes(h) || h.includes(venueLower))) {
          console.log(`Excluded by venue hate: "${event.title}" (venue/location: ${event.venue || event.location})`);
          return false;
        }
      }
      return true;
    });
    console.log(`After exclusions: ${sortedEvents.length} -> ${eventsAfterHates.length} events`);
  }

  // Log all events with scores before trimming
  console.log(
    `Events sorted by score (${eventsAfterHates.length} total after exclusions):`,
    eventsAfterHates.map((e) => `"${e.title}" (score: ${e.score})`).join(", ")
  );

  // Limit to max 6 per category (remove lowest-scored in each category)
  const MAX_PER_CATEGORY = 6;
  const categoryGroups = new Map<string, typeof eventsAfterHates>();
  for (const event of eventsAfterHates) {
    const cat = event.category?.trim() || "(uncategorized)";
    if (!categoryGroups.has(cat)) categoryGroups.set(cat, []);
    categoryGroups.get(cat)!.push(event);
  }
  let eventsAfterCategoryLimit: typeof eventsAfterHates = [];
  for (const [, group] of categoryGroups) {
    const trimmed = group.length > MAX_PER_CATEGORY
      ? group.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, MAX_PER_CATEGORY)
      : group;
    eventsAfterCategoryLimit = eventsAfterCategoryLimit.concat(trimmed);
  }
  // Re-sort by score (categories are now mixed)
  eventsAfterCategoryLimit.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  // Limit to 20 total
  const top20FromHates = eventsAfterCategoryLimit.slice(0, 20);
  const finalEvents =
    top20FromHates.length >= 12 ? top20FromHates : eventsAfterCategoryLimit.slice(0, 12);

  const removedByLimit = eventsAfterCategoryLimit.length - finalEvents.length;
  if (removedByLimit > 0) {
    console.log(
      `Removed ${removedByLimit} events due to limit (kept top ${finalEvents.length}):`
    );
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
            sourceUrl: event.sourceUrl!,
            imageUrl: event.imageUrl || existing.imageUrl,
            score: Math.round(event.score),
            organizer: event.organizer ?? existing.organizer,
            artist: event.artist ?? existing.artist,
            venue: event.venue ?? existing.venue,
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
            organizer: event.organizer || null,
            artist: event.artist || null,
            venue: event.venue || null,
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
