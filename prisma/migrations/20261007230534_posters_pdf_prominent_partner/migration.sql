-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "programmePdfKey" TEXT,
ADD COLUMN     "programmePdfName" TEXT,
ADD COLUMN     "programmePdfSize" INTEGER;

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN     "prominent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "posterKey" TEXT;
