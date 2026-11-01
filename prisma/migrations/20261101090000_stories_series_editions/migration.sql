-- CreateEnum
CREATE TYPE "NewsKind" AS ENUM ('UPDATE', 'STORY', 'INTERVIEW');

-- AlterTable
ALTER TABLE "InterestRegistration" ADD COLUMN     "editionId" TEXT;

-- AlterTable
ALTER TABLE "NewsPost" ADD COLUMN     "kind" "NewsKind" NOT NULL DEFAULT 'UPDATE',
ADD COLUMN     "seriesId" TEXT,
ADD COLUMN     "seriesPart" INTEGER;

-- CreateTable
CREATE TABLE "Series" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "author" TEXT,
    "coverKey" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "publishStatus" "PublishStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsPostExhibitor" (
    "postId" TEXT NOT NULL,
    "exhibitorId" TEXT NOT NULL,

    CONSTRAINT "NewsPostExhibitor_pkey" PRIMARY KEY ("postId","exhibitorId")
);

-- CreateTable
CREATE TABLE "NewsPostPerson" (
    "postId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,

    CONSTRAINT "NewsPostPerson_pkey" PRIMARY KEY ("postId","personId")
);

-- CreateTable
CREATE TABLE "StorySubmission" (
    "id" TEXT NOT NULL,
    "exhibitorId" TEXT,
    "personId" TEXT,
    "name" TEXT NOT NULL,
    "organisation" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "tookPart" TEXT NOT NULL,
    "outcomes" TEXT,
    "workingOn" TEXT,
    "returning" TEXT,
    "photoKey" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "postId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorySubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Series_slug_key" ON "Series"("slug");

-- CreateIndex
CREATE INDEX "NewsPostExhibitor_exhibitorId_idx" ON "NewsPostExhibitor"("exhibitorId");

-- CreateIndex
CREATE INDEX "NewsPostPerson_personId_idx" ON "NewsPostPerson"("personId");

-- CreateIndex
CREATE INDEX "StorySubmission_status_createdAt_idx" ON "StorySubmission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "InterestRegistration_editionId_idx" ON "InterestRegistration"("editionId");

-- CreateIndex
CREATE INDEX "NewsPost_kind_publishStatus_publishedAt_idx" ON "NewsPost"("kind", "publishStatus", "publishedAt");

-- CreateIndex
CREATE INDEX "NewsPost_seriesId_seriesPart_idx" ON "NewsPost"("seriesId", "seriesPart");

-- AddForeignKey
ALTER TABLE "InterestRegistration" ADD CONSTRAINT "InterestRegistration_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsPost" ADD CONSTRAINT "NewsPost_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "Series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsPostExhibitor" ADD CONSTRAINT "NewsPostExhibitor_postId_fkey" FOREIGN KEY ("postId") REFERENCES "NewsPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsPostExhibitor" ADD CONSTRAINT "NewsPostExhibitor_exhibitorId_fkey" FOREIGN KEY ("exhibitorId") REFERENCES "Exhibitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsPostPerson" ADD CONSTRAINT "NewsPostPerson_postId_fkey" FOREIGN KEY ("postId") REFERENCES "NewsPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsPostPerson" ADD CONSTRAINT "NewsPostPerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorySubmission" ADD CONSTRAINT "StorySubmission_exhibitorId_fkey" FOREIGN KEY ("exhibitorId") REFERENCES "Exhibitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorySubmission" ADD CONSTRAINT "StorySubmission_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

