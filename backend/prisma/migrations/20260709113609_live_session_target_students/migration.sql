-- AlterTable
ALTER TABLE "LiveSession" ADD COLUMN     "targetStudentIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
