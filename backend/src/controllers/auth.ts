import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "";
const RESET_CODE_SIGNING_SECRET = process.env.RESET_CODE_SIGNING_SECRET || JWT_SECRET;
const RESET_MAX_ATTEMPTS = 5;
const RESET_LOCK_MS = 15 * 60 * 1000;

type ResetAttemptState = {
  attempts: number;
  lockedUntil?: number;
};

const resetAttempts = new Map<string, ResetAttemptState>();

function resetAttemptsKey(email: string): string {
  return email.trim().toLowerCase();
}

function hashResetCode(email: string, code: string): string {
  return crypto
    .createHmac("sha256", RESET_CODE_SIGNING_SECRET)
    .update(`${email.trim().toLowerCase()}:${code}`)
    .digest("hex");
}

function isResetLocked(email: string): boolean {
  const key = resetAttemptsKey(email);
  const state = resetAttempts.get(key);
  if (!state?.lockedUntil) return false;
  if (Date.now() > state.lockedUntil) {
    resetAttempts.delete(key);
    return false;
  }
  return true;
}

function registerResetFailure(email: string): void {
  const key = resetAttemptsKey(email);
  const current = resetAttempts.get(key) ?? { attempts: 0 };
  const attempts = current.attempts + 1;
  if (attempts >= RESET_MAX_ATTEMPTS) {
    resetAttempts.set(key, {
      attempts,
      lockedUntil: Date.now() + RESET_LOCK_MS,
    });
    return;
  }
  resetAttempts.set(key, { attempts });
}

function clearResetAttempts(email: string): void {
  resetAttempts.delete(resetAttemptsKey(email));
}

if (!JWT_SECRET) {
  console.warn(
    "⚠️  WARNING: JWT_SECRET is not set. Authentication will not work properly."
  );
}

export async function register(data: {
  email: string;
  password: string;
  name?: string;
}) {
  if (!JWT_SECRET) {
    throw new Error("Server configuration error: JWT_SECRET is not set");
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  // Create user (auto-verified; verified field kept in DB for compatibility)
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      verified: true,
    },
    select: {
      id: true,
      email: true,
      name: true,
      city: true,
      verified: true,
      subscriptionExpiresAt: true,
      createdAt: true,
    },
  });

  // Generate token
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: "30d",
  });

  return {
    user,
    token,
  };
}

export async function login(data: { email: string; password: string }) {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Verify password
  const isValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  // Generate token (unverified users can log in but cannot generate newsletters)
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: "30d",
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      city: user.city,
      verified: user.verified,
      subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString() ?? null,
      createdAt: user.createdAt,
    },
    token,
  };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      city: true,
      verified: true,
      subscriptionExpiresAt: true,
    },
  });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    city: user.city,
    verified: user.verified,
    subscriptionExpiresAt: user.subscriptionExpiresAt?.toISOString() ?? null,
  };
}

export async function requestPasswordReset(email: string) {
  if (!RESET_CODE_SIGNING_SECRET) {
    throw new Error(
      "Server configuration error: RESET_CODE_SIGNING_SECRET or JWT_SECRET is not set"
    );
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Don't reveal if user exists or not (security best practice)
  if (!user) {
    // Still return success to prevent email enumeration
    return { success: true };
  }

  // Generate 6-digit code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedResetCode = hashResetCode(email, resetCode);
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Code expires in 15 minutes

  // Save reset code
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetCode: hashedResetCode,
      resetCodeExpiresAt: expiresAt,
    },
  });
  clearResetAttempts(email);

  // Send email with code
  const { sendEmail } = await import("../services/email.js");
  await sendEmail({
    to: user.email,
    subject: "Password Reset Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Use the following code to reset it:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h1 style="font-size: 32px; letter-spacing: 8px; margin: 0; color: #1f2937;">${resetCode}</h1>
        </div>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  });

  return { success: true };
}

export async function resetPassword(data: {
  email: string;
  code: string;
  newPassword: string;
}) {
  if (!RESET_CODE_SIGNING_SECRET) {
    throw new Error(
      "Server configuration error: RESET_CODE_SIGNING_SECRET or JWT_SECRET is not set"
    );
  }

  if (isResetLocked(data.email)) {
    throw new Error("Too many invalid reset attempts. Please request a new code later.");
  }

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new Error("Invalid email or reset code");
  }

  // Check if reset code exists and is valid
  if (!user.resetCode || !user.resetCodeExpiresAt) {
    throw new Error("Invalid or expired reset code");
  }

  // Check if code matches
  const expectedHash = user.resetCode;
  const providedHash = hashResetCode(data.email, data.code);
  const expectedBuffer = Buffer.from(expectedHash, "hex");
  const providedBuffer = Buffer.from(providedHash, "hex");
  const sameLength = expectedBuffer.length === providedBuffer.length;
  const isMatch =
    sameLength && crypto.timingSafeEqual(expectedBuffer, providedBuffer);

  if (!isMatch) {
    registerResetFailure(data.email);
    throw new Error("Invalid reset code");
  }

  // Check if code is expired
  if (new Date() > user.resetCodeExpiresAt) {
    throw new Error("Reset code has expired. Please request a new one.");
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(data.newPassword, 10);

  // Update password and clear reset code
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetCode: null,
      resetCodeExpiresAt: null,
    },
  });
  clearResetAttempts(data.email);

  return { success: true };
}
