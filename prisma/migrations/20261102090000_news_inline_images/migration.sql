-- AlterTable
ALTER TABLE "NewsPost" ADD COLUMN     "coverCaption" TEXT,
ADD COLUMN     "coverCredit" TEXT,
ADD COLUMN     "coverCreditUrl" TEXT;

-- CreateTable
CREATE TABLE "NewsPostImage" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "key" TEXT NOT NULL,
    "alt" TEXT,
    "caption" TEXT,
    "credit" TEXT,
    "creditUrl" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsPostImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsPostImage_postId_number_key" ON "NewsPostImage"("postId", "number");

-- AddForeignKey
ALTER TABLE "NewsPostImage" ADD CONSTRAINT "NewsPostImage_postId_fkey" FOREIGN KEY ("postId") REFERENCES "NewsPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

