import axios from "axios";
import { prisma } from "../lib/prisma.js";
import { encrypt, decrypt } from "./encryption.js";
import crypto from "crypto";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI =
  process.env.YOUTUBE_REDIRECT_URI ||
  "http://localhost:3000/api/auth/youtube/callback";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// YouTube OAuth scopes
const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthorizationUrl(
  userId: string,
  returnUrl?: string
): string {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID not configured");
  }

  // Generate state parameter for CSRF protection
  const state = crypto.randomBytes(32).toString("hex");

  // Store state temporarily (in production, use Redis or similar)
  // Encode userId, state, and optional returnUrl in state
  const stateData = {
    userId,
    state,
    returnUrl: returnUrl || "/preferences",
  };
  const encodedState = Buffer.from(JSON.stringify(stateData)).toString(
    "base64url"
  );

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: YOUTUBE_SCOPES,
    access_type: "offline", // Required to get refresh token
    prompt: "consent", // Force consent screen to get refresh token
    state: encodedState,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<TokenResponse> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth credentials not configured");
  }

  try {
    const response = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
    });

    return response.data;
  } catch (error: any) {
    console.error(
      "Error exchanging code for tokens:",
      error.response?.data || error.message
    );
    throw new Error(
      `Failed to exchange authorization code: ${
        error.response?.data?.error_description || error.message
      }`
    );
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenResponse> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth credentials not configured");
  }

  try {
    const response = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    return response.data;
  } catch (error: any) {
    console.error(
      "Error refreshing token:",
      error.response?.data || error.message
    );
    throw new Error(
      `Failed to refresh access token: ${
        error.response?.data?.error_description || error.message
      }`
    );
  }
}

/**
 * Save or update OAuth tokens for a user
 */
export async function saveTokens(
  userId: string,
  tokenResponse: TokenResponse
): Promise<void> {
  const expiresAt = tokenResponse.expires_in
    ? new Date(Date.now() + tokenResponse.expires_in * 1000)
    : null;

  const encryptedAccessToken = encrypt(tokenResponse.access_token);
  const encryptedRefreshToken = tokenResponse.refresh_token
    ? encrypt(tokenResponse.refresh_token)
    : null;

  await prisma.oAuthToken.upsert({
    where: {
      userId_platform: {
        userId,
        platform: "youtube",
      },
    },
    create: {
      userId,
      platform: "youtube",
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt,
      scope: tokenResponse.scope,
    },
    update: {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken || undefined,
      expiresAt,
      scope: tokenResponse.scope,
      updatedAt: new Date(),
    },
  });
}

/**
 * Get valid access token for user (refresh if needed)
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const tokenRecord = await prisma.oAuthToken.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: "youtube",
      },
    },
  });

  if (!tokenRecord) {
    throw new Error("YouTube account not connected");
  }

  const accessToken = decrypt(tokenRecord.accessToken);

  // Check if token is expired or will expire soon (within 5 minutes)
  const now = new Date();
  const expiresAt = tokenRecord.expiresAt;
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

  if (expiresAt && expiresAt < fiveMinutesFromNow) {
    // Token expired or expiring soon, refresh it
    if (!tokenRecord.refreshToken) {
      throw new Error(
        "Access token expired and no refresh token available. Please reconnect your YouTube account."
      );
    }

    console.log("Refreshing YouTube access token for user:", userId);
    const refreshToken = decrypt(tokenRecord.refreshToken);
    const newTokenResponse = await refreshAccessToken(refreshToken);

    // Save new tokens (refresh token might not be included in refresh response)
    await saveTokens(userId, {
      ...newTokenResponse,
      refresh_token: newTokenResponse.refresh_token || refreshToken, // Keep old refresh token if not provided
    });

    return newTokenResponse.access_token;
  }

  return accessToken;
}

/**
 * Delete OAuth tokens (disconnect)
 */
export async function deleteTokens(userId: string): Promise<void> {
  await prisma.oAuthToken.deleteMany({
    where: {
      userId,
      platform: "youtube",
    },
  });
}

/**
 * Check if user has connected YouTube
 */
export async function isConnected(userId: string): Promise<boolean> {
  const tokenRecord = await prisma.oAuthToken.findUnique({
    where: {
      userId_platform: {
        userId,
        platform: "youtube",
      },
    },
  });

  return !!tokenRecord;
}

/**
 * Decode state parameter to extract userId, stateToken, and returnUrl
 */
export function decodeState(state: string): {
  userId: string;
  stateToken: string;
  returnUrl: string;
} {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf-8");
    const stateData = JSON.parse(decoded);

    // Support old format (userId:stateToken) for backward compatibility
    if (typeof stateData === "string" || !stateData.userId) {
      const parts = decoded.split(":");
      if (parts.length >= 2) {
        return {
          userId: parts[0],
          stateToken: parts[1],
          returnUrl: "/preferences",
        };
      }
    }

    if (!stateData.userId || !stateData.state) {
      throw new Error("Invalid state format");
    }

    return {
      userId: stateData.userId,
      stateToken: stateData.state,
      returnUrl: stateData.returnUrl || "/preferences",
    };
  } catch (error) {
    throw new Error("Invalid state parameter");
  }
}
