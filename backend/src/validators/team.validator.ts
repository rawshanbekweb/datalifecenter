import { z } from 'zod';
import { localizedString, localizedStringNullish } from './shared/localizedString.validator';
import { imageFocusFields } from './shared/imageFocus.validator';

export const DEPARTMENTS = [
  'LEADERSHIP',
  'ENGINEERING',
  'DATA',
  'DESIGN',
  'MARKETING',
  'EDUCATION',
  'OPERATIONS',
] as const;

const optionalId = z.string().nullish().or(z.literal('').transform(() => null));

// Loyihaga biriktirish — `role` bo'sh bo'lsa a'zoning lavozimi ko'rsatiladi
const projectLink = z.object({
  projectId: z.string().min(1, 'Loyiha tanlanmagan'),
  role: localizedStringNullish(),
  order: z.coerce.number().int().optional(),
});

// A'zoning o'zi ham, admin ham tahrirlaydigan umumiy maydonlar
const selfFields = {
  name: z.string().min(2, "Ism kamida 2 ta belgidan iborat bo'lishi kerak"),
  position: localizedString(2, 'Lavozim kiritilishi shart'),
  bio: localizedString(5, "Bio kamida 5 ta belgidan iborat bo'lishi kerak"),
  photoUrl: z.string().optional(),
  ...imageFocusFields,
  skills: z.array(z.string().min(1)).max(20, "Ko'pi bilan 20 ta ko'nikma").default([]),
  email: z.string().email("Email noto'g'ri").or(z.literal('')).optional(),
  phone: z.string().optional(),
  linkedinUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  telegramUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
};

// Faqat adminda — xodim o'zini rahbariyatga ko'chira olmasligi kerak
const adminFields = {
  department: z.enum(DEPARTMENTS),
  leadership: z.boolean().default(false),
  joinedAt: z.string().nullish().or(z.literal('').transform(() => null)),
  order: z.coerce.number().int().default(0),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  userId: optionalId,
  mentorId: optionalId,
  projects: z.array(projectLink).max(50).optional(),
};

export const createTeamMemberSchema = z.object({ ...selfFields, ...adminFields });

// .partial() emas — default'li maydonlar (featured, published, order) qisman
// so'rovda jimgina qayta yozilib ketmasligi uchun har biri alohida .optional()
export const updateTeamMemberSchema = z.object({
  name: selfFields.name.optional(),
  position: selfFields.position.optional(),
  bio: selfFields.bio.optional(),
  photoUrl: selfFields.photoUrl,
  focusX: selfFields.focusX,
  focusY: selfFields.focusY,
  skills: z.array(z.string().min(1)).max(20, "Ko'pi bilan 20 ta ko'nikma").optional(),
  email: selfFields.email,
  phone: selfFields.phone,
  linkedinUrl: selfFields.linkedinUrl,
  githubUrl: selfFields.githubUrl,
  telegramUrl: selfFields.telegramUrl,
  websiteUrl: selfFields.websiteUrl,
  department: z.enum(DEPARTMENTS).optional(),
  leadership: z.boolean().optional(),
  joinedAt: adminFields.joinedAt,
  order: z.coerce.number().int().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  userId: optionalId,
  mentorId: optionalId,
  projects: adminFields.projects,
});

// Jamoa a'zosi o'z profilini tahrirlaydi — admin maydonlariga tegmaydi.
// strictObject ataylab: `department`/`leadership` kabi begona maydon jimgina
// tashlab yuborilsa, xodim "saqlandi" degan javobni ko'rib, o'zgarish
// bo'lmaganini bilmay qolardi. Endi aniq xato qaytadi.
export const updateTeamMemberMeSchema = z.strictObject({
  name: selfFields.name.optional(),
  position: selfFields.position.optional(),
  bio: selfFields.bio.optional(),
  photoUrl: selfFields.photoUrl,
  focusX: selfFields.focusX,
  focusY: selfFields.focusY,
  skills: z.array(z.string().min(1)).max(20, "Ko'pi bilan 20 ta ko'nikma").optional(),
  email: selfFields.email,
  phone: selfFields.phone,
  linkedinUrl: selfFields.linkedinUrl,
  githubUrl: selfFields.githubUrl,
  telegramUrl: selfFields.telegramUrl,
  websiteUrl: selfFields.websiteUrl,
});
