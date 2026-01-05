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
