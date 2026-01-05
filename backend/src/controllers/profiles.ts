import { prisma } from "../lib/prisma.js";
import {
  discoverProfilesByEmail,
  extractPreferencesFromProfileUrl,
} from "../services/ai.js";
import { parseProfileUrl } from "../utils/profileParser.js";

export async function discoverProfiles(
  userId: string,
  email?: string,
  profileUrl?: string
) {
  let profiles = [];

  // If profileUrl is provided, parse it directly
  if (profileUrl) {
    const parsed = parseProfileUrl(profileUrl);
    if (parsed) {
      // Check if profile already exists for this user
      const existing = await prisma.profile.findFirst({
        where: {
          userId,
          profileUrl: profileUrl,
        },
      });

      if (existing) {
        // Return existing profile
        profiles.push(existing);
        return profiles;
      }

      // Create profile from URL
      const profile = await prisma.profile.create({
        data: {
          userId,
          platform: parsed.platform,
          profileUrl: profileUrl,
          username: parsed.username,
          displayName: parsed.displayName,
          isSelected: false,
        },
      });
      profiles.push(profile);
      return profiles;
    } else {
      throw new Error(
        "Invalid profile URL. Supported platforms: Facebook, Instagram, YouTube, Spotify, Twitter/X, LinkedIn"
      );
    }
  }

  // If email is provided, try AI discovery
  if (email) {
    const discoveredProfiles = await discoverProfilesByEmail(email);

    // If profiles found via AI, store them
    if (discoveredProfiles && discoveredProfiles.length > 0) {
      const createdProfiles = await Promise.all(
        discoveredProfiles.map((profile) =>
          prisma.profile.create({
            data: {
              userId,
              platform: profile.platform,
              profileUrl: profile.profileUrl,
              username: profile.username,
              displayName: profile.displayName,
              profilePicture: profile.profilePicture,
              isSelected: false,
            },
          })
        )
      );
      profiles.push(...createdProfiles);
    }
  }

  return profiles;
}

export async function getUserProfiles(userId: string) {
  return prisma.profile.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function selectProfiles(userId: string, profileIds: string[]) {
  // First, unselect all profiles
  await prisma.profile.updateMany({
    where: { userId },
    data: { isSelected: false },
  });

  // Then, select the specified profiles
  await prisma.profile.updateMany({
    where: {
      userId,
      id: { in: profileIds },
    },
    data: { isSelected: true },
  });
}

export async function crawlSelectedProfiles(userId: string) {
  // Get selected profiles
  const profiles = await prisma.profile.findMany({
    where: {
      userId,
      isSelected: true,
    },
  });

  if (profiles.length === 0) {
    throw new Error("No profiles selected for crawling");
  }

  // Crawl each profile and extract preferences
  const allPreferences: any = {
    interests: [],
    genres: [],
    eventTypes: [],
    venues: [],
    artists: [],
  };

  for (const profile of profiles) {
    try {
      console.log(
        `Analyzing profile ${profile.id} (${profile.platform}): ${profile.profileUrl}`
      );

      // Use AI to analyze the profile URL directly (no scraping needed)
      const extracted = await extractPreferencesFromProfileUrl(
        profile.platform,
        profile.profileUrl
      );

      console.log(`Extracted preferences from ${profile.platform}:`, {
        interests: extracted.interests.length,
        genres: extracted.genres.length,
        eventTypes: extracted.eventTypes.length,
        venues: extracted.venues.length,
        artists: extracted.artists.length,
      });

      // Merge preferences
      allPreferences.interests.push(...extracted.interests);
      allPreferences.genres.push(...extracted.genres);
      allPreferences.eventTypes.push(...extracted.eventTypes);
      allPreferences.venues.push(...extracted.venues);
      allPreferences.artists.push(...extracted.artists);

      // Update profile last crawled timestamp
      await prisma.profile.update({
        where: { id: profile.id },
        data: { lastCrawledAt: new Date() },
      });

      console.log(`Successfully processed profile ${profile.id}`);
    } catch (error: any) {
      console.error(
        `Error processing profile ${profile.id} (${profile.platform}):`,
        error.message || error
      );
      // Continue with other profiles - don't let one failure stop the whole process
    }
  }

  // Deduplicate arrays
  const uniquePreferences = {
    interests: [...new Set(allPreferences.interests)],
    genres: [...new Set(allPreferences.genres)],
    eventTypes: [...new Set(allPreferences.eventTypes)],
    venues: [...new Set(allPreferences.venues)],
    artists: [...new Set(allPreferences.artists)],
  };

  // Save or update preferences (convert arrays to JSON strings for SQLite)
  await prisma.preference.upsert({
    where: { userId },
    create: {
      userId,
      interests: JSON.stringify(uniquePreferences.interests),
      genres: JSON.stringify(uniquePreferences.genres),
      eventTypes: JSON.stringify(uniquePreferences.eventTypes),
      venues: JSON.stringify(uniquePreferences.venues),
      artists: JSON.stringify(uniquePreferences.artists),
    },
    update: {
      interests: JSON.stringify(uniquePreferences.interests),
      genres: JSON.stringify(uniquePreferences.genres),
      eventTypes: JSON.stringify(uniquePreferences.eventTypes),
      venues: JSON.stringify(uniquePreferences.venues),
      artists: JSON.stringify(uniquePreferences.artists),
      extractedAt: new Date(),
    },
  });

  return uniquePreferences;
}
