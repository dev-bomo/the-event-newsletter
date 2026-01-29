-- AlterTable
ALTER TABLE "Event" ADD COLUMN "score" INTEGER;

-- CreateIndex
CREATE INDEX "Event_score_idx" ON "Event"("score");
