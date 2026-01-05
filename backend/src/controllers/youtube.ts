import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  saveTokens,
  deleteTokens,
  isConnected,
  decodeState,
} from "../services/youtubeOAuth.js";
import { fetchYouTubePreferences } from "../services/youtubeApi.js";
import { updateUserPreferences } from "./preferences.js";
import { prisma } from "../lib/prisma.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * Initiate YouTube OAuth flow
 * GET /api/auth/youtube/connect
 */
export async function connectYouTube(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    // Get return URL from query parameter (defaults to /preferences)
    const returnUrl = (req.query.returnUrl as string) || "/preferences";
    const authUrl = getAuthorizationUrl(userId, returnUrl);
    res.json({ authUrl });
  } catch (error: any) {
    console.error("Error initiating YouTube OAuth:", error);
    res.status(500).json({
      error: error.message || "Failed to initiate YouTube connection",
    });
  }
}

/**
 * Handle YouTube OAuth callback
 * GET /api/auth/youtube/callback
 */
export async function youtubeCallback(req: Request, res: Response) {
  try {
    const { code, state, error } = req.query;

    if (error) {
      console.error("YouTube OAuth error:", error);
      return res.redirect(
        `${FRONTEND_URL}/preferences?error=youtube_auth_failed`
      );
    }

    if (!code || !state) {
      return res.redirect(
        `${FRONTEND_URL}/preferences?error=missing_parameters`
      );
    }

    // Decode state to get userId and returnUrl
    const { userId, returnUrl } = decodeState(state as string);

    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForTokens(code as string);

    // Save tokens
    await saveTokens(userId, tokenResponse);

    // Fetch YouTube data and extract preferences
    try {
      const youtubeData = await fetchYouTubePreferences(userId);

      // Merge with existing preferences
      const existingPrefs = await prisma.preference.findUnique({
        where: { userId },
      });

      const parseArray = (str: string): string[] => {
        try {
          return JSON.parse(str || "[]");
        } catch {
          return [];
        }
      };

      const stringifyArray = (arr: string[]): string => {
        return JSON.stringify(arr || []);
      };

      const mergedPreferences = {
        interests: [
          ...new Set([
            ...(existingPrefs ? parseArray(existingPrefs.interests) : []),
            ...youtubeData.interests,
          ]),
        ],
        genres: [
          ...new Set([
            ...(existingPrefs ? parseArray(existingPrefs.genres) : []),
            ...youtubeData.genres,
          ]),
        ],
        eventTypes: [
          ...new Set([
            ...(existingPrefs ? parseArray(existingPrefs.eventTypes) : []),
            ...youtubeData.eventTypes,
          ]),
        ],
        venues: [
          ...new Set([
            ...(existingPrefs ? parseArray(existingPrefs.venues) : []),
            ...youtubeData.venues,
          ]),
        ],
        artists: [
          ...new Set([
            ...(existingPrefs ? parseArray(existingPrefs.artists) : []),
            ...youtubeData.artists,
          ]),
        ],
      };

      // Update preferences
      await updateUserPreferences(userId, mergedPreferences);

      console.log("YouTube preferences extracted and merged successfully");
    } catch (prefError: any) {
      console.error("Error extracting YouTube preferences:", prefError);
      // Don't fail the OAuth flow if preference extraction fails
    }

    res.redirect(`${FRONTEND_URL}${returnUrl}?youtube_connected=true`);
  } catch (error: any) {
    console.error("Error in YouTube OAuth callback:", error);
    const returnUrl =
      (req.query.state && decodeState(req.query.state as string).returnUrl) ||
      "/preferences";
    res.redirect(`${FRONTEND_URL}${returnUrl}?error=youtube_callback_failed`);
  }
}

/**
 * Disconnect YouTube account
 * DELETE /api/auth/youtube/disconnect
 */
export async function disconnectYouTube(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    await deleteTokens(userId);
    res.json({ message: "YouTube account disconnected successfully" });
  } catch (error: any) {
    console.error("Error disconnecting YouTube:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to disconnect YouTube account" });
  }
}

/**
 * Check YouTube connection status
 * GET /api/auth/youtube/status
 */
export async function getYouTubeStatus(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }
    const connected = await isConnected(userId);
    res.json({ connected });
  } catch (error: any) {
    console.error("Error checking YouTube status:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to check YouTube status" });
  }
}

/**
 * Manually sync YouTube preferences
 * POST /api/auth/youtube/sync
 */
export async function syncYouTubePreferences(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Check if connected
    if (!(await isConnected(userId))) {
      return res.status(400).json({ error: "YouTube account not connected" });
    }

    // Fetch YouTube data and extract preferences
    const youtubeData = await fetchYouTubePreferences(userId);

    // Merge with existing preferences
    const existingPrefs = await prisma.preference.findUnique({
      where: { userId },
    });

    const parseArray = (str: string): string[] => {
      try {
        return JSON.parse(str || "[]");
      } catch {
        return [];
      }
    };

    const mergedPreferences = {
      interests: [
        ...new Set([
          ...(existingPrefs ? parseArray(existingPrefs.interests) : []),
          ...youtubeData.interests,
        ]),
      ],
      genres: [
        ...new Set([
          ...(existingPrefs ? parseArray(existingPrefs.genres) : []),
          ...youtubeData.genres,
        ]),
      ],
      eventTypes: [
        ...new Set([
          ...(existingPrefs ? parseArray(existingPrefs.eventTypes) : []),
          ...youtubeData.eventTypes,
        ]),
      ],
      venues: [
        ...new Set([
          ...(existingPrefs ? parseArray(existingPrefs.venues) : []),
          ...youtubeData.venues,
        ]),
      ],
      artists: [
        ...new Set([
          ...(existingPrefs ? parseArray(existingPrefs.artists) : []),
          ...youtubeData.artists,
        ]),
      ],
    };

    // Update preferences
    const updated = await updateUserPreferences(userId, mergedPreferences);

    res.json({
      message: "YouTube preferences synced successfully",
      preferences: updated,
      youtubeData: {
        channelsCount: youtubeData.subscribedChannels.length,
        playlistsCount: youtubeData.playlists.length,
      },
    });
  } catch (error: any) {
    console.error("Error syncing YouTube preferences:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to sync YouTube preferences" });
  }
}
