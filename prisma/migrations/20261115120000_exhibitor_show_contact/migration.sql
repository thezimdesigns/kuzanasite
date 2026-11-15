-- AlterEnum
ALTER TYPE "ExhibitorSource" ADD VALUE 'IMPORT';

-- AlterTable
ALTER TABLE "Exhibitor" ADD COLUMN     "showContact" BOOLEAN NOT NULL DEFAULT true;

