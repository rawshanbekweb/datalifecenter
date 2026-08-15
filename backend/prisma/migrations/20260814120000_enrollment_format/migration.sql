-- Yozilishga guruh formati: offline o'quvchi ham endi Enrollment sifatida
-- yashaydi (schema.prisma dagi Enrollment izohiga qarang).

-- CreateEnum
CREATE TYPE "EnrollmentFormat" AS ENUM ('ONLINE', 'OFFLINE');

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "format" "EnrollmentFormat" NOT NULL DEFAULT 'ONLINE';

-- DropIndex
DROP INDEX "Enrollment_courseId_status_idx";

-- CreateIndex
CREATE INDEX "Enrollment_courseId_status_format_idx" ON "Enrollment"("courseId", "status", "format");

-- Mavjud offline o'quvchilarni ko'chirish: ilgari tasdiqlangan offline
-- so'rov (CourseRequest.ENROLLED) Enrollment yaratmasdi, shuning uchun bu
-- odamlar hech qayerda ko'rinmasdi. Har biriga yozilish ochamiz.
--
-- id cuid emas, lekin barqaror va noyob: so'rov id'si ustiga prefiks.
-- Sertifikat raqami id'ning oxirgi 8 belgisidan yasaladi — u cuid'dan
-- kelgani uchun noyobligicha qoladi.
INSERT INTO "Enrollment" (
  "id", "userId", "courseId", "format", "status", "paymentStatus",
  "provider", "providerRef", "amountPaid", "enrolledAt"
)
SELECT
  'ofl_' || cr."id",
  cr."userId",
  cr."courseId",
  'OFFLINE'::"EnrollmentFormat",
  'ACTIVE'::"EnrollmentStatus",
  CASE WHEN c."isFree" THEN 'FREE'::"PaymentStatus" ELSE 'PAID'::"PaymentStatus" END,
  'admin',
  'request_' || cr."id",
  CASE WHEN c."isFree" THEN NULL ELSE COALESCE(c."offlinePrice", c."price") END,
  cr."updatedAt"
FROM "CourseRequest" cr
JOIN "Course" c ON c."id" = cr."courseId"
WHERE cr."status" = 'ENROLLED'
  AND cr."format" = 'OFFLINE'
  AND cr."userId" IS NOT NULL
  -- Bir odam kursga ikki marta yozilmasin: onlayn yozilishi bo'lsa
  -- (@@unique([userId, courseId])) o'shanisi kuchda qoladi
  AND NOT EXISTS (
    SELECT 1 FROM "Enrollment" e
    WHERE e."userId" = cr."userId" AND e."courseId" = cr."courseId"
  );

-- Ko'chirilgan o'quvchilar kurs hisobiga qo'shilmagan edi
UPDATE "Course" c
SET "studentsCount" = c."studentsCount" + sub."added"
FROM (
  SELECT "courseId", COUNT(*) AS "added"
  FROM "Enrollment"
  WHERE "id" LIKE 'ofl\_%'
  GROUP BY "courseId"
) sub
WHERE c."id" = sub."courseId";
