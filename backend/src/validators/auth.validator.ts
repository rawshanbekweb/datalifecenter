import { z } from 'zod';
import { imageFocusFields } from './shared/imageFocus.validator';
import { personName } from './shared/personName.validator';
import { optionalPhone } from './shared/phone.validator';

// Parolning eng kam uzunligi. 6 ta belgi bcrypt bilan ham zamonaviy
// parol-lug'at hujumiga bardosh bermaydi — YANGI parollar uchun 8 ta.
// DIQQAT: `loginSchema` bunga bog'lanmaydi (u faqat `min(1)` tekshiradi),
// aks holda eski, 6 belgili parolli foydalanuvchilar tizimga kira olmay
// qolardi — ular parolni almashtirganda avtomatik yangi qoidaga o'tadi.
const password = z.string().min(8, "Parol kamida 8 ta belgidan iborat bo'lishi kerak");

export const registerSchema = z.object({
  name: personName,
  email: z.email('Email noto\'g\'ri'),
  password,
  phone: optionalPhone,
});

export const loginSchema = z.object({
  email: z.email('Email noto\'g\'ri'),
  password: z.string().min(1, 'Parol kerak'),
});

export const updateProfileSchema = z
  .object({
    name: personName.optional(),
    phone: optionalPhone,
    avatarUrl: z.string().url("Rasm URL noto'g'ri").nullish().or(z.literal('').transform(() => null)),
    ...imageFocusFields,
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'Kamida bitta maydon yuborilishi kerak' });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Joriy parol kerak'),
  newPassword: password,
});

export const forgotPasswordSchema = z.object({
  email: z.email("Email noto'g'ri"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token kerak'),
  newPassword: password,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token kerak'),
});
