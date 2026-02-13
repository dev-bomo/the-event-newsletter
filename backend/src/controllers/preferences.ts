import { prisma } from "../lib/prisma.js";
import { generateUserProfile } from "../services/ai.js";

const PREFERENCE_EDIT_LIMIT = 5;
const PREFERENCE_EDIT_WEEK_DAYS = 7;

export async function checkPreferenceEditLimit(userId: string): Promise<{
  allowed: boolean;
  remaining?: number;
  nextAllowedAt?: Date;
  message?: string;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferenceEditCount: true, lastPreferenceEditAt: true },
  });

  if (!user) {
    return { allowed: false, message: "User not found" };
  }

  const { preferenceEditCount, lastPreferenceEditAt } = user;

  if (preferenceEditCount < PREFERENCE_EDIT_LIMIT) {
    return {
      allowed: true,
      remaining: PREFERENCE_EDIT_LIMIT - preferenceEditCount,
    };
  }

  // Used all 5, check weekly limit
  if (!lastPreferenceEditAt) {
    return { allowed: true }; // Edge case: count is 5 but never set lastEdit
  }

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - PREFERENCE_EDIT_WEEK_DAYS);

  if (lastPreferenceEditAt <= weekAgo) {
    return { allowed: true };
  }

  const nextAllowedAt = new Date(lastPreferenceEditAt);
  nextAllowedAt.setDate(nextAllowedAt.getDate() + PREFERENCE_EDIT_WEEK_DAYS);

  return {
    allowed: false,
    nextAllowedAt,
    message: `You've used your 5 preference edits. You can edit again in ${Math.ceil((nextAllowedAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days (rolling weekly limit to manage AI costs).`,
  };
}

export async function recordPreferenceEdit(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferenceEditCount: true },
  });

  if (!user) return;

  const now = new Date();

  if (user.preferenceEditCount < PREFERENCE_EDIT_LIMIT) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        preferenceEditCount: user.preferenceEditCount + 1,
        lastPreferenceEditAt: now,
      },
    });
  } else {
    // Already at 5, just update lastPreferenceEditAt (weekly rolling)
    await prisma.user.update({
      where: { id: userId },
      data: { lastPreferenceEditAt: now },
    });
  }
}

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
  const limitCheck = await checkPreferenceEditLimit(userId);
  if (!limitCheck.allowed) {
    throw new Error(limitCheck.message || "Preference edit limit reached.");
  }

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
      data: { city },
    });
  }

  // Record the edit and generate profile
  await recordPreferenceEdit(userId);
  await updateUserProfile(userId);

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
  const limitCheck = await checkPreferenceEditLimit(userId);
  if (!limitCheck.allowed) {
    throw new Error(limitCheck.message || "Preference edit limit reached.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { city },
  });

  await recordPreferenceEdit(userId);
  await updateUserProfile(userId);

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

  // Clear user profile since preferences are empty
  await prisma.user.update({
    where: { id: userId },
    data: { profile: null },
  });

  return {
    interests: [],
    genres: [],
    eventTypes: [],
    venues: [],
    artists: [],
  };
}
