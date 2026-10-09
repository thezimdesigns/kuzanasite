-- CreateTable
CREATE TABLE "ExhibitorEnquiry" (
    "id" TEXT NOT NULL,
    "exhibitorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organisation" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "topic" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "forwardedAt" TIMESTAMP(3),
    "forwardedById" TEXT,
    "forwardedVia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExhibitorEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExhibitorEnquiry_exhibitorId_forwardedAt_idx" ON "ExhibitorEnquiry"("exhibitorId", "forwardedAt");

-- CreateIndex
CREATE INDEX "ExhibitorEnquiry_createdAt_idx" ON "ExhibitorEnquiry"("createdAt");

-- AddForeignKey
ALTER TABLE "ExhibitorEnquiry" ADD CONSTRAINT "ExhibitorEnquiry_exhibitorId_fkey" FOREIGN KEY ("exhibitorId") REFERENCES "Exhibitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

