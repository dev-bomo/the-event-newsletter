import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Handle Prisma connection errors
prisma.$connect().catch((error) => {
  console.error('Failed to connect to database:', error);
  process.exit(1);
});

