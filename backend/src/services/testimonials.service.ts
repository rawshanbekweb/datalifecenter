import { prisma } from '../config/prisma';
import { SupportedLocale } from '../config/locale';
import { ApiError } from '../utils/ApiError';
import { LocalizedString, resolveLocaleDeep } from '../utils/localizedField';

export async function listTestimonials(locale: SupportedLocale) {
  const testimonials = await prisma.testimonial.findMany({
    where: { published: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
  return resolveLocaleDeep(testimonials, locale);
}

export async function listTestimonialsAdmin() {
  return prisma.testimonial.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  });
}

interface TestimonialInput {
  name: string;
  role: LocalizedString;
  avatarUrl?: string;
  text: LocalizedString;
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
