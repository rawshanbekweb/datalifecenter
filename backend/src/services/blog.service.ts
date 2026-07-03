import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { slugify } from '../utils/slugify';

interface ListBlogFilters {
  category?: string;
  page: number;
  limit: number;
}

export async function listBlogPosts(filters: ListBlogFilters) {
  const where: Prisma.BlogPostWhereInput = {
    published: true,
    ...(filters.category ? { category: filters.category } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return {
    items,
    pagination: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) },
  };
}

export async function getBlogPostBySlug(slug: string) {
  const post = await prisma.blogPost.findFirst({ where: { slug, published: true } });
  if (!post) {
    throw ApiError.notFound('Maqola topilmadi');
  }
  return prisma.blogPost.update({ where: { id: post.id }, data: { views: { increment: 1 } } });
}

export async function listBlogPostsAdmin() {
  return prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function getBlogPostByIdAdmin(id: string) {
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) {
    throw ApiError.notFound('Maqola topilmadi');
  }
  return post;
}

async function uniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title);
  let candidate = base;
  let suffix = 1;
  while (true) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludeId) return candidate;
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
}

interface BlogPostInput {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  iconKey: string;
  color: string;
  bg: string;
  border: string;
  readMinutes: number;
  tags: string[];
  published: boolean;
  mentorId?: string | null;
}

export async function createBlogPost(input: BlogPostInput) {
  const slug = await uniqueSlug(input.title);
  return prisma.blogPost.create({ data: { ...input, slug } });
}

export async function updateBlogPost(id: string, input: Partial<BlogPostInput>) {
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) {
    throw ApiError.notFound('Maqola topilmadi');
  }
  const slug = input.title && input.title !== post.title ? await uniqueSlug(input.title, id) : undefined;
  return prisma.blogPost.update({ where: { id }, data: { ...input, ...(slug ? { slug } : {}) } });
}

export async function deleteBlogPost(id: string) {
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) {
    throw ApiError.notFound('Maqola topilmadi');
  }
  await prisma.blogPost.delete({ where: { id } });
}
