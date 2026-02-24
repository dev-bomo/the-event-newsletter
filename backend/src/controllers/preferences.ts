import { prisma } from "../lib/prisma.js";
import { generateUserProfile } from "../services/ai.js";

// Helper to parse JSON arrays (for SQLite compatibility)
function parseArray(str: string): string[] {
  try {
    return JSON.parse(str || "[]");
  } catch {
    return [];
  }
}

// Helper to stringify arrays (for SQLite compatibility)
function stringifyArray(arr: string[]): string {
  return JSON.stringify(arr || []);
}

/**
 * Generate and save user profile based on preferences
 */
export async function updateUserProfile(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
        eventSources: true,
      },
    });

    if (!user || !user.city) {
      console.log("Cannot generate profile: user or city not found");
      return;
    }

    // Skip profile generation for unverified users (they can save preferences but not generate newsletters)
    if (!user.verified) {
      console.log("Skipping profile generation: user not verified");
      return;
    }

    if (!user.preferences) {
      console.log("Cannot generate profile: preferences not set");
      return;
    }

    const preferences = {
      interests: parseArray(user.preferences.interests),
      genres: parseArray(user.preferences.genres),
      eventTypes: parseArray(user.preferences.eventTypes),
      venues: parseArray(user.preferences.venues),
      artists: parseArray(user.preferences.artists),
    };

    // Log preferences being used for profile generation
    console.log("Generating profile with preferences:", {
      city: user.city,
      interests: preferences.interests,
      genres: preferences.genres,
      eventTypes: preferences.eventTypes,
      venues: preferences.venues,
      artists: preferences.artists.length,
      eventSources: user.eventSources.length,
    });

    const eventSources = user.eventSources.map((source) => ({
      url: source.url,
      name: source.name || undefined,
    }));

    // Generate profile using AI
    const profile = await generateUserProfile({
      city: user.city,
      ...preferences,
      eventSources,
    });

    // Save profile to user and clear dirty flag
    await prisma.user.update({
      where: { id: userId },
      data: { profile, profileIsDirty: false },
    });

    console.log("User profile generated and saved successfully");
  } catch (error: any) {
    console.error("Error generating user profile:", error);
    // Don't throw - profile generation failure shouldn't break preference updates
  }
}

export async function getUserPreferences(userId: string) {
  const preference = await prisma.preference.findUnique({
    where: { userId },
  });

  if (!preference) {
    return {
      interests: [],
      genres: [],
      eventTypes: [],
      venues: [],
      artists: [],
    };
  }

  return {
    interests: parseArray(preference.interests),
    genres: parseArray(preference.genres),
    eventTypes: parseArray(preference.eventTypes),
    venues: parseArray(preference.venues),
    artists: parseArray(preference.artists),
  };
}

export async function updateUserPreferences(
  userId: string,
  data: {
    interests?: string[];
    genres?: string[];
    eventTypes?: string[];
    venues?: string[];
    artists?: string[];
  },
  city?: string
): Promise<{
  interests: string[];
  genres: string[];
  eventTypes: string[];
  venues: string[];
  artists: string[];
  _unverified?: boolean;
}> {
  const existing = await prisma.preference.findUnique({
    where: { userId },
  });

  // Limit artists to 100 total
  const limitedArtists = data.artists ? data.artists.slice(0, 100) : undefined;

  let result;
  if (existing) {
    const updated = await prisma.preference.update({
      where: { userId },
      data: {
        interests:
          data.interests !== undefined
            ? stringifyArray(data.interests)
            : existing.interests,
        genres:
          data.genres !== undefined
            ? stringifyArray(data.genres)
            : existing.genres,
        eventTypes:
          data.eventTypes !== undefined
            ? stringifyArray(data.eventTypes)
            : existing.eventTypes,
        venues:
          data.venues !== undefined
            ? stringifyArray(data.venues)
            : existing.venues,
        artists:
          limitedArtists !== undefined
            ? stringifyArray(limitedArtists)
            : existing.artists,
      },
    });

    result = {
      interests: parseArray(updated.interests),
      genres: parseArray(updated.genres),
      eventTypes: parseArray(updated.eventTypes),
      venues: parseArray(updated.venues),
      artists: parseArray(updated.artists),
    };
  } else {
    const created = await prisma.preference.create({
      data: {
        userId,
        interests: stringifyArray(data.interests ?? []),
        genres: stringifyArray(data.genres ?? []),
        eventTypes: stringifyArray(data.eventTypes ?? []),
        venues: stringifyArray(data.venues ?? []),
        artists: stringifyArray(limitedArtists ?? []),
      },
    });

    result = {
      interests: parseArray(created.interests),
      genres: parseArray(created.genres),
      eventTypes: parseArray(created.eventTypes),
      venues: parseArray(created.venues),
      artists: parseArray(created.artists),
    };
  }

  // Update city if provided (same request = 1 edit)
  if (city !== undefined) {
    await prisma.user.update({
      where: { id: userId },
      data: { city, profileIsDirty: true },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { profileIsDirty: true },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { verified: true },
  });

  return {
    ...result,
    ...(user && !user.verified ? { _unverified: true } : {}),
  };
}

export async function updateUserCity(
  userId: string,
  city: string
): Promise<{ success: boolean; _unverified?: boolean }> {
  await prisma.user.update({
    where: { id: userId },
    data: { city, profileIsDirty: true },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { verified: true },
  });

  return {
    success: true,
    ...(user && !user.verified ? { _unverified: true } : {}),
  };
}

/**
 * Reset all preferences to empty arrays
 */
export async function resetPreferences(userId: string) {
  const existing = await prisma.preference.findUnique({
    where: { userId },
  });

  if (existing) {
    // Update to empty arrays
    await prisma.preference.update({
      where: { userId },
      data: {
        interests: stringifyArray([]),
        genres: stringifyArray([]),
        eventTypes: stringifyArray([]),
        venues: stringifyArray([]),
        artists: stringifyArray([]),
      },
    });
  } else {
    // Create empty preferences if they don't exist
    await prisma.preference.create({
      data: {
        userId,
        interests: stringifyArray([]),
        genres: stringifyArray([]),
        eventTypes: stringifyArray([]),
        venues: stringifyArray([]),
        artists: stringifyArray([]),
      },
    });
  }

  // Clear user profile and mark dirty so next newsletter generation will regenerate
  await prisma.user.update({
    where: { id: userId },
    data: { profile: null, profileIsDirty: true },
  });

  return {
    interests: [],
    genres: [],
    eventTypes: [],
    venues: [],
    artists: [],
  };
}
