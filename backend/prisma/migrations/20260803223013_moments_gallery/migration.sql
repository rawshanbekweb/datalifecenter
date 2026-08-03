-- CreateTable
CREATE TABLE "Moment" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "focusX" INTEGER NOT NULL DEFAULT 50,
    "focusY" INTEGER NOT NULL DEFAULT 50,
    "title" JSONB NOT NULL,
    "caption" JSONB,
    "happenedAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Moment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Moment_published_order_idx" ON "Moment"("published", "order");
