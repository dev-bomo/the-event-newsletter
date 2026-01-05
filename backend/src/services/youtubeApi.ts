import axios from "axios";
import { getValidAccessToken } from "./youtubeOAuth.js";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export interface YouTubeChannel {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
}

export interface YouTubePlaylist {
  id: string;
  title: string;
  description?: string;
  itemCount?: number;
}

export interface YouTubePreferences {
  subscribedChannels: YouTubeChannel[];
  playlists: YouTubePlaylist[];
  interests: string[];
  genres: string[];
  artists: string[];
  venues: string[];
  eventTypes: string[];
}

/**
 * Get user's YouTube channel info
 */
async function getUserChannel(
  accessToken: string
): Promise<YouTubeChannel | null> {
  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, {
      params: {
        part: "snippet,contentDetails",
        mine: true,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const items = response.data.items;
    if (!items || items.length === 0) {
      return null;
    }

    const channel = items[0];
    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnail: channel.snippet.thumbnails?.default?.url,
    };
  } catch (error: any) {
    console.error(
      "Error fetching user channel:",
      error.response?.data || error.message
    );
    return null;
  }
}

/**
 * Get user's subscribed channels
 */
async function getSubscriptions(
  accessToken: string
): Promise<YouTubeChannel[]> {
  try {
    const channels: YouTubeChannel[] = [];
    let nextPageToken: string | undefined;

    do {
      const response = await axios.get(`${YOUTUBE_API_BASE}/subscriptions`, {
        params: {
          part: "snippet,contentDetails",
          mine: true,
          maxResults: 50,
          pageToken: nextPageToken,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const items = response.data.items || [];
      for (const item of items) {
        channels.push({
          id: item.snippet.resourceId.channelId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails?.default?.url,
        });
      }

      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    return channels;
  } catch (error: any) {
    console.error(
      "Error fetching subscriptions:",
      error.response?.data || error.message
    );
    return [];
  }
}

/**
 * Get user's playlists
 */
async function getPlaylists(accessToken: string): Promise<YouTubePlaylist[]> {
  try {
    const playlists: YouTubePlaylist[] = [];
    let nextPageToken: string | undefined;

    do {
      const response = await axios.get(`${YOUTUBE_API_BASE}/playlists`, {
        params: {
          part: "snippet,contentDetails",
          mine: true,
          maxResults: 50,
          pageToken: nextPageToken,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const items = response.data.items || [];
      for (const item of items) {
        playlists.push({
          id: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          itemCount: item.contentDetails?.itemCount,
        });
      }

      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken);

    return playlists;
  } catch (error: any) {
    console.error(
      "Error fetching playlists:",
      error.response?.data || error.message
    );
    return [];
  }
}

/**
 * Extract preferences from YouTube data
 */
function extractPreferencesFromYouTubeData(
  channels: YouTubeChannel[],
  playlists: YouTubePlaylist[]
): Omit<YouTubePreferences, "subscribedChannels" | "playlists"> {
  const interests: string[] = [];
  const genres: string[] = [];
  const artists: string[] = [];
  const venues: string[] = [];
  const eventTypes: string[] = [];

  // Extract from channel titles and descriptions
  for (const channel of channels) {
    const title = channel.title.toLowerCase();
    const description = (channel.description || "").toLowerCase();

    // Look for music-related keywords
    if (title.includes("music") || description.includes("music")) {
      interests.push("music");
    }
    if (title.includes("concert") || description.includes("concert")) {
      interests.push("concerts");
      eventTypes.push("concerts");
    }
    if (title.includes("theater") || description.includes("theater")) {
      interests.push("theater");
      eventTypes.push("theater");
    }
    if (title.includes("festival") || description.includes("festival")) {
      interests.push("festivals");
      eventTypes.push("festivals");
    }

    // Extract artist names (channels are often artist channels)
    if (title && !title.includes("official") && !title.includes("channel")) {
      artists.push(channel.title);
    }

    // Look for venue names
    if (title.includes("venue") || description.includes("venue")) {
      venues.push(channel.title);
    }
  }

  // Extract from playlist titles
  for (const playlist of playlists) {
    const title = playlist.title.toLowerCase();

    // Genre detection from playlist names
    const genreKeywords = [
      "rock",
      "pop",
      "jazz",
      "classical",
      "electronic",
      "hip hop",
      "rap",
      "country",
      "folk",
      "indie",
      "metal",
      "punk",
      "reggae",
      "blues",
      "r&b",
    ];

    for (const genre of genreKeywords) {
      if (title.includes(genre) && !genres.includes(genre)) {
        genres.push(genre);
      }
    }
  }

  // Deduplicate
  return {
    interests: [...new Set(interests)],
    genres: [...new Set(genres)],
    artists: [...new Set(artists)].slice(0, 50), // Limit to 50 artists
    venues: [...new Set(venues)],
    eventTypes: [...new Set(eventTypes)],
  };
}

/**
 * Fetch all YouTube data for a user and extract preferences
 */
export async function fetchYouTubePreferences(
  userId: string
): Promise<YouTubePreferences> {
  const accessToken = await getValidAccessToken(userId);

  // Fetch all data in parallel
  const [userChannel, subscriptions, playlists] = await Promise.all([
    getUserChannel(accessToken),
    getSubscriptions(accessToken),
    getPlaylists(accessToken),
  ]);

  // Extract preferences
  const extracted = extractPreferencesFromYouTubeData(subscriptions, playlists);

  return {
    subscribedChannels: subscriptions,
    playlists,
    ...extracted,
  };
}
