import { prisma } from '../lib/prisma.js';

// Helper to parse JSON arrays (for SQLite compatibility)
function parseArray(str: string): string[] {
  try {
    return JSON.parse(str || '[]');
  } catch {
    return [];
  }
}

// Helper to stringify arrays (for SQLite compatibility)
function stringifyArray(arr: string[]): string {
  return JSON.stringify(arr || []);
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

  if (existing) {
    const updated = await prisma.preference.update({
      where: { userId },
      data: {
        interests: data.interests !== undefined ? stringifyArray(data.interests) : existing.interests,
        genres: data.genres !== undefined ? stringifyArray(data.genres) : existing.genres,
        eventTypes: data.eventTypes !== undefined ? stringifyArray(data.eventTypes) : existing.eventTypes,
        venues: data.venues !== undefined ? stringifyArray(data.venues) : existing.venues,
        artists: data.artists !== undefined ? stringifyArray(data.artists) : existing.artists,
      },
    });
    
    return {
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
    
    return {
      interests: parseArray(created.interests),
      genres: parseArray(created.genres),
      eventTypes: parseArray(created.eventTypes),
      venues: parseArray(created.venues),
      artists: parseArray(created.artists),
    };
  }
}

export async function updateUserCity(userId: string, city: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { city },
  });
}

