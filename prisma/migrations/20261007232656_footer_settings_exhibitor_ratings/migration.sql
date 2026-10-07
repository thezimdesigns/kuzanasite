-- AlterTable
ALTER TABLE "Rating" ADD COLUMN     "exhibitorId" TEXT;

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "FooterLink" (
    "id" TEXT NOT NULL,
    "column" INTEGER NOT NULL DEFAULT 1,
    "label" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "newTab" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FooterLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FooterLink_column_sortOrder_idx" ON "FooterLink"("column", "sortOrder");

-- CreateIndex
CREATE INDEX "Rating_exhibitorId_idx" ON "Rating"("exhibitorId");

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_exhibitorId_fkey" FOREIGN KEY ("exhibitorId") REFERENCES "Exhibitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
