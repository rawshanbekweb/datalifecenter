-- CreateTable
CREATE TABLE "CourseMentor" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "isLead" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseMentor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseMentor_mentorId_idx" ON "CourseMentor"("mentorId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseMentor_courseId_mentorId_key" ON "CourseMentor"("courseId", "mentorId");

-- Mavjud biriktirishlarni ko'chirish: eski yagona mentor kursning "asosiy"
-- mentori bo'lib qoladi. Bu ustunni tashlashdan OLDIN bajarilishi shart.
INSERT INTO "CourseMentor" ("id", "courseId", "mentorId", "isLead", "order")
SELECT gen_random_uuid()::text, "id", "mentorId", true, 0
FROM "Course"
WHERE "mentorId" IS NOT NULL;

-- AddForeignKey
ALTER TABLE "CourseMentor" ADD CONSTRAINT "CourseMentor_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseMentor" ADD CONSTRAINT "CourseMentor_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_mentorId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "Course_mentorId_idx";

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "mentorId";
