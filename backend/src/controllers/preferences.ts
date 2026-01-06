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

    // Save profile to user
    await prisma.user.update({
      where: { id: userId },
      data: { profile },
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
  }
) {
  const existing = await prisma.preference.findUnique({
    where: { userId },
  });

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
          data.artists !== undefined
            ? stringifyArray(data.artists)
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
        artists: stringifyArray(data.artists ?? []),
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

  // Generate and update user profile after preferences are saved
  await updateUserProfile(userId);

  return result;
}

export async function updateUserCity(userId: string, city: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { city },
  });

  // Regenerate profile when city changes
  await updateUserProfile(userId);
}
