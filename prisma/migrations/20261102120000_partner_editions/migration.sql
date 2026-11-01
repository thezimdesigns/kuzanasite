-- Partners can belong to several editions (years). Existing partners keep their edition.

-- CreateTable
CREATE TABLE "_PartnerEditions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PartnerEditions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PartnerEditions_B_index" ON "_PartnerEditions"("B");

-- AddForeignKey
ALTER TABLE "_PartnerEditions" ADD CONSTRAINT "_PartnerEditions_A_fkey" FOREIGN KEY ("A") REFERENCES "Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PartnerEditions" ADD CONSTRAINT "_PartnerEditions_B_fkey" FOREIGN KEY ("B") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Carry over each partner's single edition (A = edition, B = partner).
INSERT INTO "_PartnerEditions" ("A", "B")
SELECT "editionId", "id" FROM "Partner" WHERE "editionId" IS NOT NULL;

-- DropForeignKey
ALTER TABLE "Partner" DROP CONSTRAINT "Partner_editionId_fkey";

-- AlterTable
ALTER TABLE "Partner" DROP COLUMN "editionId";
