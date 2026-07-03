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
