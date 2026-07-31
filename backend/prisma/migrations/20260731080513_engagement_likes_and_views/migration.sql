-- CreateEnum
CREATE TYPE "EngagementTarget" AS ENUM ('BLOG_POST', 'PROJECT', 'COURSE', 'TESTIMONIAL');

-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN     "likesCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "likesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "likesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Testimonial" ADD COLUMN     "likesCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ContentLike" (
    "id" TEXT NOT NULL,
    "contentType" "EngagementTarget" NOT NULL,
    "contentId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentLike_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentLike_contentType_contentId_idx" ON "ContentLike"("contentType", "contentId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentLike_contentType_contentId_deviceId_key" ON "ContentLike"("contentType", "contentId", "deviceId");
