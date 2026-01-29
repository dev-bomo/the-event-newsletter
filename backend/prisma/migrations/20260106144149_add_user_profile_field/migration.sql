-- AlterTable
ALTER TABLE "User" ADD COLUMN "profile" TEXT;
ALTER TABLE "User" ADD COLUMN "resetCode" TEXT;
ALTER TABLE "User" ADD COLUMN "resetCodeExpiresAt" DATETIME;
