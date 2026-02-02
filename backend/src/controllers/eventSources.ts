import { prisma } from "../lib/prisma.js";
import {
  updateUserProfile,
  checkPreferenceEditLimit,
  recordPreferenceEdit,
} from "./preferences.js";

export async function getUserEventSources(userId: string) {
  return prisma.eventSource.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function addEventSource(
  userId: string,
  url: string,
  name?: string
) {
  const limitCheck = await checkPreferenceEditLimit(userId);
  if (!limitCheck.allowed) {
    throw new Error(limitCheck.message || "Preference edit limit reached.");
  }

  // Check if source already exists for this user
  const existing = await prisma.eventSource.findFirst({
    where: {
      userId,
      url,
    },
  });

  if (existing) {
    throw new Error("This event source is already added");
  }

  const eventSource = await prisma.eventSource.create({
    data: {
      userId,
      url,
      name: name || null,
    },
  });

  await recordPreferenceEdit(userId);
  await updateUserProfile(userId);

  return eventSource;
}

export async function deleteEventSource(userId: string, sourceId: string) {
  const limitCheck = await checkPreferenceEditLimit(userId);
  if (!limitCheck.allowed) {
    throw new Error(limitCheck.message || "Preference edit limit reached.");
  }

  // Verify the source belongs to the user
  const source = await prisma.eventSource.findFirst({
    where: {
      id: sourceId,
      userId,
    },
  });

  if (!source) {
    throw new Error("Event source not found");
  }

  await prisma.eventSource.delete({
    where: { id: sourceId },
  });

  await recordPreferenceEdit(userId);
  await updateUserProfile(userId);
}
