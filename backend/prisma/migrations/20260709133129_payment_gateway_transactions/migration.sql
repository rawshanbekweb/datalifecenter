-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('CLICK', 'PAYME');

-- CreateEnum
CREATE TYPE "PaymentTxState" AS ENUM ('CREATED', 'PERFORMED', 'CANCELLED', 'CANCELLED_AFTER_PERFORM');

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerTxId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "state" "PaymentTxState" NOT NULL DEFAULT 'CREATED',
    "reason" INTEGER,
    "createTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performTime" TIMESTAMP(3),
    "cancelTime" TIMESTAMP(3),

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentTransaction_enrollmentId_idx" ON "PaymentTransaction"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_provider_providerTxId_key" ON "PaymentTransaction"("provider", "providerTxId");

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
