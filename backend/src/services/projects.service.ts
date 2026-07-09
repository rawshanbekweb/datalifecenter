import { prisma } from '../config/prisma';
import { SupportedLocale } from '../config/locale';
import { ApiError } from '../utils/ApiError';
import { LocalizedString, resolveLocaleDeep } from '../utils/localizedField';

export async function listProjects(locale: SupportedLocale) {
  const projects = await prisma.project.findMany({
    where: { published: true },
    orderBy: [{ featured: 'desc' }, { order: 'asc' }],
  });
  return resolveLocaleDeep(projects, locale);
}

export async function listProjectsAdmin() {
  return prisma.project.findMany({
    orderBy: [{ featured: 'desc' }, { order: 'asc' }],
  });
}

interface ProjectInput {
  title: LocalizedString;
  category: string;
  description: LocalizedString;
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
