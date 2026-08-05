-- CreateTable
CREATE TABLE "EngagementDaily" (
    "id" TEXT NOT NULL,
    "contentType" "EngagementTarget" NOT NULL,
    "contentId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EngagementDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EngagementDaily_day_idx" ON "EngagementDaily"("day");

-- CreateIndex
CREATE UNIQUE INDEX "EngagementDaily_contentType_contentId_day_key" ON "EngagementDaily"("contentType", "contentId", "day");
