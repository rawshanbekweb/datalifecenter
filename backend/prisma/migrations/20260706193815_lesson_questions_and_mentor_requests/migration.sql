-- CreateEnum
CREATE TYPE "MentorRequestStatus" AS ENUM ('OPEN', 'ANSWERED', 'CLOSED');

-- CreateTable
CREATE TABLE "LessonQuestion" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "answer" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorRequest" (
    "id" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "MentorRequestStatus" NOT NULL DEFAULT 'OPEN',
    "reply" TEXT,
    "repliedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LessonQuestion_lessonId_createdAt_idx" ON "LessonQuestion"("lessonId", "createdAt");

-- CreateIndex
CREATE INDEX "MentorRequest_status_createdAt_idx" ON "MentorRequest"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "LessonQuestion" ADD CONSTRAINT "LessonQuestion_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonQuestion" ADD CONSTRAINT "LessonQuestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorRequest" ADD CONSTRAINT "MentorRequest_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
