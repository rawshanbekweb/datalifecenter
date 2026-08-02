-- CreateEnum
CREATE TYPE "Department" AS ENUM ('LEADERSHIP', 'ENGINEERING', 'DATA', 'DESIGN', 'MARKETING', 'EDUCATION', 'OPERATIONS');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'TEAM';

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" JSONB NOT NULL,
    "bio" JSONB NOT NULL,
    "department" "Department" NOT NULL DEFAULT 'ENGINEERING',
    "leadership" BOOLEAN NOT NULL DEFAULT false,
    "photoUrl" TEXT,
    "skills" TEXT[],
    "email" TEXT,
    "phone" TEXT,
    "linkedinUrl" TEXT,
    "githubUrl" TEXT,
    "telegramUrl" TEXT,
    "websiteUrl" TEXT,
    "joinedAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "mentorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMemberProject" (
    "teamMemberId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "role" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TeamMemberProject_pkey" PRIMARY KEY ("teamMemberId","projectId")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_slug_key" ON "TeamMember"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_userId_key" ON "TeamMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_mentorId_key" ON "TeamMember"("mentorId");

-- CreateIndex
CREATE INDEX "TeamMember_department_order_idx" ON "TeamMember"("department", "order");

-- CreateIndex
CREATE INDEX "TeamMemberProject_projectId_idx" ON "TeamMemberProject"("projectId");

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "Mentor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMemberProject" ADD CONSTRAINT "TeamMemberProject_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMemberProject" ADD CONSTRAINT "TeamMemberProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
