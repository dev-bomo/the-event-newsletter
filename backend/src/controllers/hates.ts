import { prisma } from "../lib/prisma.js";

const HATE_TYPES = ["organizer", "artist", "venue"] as const;
export type HateType = (typeof HATE_TYPES)[number];

export function isValidHateType(type: string): type is HateType {
  return HATE_TYPES.includes(type as HateType);
}

export async function getUserHates(userId: string) {
  return prisma.eventHate.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function addHate(
  userId: string,
  type: HateType,
  value: string
): Promise<{ hate: Awaited<ReturnType<typeof prisma.eventHate.create>> }> {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("Value cannot be empty");
  }

  const hate = await prisma.eventHate.upsert({
    where: {
      userId_type_value: { userId, type, value: trimmed },
    },
    create: { userId, type, value: trimmed },
    update: {}, // already exists, no-op
  });

  return { hate };
}

export async function deleteHate(userId: string, hateId: string) {
  const deleted = await prisma.eventHate.deleteMany({
    where: { id: hateId, userId },
  });
  if (deleted.count === 0) {
    throw new Error("Hate not found");
  }
  return { success: true };
}

export async function deleteAllHates(userId: string) {
  await prisma.eventHate.deleteMany({ where: { userId } });
  return { success: true };
}
