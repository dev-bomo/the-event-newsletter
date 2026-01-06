import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "";

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

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      city: true,
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

  // Generate token
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: "30d",
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      city: user.city,
      createdAt: user.createdAt,
    },
    token,
  };
}

export async function requestPasswordReset(email: string) {
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
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Code expires in 15 minutes

  // Save reset code
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetCode,
      resetCodeExpiresAt: expiresAt,
    },
  });

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
  if (user.resetCode !== data.code) {
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

  return { success: true };
}
