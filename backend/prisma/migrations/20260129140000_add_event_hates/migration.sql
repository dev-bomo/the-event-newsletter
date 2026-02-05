-- AlterTable
ALTER TABLE "Event" ADD COLUMN "organizer" TEXT,
ADD COLUMN "artist" TEXT,
ADD COLUMN "venue" TEXT;

-- CreateTable
CREATE TABLE "EventHate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventHate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventHate_userId_type_value_key" ON "EventHate"("userId", "type", "value");

-- CreateIndex
CREATE INDEX "EventHate_userId_idx" ON "EventHate"("userId");

-- AddForeignKey
ALTER TABLE "EventHate" ADD CONSTRAINT "EventHate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
