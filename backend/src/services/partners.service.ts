import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export async function listPartners(category?: string) {
  return prisma.partner.findMany({
    where: category ? { category } : undefined,
    orderBy: [{ featured: 'desc' }, { order: 'asc' }],
  });
}

interface PartnerInput {
  name: string;
  logoUrl: string;
  websiteUrl?: string;
  category: string;
  featured: boolean;
  order: number;
}

export async function createPartner(input: PartnerInput) {
  return prisma.partner.create({ data: input });
}

export async function updatePartner(id: string, input: Partial<PartnerInput>) {
  const partner = await prisma.partner.findUnique({ where: { id } });
  if (!partner) {
    throw ApiError.notFound('Hamkor topilmadi');
  }
  return prisma.partner.update({ where: { id }, data: input });
}

export async function deletePartner(id: string) {
  const partner = await prisma.partner.findUnique({ where: { id } });
  if (!partner) {
    throw ApiError.notFound('Hamkor topilmadi');
  }
  await prisma.partner.delete({ where: { id } });
}
