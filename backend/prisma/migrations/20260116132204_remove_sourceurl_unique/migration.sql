-- DropIndex
DROP INDEX "Event_sourceUrl_key";

-- CreateIndex
CREATE INDEX "Event_sourceUrl_idx" ON "Event"("sourceUrl");
