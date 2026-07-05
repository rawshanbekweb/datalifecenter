import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Ism kamida 2 ta belgidan iborat bo\'lishi kerak'),
  email: z.email('Email noto\'g\'ri'),
  password: z.string().min(6, 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.email('Email noto\'g\'ri'),
  password: z.string().min(1, 'Parol kerak'),
});

export const updateProfileSchema = z
  .object({
    name: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak").optional(),
    phone: z.string().nullish().or(z.literal('').transform(() => null)),
    avatarUrl: z.string().url("Rasm URL noto'g'ri").nullish().or(z.literal('').transform(() => null)),
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Kamida bitta maydon yuborilishi kerak' });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Joriy parol kerak'),
  newPassword: z.string().min(6, "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak"),
});
