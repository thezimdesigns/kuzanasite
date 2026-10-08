-- CreateEnum
CREATE TYPE "QuestionKind" AS ENUM ('QUESTION', 'CONTRIBUTION');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('PENDING', 'APPROVED', 'ANSWERED', 'HIDDEN');

-- CreateTable
CREATE TABLE "ConferenceQuestion" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "sessionId" TEXT,
    "kind" "QuestionKind" NOT NULL DEFAULT 'QUESTION',
    "body" TEXT NOT NULL,
    "name" TEXT,
    "organisation" TEXT,
    "status" "QuestionStatus" NOT NULL DEFAULT 'PENDING',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "votes" INTEGER NOT NULL DEFAULT 0,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConferenceQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionVote" (
    "questionId" TEXT NOT NULL,
    "voter" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionVote_pkey" PRIMARY KEY ("questionId","voter")
);

-- CreateIndex
CREATE INDEX "ConferenceQuestion_eventId_status_idx" ON "ConferenceQuestion"("eventId", "status");

-- CreateIndex
CREATE INDEX "ConferenceQuestion_sessionId_status_idx" ON "ConferenceQuestion"("sessionId", "status");

-- AddForeignKey
ALTER TABLE "ConferenceQuestion" ADD CONSTRAINT "ConferenceQuestion_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConferenceQuestion" ADD CONSTRAINT "ConferenceQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionVote" ADD CONSTRAINT "QuestionVote_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ConferenceQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
