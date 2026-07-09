-- Ko'p tillilik: tarjima qilinadigan matn ustunlarini text -> jsonb ga o'tkazish.
-- Mavjud qiymat {uz: <eski qiymat>} shaklida saqlanadi (ma'lumot yo'qolmaydi).

-- Mentor
ALTER TABLE "Mentor" ALTER COLUMN "bio" TYPE jsonb USING jsonb_build_object('uz', "bio");
ALTER TABLE "Mentor" ALTER COLUMN "specialty" TYPE jsonb USING jsonb_build_object('uz', "specialty");
ALTER TABLE "Mentor" ALTER COLUMN "position" TYPE jsonb USING (CASE WHEN "position" IS NULL THEN NULL ELSE jsonb_build_object('uz', "position") END);

-- Course
ALTER TABLE "Course" ALTER COLUMN "title" TYPE jsonb USING jsonb_build_object('uz', "title");
ALTER TABLE "Course" ALTER COLUMN "subtitle" TYPE jsonb USING (CASE WHEN "subtitle" IS NULL THEN NULL ELSE jsonb_build_object('uz', "subtitle") END);
ALTER TABLE "Course" ALTER COLUMN "description" TYPE jsonb USING jsonb_build_object('uz', "description");

-- LiveSession
ALTER TABLE "LiveSession" ALTER COLUMN "title" TYPE jsonb USING jsonb_build_object('uz', "title");
ALTER TABLE "LiveSession" ALTER COLUMN "description" TYPE jsonb USING (CASE WHEN "description" IS NULL THEN NULL ELSE jsonb_build_object('uz', "description") END);

-- Module
ALTER TABLE "Module" ALTER COLUMN "title" TYPE jsonb USING jsonb_build_object('uz', "title");
ALTER TABLE "Module" ALTER COLUMN "description" TYPE jsonb USING (CASE WHEN "description" IS NULL THEN NULL ELSE jsonb_build_object('uz', "description") END);

-- Lesson
ALTER TABLE "Lesson" ALTER COLUMN "title" TYPE jsonb USING jsonb_build_object('uz', "title");
ALTER TABLE "Lesson" ALTER COLUMN "content" TYPE jsonb USING (CASE WHEN "content" IS NULL THEN NULL ELSE jsonb_build_object('uz', "content") END);

-- Announcement
ALTER TABLE "Announcement" ALTER COLUMN "title" TYPE jsonb USING jsonb_build_object('uz', "title");
ALTER TABLE "Announcement" ALTER COLUMN "body" TYPE jsonb USING jsonb_build_object('uz', "body");

-- Project
ALTER TABLE "Project" ALTER COLUMN "title" TYPE jsonb USING jsonb_build_object('uz', "title");
ALTER TABLE "Project" ALTER COLUMN "description" TYPE jsonb USING jsonb_build_object('uz', "description");

-- Testimonial
ALTER TABLE "Testimonial" ALTER COLUMN "role" TYPE jsonb USING jsonb_build_object('uz', "role");
ALTER TABLE "Testimonial" ALTER COLUMN "text" TYPE jsonb USING jsonb_build_object('uz', "text");

-- BlogPost
ALTER TABLE "BlogPost" ALTER COLUMN "title" TYPE jsonb USING jsonb_build_object('uz', "title");
ALTER TABLE "BlogPost" ALTER COLUMN "excerpt" TYPE jsonb USING jsonb_build_object('uz', "excerpt");
ALTER TABLE "BlogPost" ALTER COLUMN "content" TYPE jsonb USING jsonb_build_object('uz', "content");
