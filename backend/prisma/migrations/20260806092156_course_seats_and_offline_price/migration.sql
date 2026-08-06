-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "offlinePrice" DECIMAL(65,30),
ADD COLUMN     "offlineSeats" INTEGER,
ADD COLUMN     "onlineSeats" INTEGER;
