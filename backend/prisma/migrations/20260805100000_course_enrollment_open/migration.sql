-- Kursga yozilish ochiq/yopiqligi. Mavjud kurslar ochiq bo'lib qoladi
-- (DEFAULT true) — migratsiya hech kimning yozilishini to'xtatmaydi.
ALTER TABLE "Course" ADD COLUMN "enrollmentOpen" BOOLEAN NOT NULL DEFAULT true;
