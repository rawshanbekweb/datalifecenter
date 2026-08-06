import { z } from 'zod';
import { localizedString } from './shared/localizedString.validator';

// Ro'yxat cheklovlari uchun o'zbekcha xabarlar — bularsiz zod'ning inglizcha
// "Too small: expected array to have >=1 items" matni admin panelidagi
// toast'ga o'zgarishsiz chiqib ketardi.
// Kamida bitta element shart: bo'sh ro'yxat saytda bo'limni yashirmaydi, balki
// frontend'dagi zaxira (hardcoded) kontentni ko'rsatib yuboradi.
const atLeastOne = (what: string) => `Kamida bitta ${what} bo'lishi kerak`;
const atMost = (n: number, what: string) => `Ko'pi bilan ${n} ta ${what} bo'lishi mumkin`;

const heroStatSchema = z.object({
  label: localizedString(1, 'Nom kerak'),
  value: z.string().min(1, 'Qiymat kerak').max(20, "Qiymat 20 belgidan oshmasligi kerak"),
});

export const heroSchema = z.object({
  stats: z.array(heroStatSchema).min(1, atLeastOne('ko\'rsatkich')).max(6, atMost(6, 'ko\'rsatkich')),
});

const skillItemSchema = z.object({
  label: localizedString(1, 'Nom kerak'),
  pct: z.coerce.number().int().min(0, 'Foiz 0 dan kichik bo\'lmasin').max(100, 'Foiz 100 dan oshmasin'),
});

export const aboutSchema = z.object({
  stats: z
    .array(
      z.object({
        icon: z.string().min(1, 'Ikonka kerak').max(40),
        label: localizedString(1, 'Nom kerak'),
        value: z.string().min(1, 'Qiymat kerak').max(20),
        color: z.string().min(1, 'Rang kerak').max(20),
      })
    )
    .min(1, atLeastOne('statistika kartasi'))
    .max(6, atMost(6, 'statistika kartasi')),
  features: z.array(localizedString(1, 'Matn kerak')).min(1, atLeastOne('afzallik')).max(10, atMost(10, 'afzallik')),
  // Ko'nikma foizi va mamnunlik ko'rsatkichi IXTIYORIY: ularning har qanday
  // qiymati o'lchanmagan bo'lsa o'ylab topilgan raqam bo'lardi. Bo'sh
  // qoldirilsa bosh sahifadagi o'ng ustun kartasi umuman ko'rsatilmaydi
  // (frontend/src/components/About.tsx).
  skills: z.array(skillItemSchema).max(8, atMost(8, "ko'nikma")).default([]),
  satisfaction: z
    .array(z.object({ value: z.string().min(1, 'Qiymat kerak').max(10), label: localizedString(1, 'Nom kerak') }))
    .max(4, atMost(4, 'indikator'))
    .default([]),
});

const serviceItemSchema = z.object({
  icon: z.string().min(1, 'Ikonka kerak').max(40),
  title: localizedString(1, 'Sarlavha kerak'),
  color: z.string().min(1, 'Rang kerak').max(20),
  desc: localizedString(1, 'Tavsif kerak'),
  feats: z.array(localizedString(1, 'Matn kerak')).min(1, atLeastOne('xususiyat')).max(6, atMost(6, 'xususiyat')),
});

export const servicesSchema = z.object({
  items: z.array(serviceItemSchema).min(1, atLeastOne('xizmat')).max(9, atMost(9, 'xizmat')),
});

const whyUsItemSchema = z.object({
  icon: z.string().min(1, 'Ikonka kerak').max(40),
  title: localizedString(1, 'Sarlavha kerak'),
  color: z.string().min(1, 'Rang kerak').max(20),
  stat: z.string().min(1, "Ko'rsatkich kerak").max(20),
  desc: localizedString(1, 'Tavsif kerak'),
});

export const whyUsSchema = z.object({
  items: z.array(whyUsItemSchema).min(1, atLeastOne('karta')).max(9, atMost(9, 'karta')),
});

export const contactSchema = z.object({
  // phone/telegram/email/address til'dan qat'iy nazar bir xil — tarjima qilinmaydi
  phone: z.string().min(1, 'Telefon kerak').max(40),
  telegram: z.string().min(1, 'Telegram kerak').max(60),
  email: z.string().min(1, 'Email kerak').max(80),
  address: z.string().min(1, 'Manzil kerak').max(120),
  addressSub: localizedString(1, 'Manzil izohi kerak'),
  hours: z
    .array(
      z.object({
        day: localizedString(1, 'Kun nomi kerak'),
        time: z.string().min(1, 'Vaqt kerak').max(30),
        closed: z.boolean().default(false),
      })
    )
    .min(1, atLeastOne('ish kuni'))
    .max(7, atMost(7, 'ish kuni')),
});

export const subscriptionPlanSchema = z.object({
  // Obuna bo'limining yagona kaliti. Sozlama umuman yo'q bo'lsa ham bo'lim
  // YOPIQ hisoblanadi (default false) — hozircha to'lov admin orqali
  // rasmiylashtiriladi, talaba saytda pul o'tkazmaydi.
  enabled: z.boolean().default(false),
  price: z.coerce.number().min(0, 'Narx manfiy bo\'lmasin'),
  currency: z.string().min(1, 'Valyuta kerak').max(10),
});

export const SECTION_SCHEMAS: Record<string, z.ZodType> = {
  hero: heroSchema,
  about: aboutSchema,
  services: servicesSchema,
  why_us: whyUsSchema,
  contact: contactSchema,
  subscription_plan: subscriptionPlanSchema,
};

export const SECTION_NAMES = Object.keys(SECTION_SCHEMAS);
