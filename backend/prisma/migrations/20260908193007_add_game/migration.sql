-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "apkUrl" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "apkSizeBytes" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "downloadsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);
