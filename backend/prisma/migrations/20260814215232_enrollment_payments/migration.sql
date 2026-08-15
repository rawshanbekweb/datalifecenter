-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'ONLINE', 'OTHER');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIAL';

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "priceAgreed" DECIMAL(65,30);

-- CreateTable
CREATE TABLE "EnrollmentPayment" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "recordedById" TEXT,
    "note" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnrollmentPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EnrollmentPayment_enrollmentId_paidAt_idx" ON "EnrollmentPayment"("enrollmentId", "paidAt");

-- CreateIndex
CREATE INDEX "EnrollmentPayment_recordedById_idx" ON "EnrollmentPayment"("recordedById");

-- AddForeignKey
ALTER TABLE "EnrollmentPayment" ADD CONSTRAINT "EnrollmentPayment_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentPayment" ADD CONSTRAINT "EnrollmentPayment_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Kelishilgan summa: to'lagan o'quvchida u to'lagan summa (ta'rifiga ko'ra
-- to'liq to'lagan), qolganlarida kursning joriy narxi. Bepul kursda null.
UPDATE "Enrollment" e
SET "priceAgreed" = COALESCE(e."amountPaid", c."price")
FROM "Course" c
WHERE c."id" = e."courseId" AND c."isFree" = false;

-- Mavjud to'lovlarni daftarga ko'chirish: aks holda "to'landi" deb turgan
-- yozilishning puli qayerdan kelgani daftarda ko'rinmasdi.
INSERT INTO "EnrollmentPayment" ("id", "enrollmentId", "amount", "method", "note", "paidAt", "createdAt")
SELECT
  'bf_' || e."id",
  e."id",
  e."amountPaid",
  CASE e."provider"
    WHEN 'click'   THEN 'ONLINE'::"PaymentMethod"
    WHEN 'payme'   THEN 'ONLINE'::"PaymentMethod"
    WHEN 'receipt' THEN 'TRANSFER'::"PaymentMethod"
    WHEN 'admin'   THEN 'CASH'::"PaymentMethod"
    ELSE 'OTHER'::"PaymentMethod"
  END,
  'Daftar joriy etilgunga qadar qayd etilgan to''lov',
  e."enrolledAt",
  CURRENT_TIMESTAMP
FROM "Enrollment" e
WHERE e."amountPaid" IS NOT NULL AND e."amountPaid" > 0;
