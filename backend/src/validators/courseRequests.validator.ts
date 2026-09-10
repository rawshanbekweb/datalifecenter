import { z } from 'zod';

// O'zbekiston raqamlari uchun keng shakl: +998 90 123 45 67, 901234567 va h.k.
const phone = z
  .string()
  .trim()
  .min(7, 'Telefon raqami noto‘g‘ri')
  .max(25, 'Telefon raqami noto‘g‘ri')
  .regex(/^[+0-9\s()-]+$/, 'Telefon raqamida faqat raqam va + ( ) - belgilari bo‘lishi mumkin');

export const createCourseRequestSchema = z.object({
  courseId: z.string().min(1, 'Kurs tanlanishi kerak'),
  // HYBRID yuborilmaydi — o'quvchi aniq bittasini tanlashi kerak
  format: z.enum(['ONLINE', 'OFFLINE'], { message: 'Format tanlanishi kerak' }),
  name: z.string().trim().min(2, 'Ism kamida 2 ta belgidan iborat bo‘lsin').max(120),
  phone,
  // 2026-09-10: barcha maydonlar majburiy — email endi ixtiyoriy emas, chunki
  // guruh/to'lov/qabul haqidagi xabarlar aynan shu manzilga yuboriladi.
  email: z.string().trim().min(1, 'Email kiritilishi shart').email('Email noto‘g‘ri').max(200),
  note: z.string().trim().max(2000, 'Izoh juda uzun').optional().or(z.literal('')),
});

// So'rovni tasdiqlash: guruh tanlash ixtiyoriy. `.default({})` shart —
// tugma tanasiz ham bosiladi va o'shanda req.body butunlay `undefined`
// bo'ladi (JSON tanasi yo'q so'rovda express uni to'ldirmaydi).
export const enrollFromRequestSchema = z
  .object({
    groupId: z.string().min(1).nullish(),
    // Oldindan to'lov. Berilmasa kelishilgan summa to'liq to'langan deb
    // yoziladi; 0 esa "hozircha to'lanmadi" degani (qarzdorlarga tushadi).
    paidAmount: z.coerce.number().min(0, "To'lov summasi manfiy bo'lmasligi kerak").nullish(),
  })
  .default({});

export const listCourseRequestsQuerySchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'ENROLLED', 'REJECTED']).optional(),
  format: z.enum(['ONLINE', 'OFFLINE']).optional(),
  search: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Excelga (CSV) yuklab olish — sahifalash yo'q, joriy filtrga mos hammasi
export const exportCourseRequestsQuerySchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'ENROLLED', 'REJECTED']).optional(),
  format: z.enum(['ONLINE', 'OFFLINE']).optional(),
  search: z.string().trim().max(120).optional(),
});

export const updateCourseRequestSchema = z
  .object({
    status: z.enum(['NEW', 'CONTACTED', 'ENROLLED', 'REJECTED']).optional(),
    // Bo'sh javob hech narsa qilmaydi — uni jimgina qabul qilib, "yuborildi"
    // taassurotini bermaslik uchun aniq xato qaytariladi
    reply: z.string().trim().min(1, 'Javob bo‘sh bo‘lmasligi kerak').max(4000, 'Javob juda uzun').optional(),
  })
  .refine((data) => data.status !== undefined || data.reply !== undefined, {
    message: 'Hech narsa o‘zgartirilmadi',
  });
