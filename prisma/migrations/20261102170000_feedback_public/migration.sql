-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicName" TEXT,
ADD COLUMN     "publicText" TEXT,
ADD COLUMN     "publishConsent" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Feedback_isPublic_createdAt_idx" ON "Feedback"("isPublic", "createdAt");

