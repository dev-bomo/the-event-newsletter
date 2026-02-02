-- AlterTable
ALTER TABLE "User" ADD COLUMN "preferenceEditCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lastPreferenceEditAt" TIMESTAMP(3);
