-- Bitta `enrollmentOpen` o'rniga formatga qarab ikkita bayroq.
--
-- NEGA: HYBRID kursda onlayn va offline qabul BOG'LIQ EMAS — onlayn guruh
-- to'lib qolgani offline guruh ham yopiq degani emas. Bitta bayroq bilan
-- ikkalasini birdan yopishga majbur bo'lardik.
--
-- Ko'chirish: eski qiymat IKKALA ustunga ham beriladi, ya'ni migratsiya
-- hech kimning yozilishini o'zgartirmaydi — yopiq kurs yopiqligicha,
-- ochig'i ochiqligicha qoladi.
ALTER TABLE "Course" ADD COLUMN "onlineEnrollmentOpen"  BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Course" ADD COLUMN "offlineEnrollmentOpen" BOOLEAN NOT NULL DEFAULT true;

UPDATE "Course"
   SET "onlineEnrollmentOpen"  = "enrollmentOpen",
       "offlineEnrollmentOpen" = "enrollmentOpen";

ALTER TABLE "Course" DROP COLUMN "enrollmentOpen";
