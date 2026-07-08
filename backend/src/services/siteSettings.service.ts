import { prisma } from '../config/prisma';

export async function getAllSettings(): Promise<Record<string, unknown>> {
  const rows = await prisma.siteSetting.findMany();
  return Object.fromEntries(rows.map((row) => [row.section, row.data]));
}

export async function upsertSection(section: string, data: unknown) {
  return prisma.siteSetting.upsert({
    where: { section },
    update: { data: data as object },
    create: { section, data: data as object },
  });
}
