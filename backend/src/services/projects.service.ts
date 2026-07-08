import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export async function listProjects() {
  return prisma.project.findMany({
    where: { published: true },
    orderBy: [{ featured: 'desc' }, { order: 'asc' }],
  });
}

export async function listProjectsAdmin() {
  return prisma.project.findMany({
    orderBy: [{ featured: 'desc' }, { order: 'asc' }],
  });
}

interface ProjectInput {
  title: string;
  category: string;
  description: string;
  techStack: string[];
  screenshotUrl: string;
  liveUrl?: string;
  repoUrl?: string;
  order: number;
  featured: boolean;
  published: boolean;
}

export async function createProject(input: ProjectInput) {
  return prisma.project.create({ data: input });
}

export async function updateProject(id: string, input: Partial<ProjectInput>) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    throw ApiError.notFound('Loyiha topilmadi');
  }
  return prisma.project.update({ where: { id }, data: input });
}

export async function deleteProject(id: string) {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    throw ApiError.notFound('Loyiha topilmadi');
  }
  await prisma.project.delete({ where: { id } });
}
