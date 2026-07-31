-- CreateTable
CREATE TABLE "ContentView" (
    "id" TEXT NOT NULL,
    "contentType" "EngagementTarget" NOT NULL,
    "contentId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentView_contentType_contentId_idx" ON "ContentView"("contentType", "contentId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentView_contentType_contentId_deviceId_key" ON "ContentView"("contentType", "contentId", "deviceId");
