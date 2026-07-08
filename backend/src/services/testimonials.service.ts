import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

export async function listTestimonials() {
  return prisma.testimonial.findMany({
    where: { published: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function listTestimonialsAdmin() {
  return prisma.testimonial.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
}

interface TestimonialInput {
  name: string;
  role: string;
  avatarUrl?: string;
  text: string;
  rating: number;
  published: boolean;
  order: number;
}

export async function createTestimonial(input: TestimonialInput) {
  return prisma.testimonial.create({ data: input });
}

export async function updateTestimonial(id: string, input: Partial<TestimonialInput>) {
  const testimonial = await prisma.testimonial.findUnique({ where: { id } });
  if (!testimonial) {
    throw ApiError.notFound('Sharh topilmadi');
  }
  return prisma.testimonial.update({ where: { id }, data: input });
}

export async function deleteTestimonial(id: string) {
  const testimonial = await prisma.testimonial.findUnique({ where: { id } });
  if (!testimonial) {
    throw ApiError.notFound('Sharh topilmadi');
  }
  await prisma.testimonial.delete({ where: { id } });
}
