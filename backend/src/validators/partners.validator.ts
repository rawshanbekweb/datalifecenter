import { z } from 'zod';

export const createPartnerSchema = z.object({
  name: z.string().min(2, "Nom kamida 2 ta belgidan iborat bo'lishi kerak"),
  logoUrl: z.string().min(1, 'Logotip manzili kerak'),
  websiteUrl: z.string().optional(),
  category: z.string().min(1, 'Kategoriya kerak'),
  featured: z.boolean().default(false),
  order: z.coerce.number().int().default(0),
});

export const updatePartnerSchema = createPartnerSchema.partial();
