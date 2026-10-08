-- CreateTable
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "headline" TEXT,
    "note" TEXT,
    "groups" JSONB NOT NULL,
    "publishStatus" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyReport_day_key" ON "DailyReport"("day");
