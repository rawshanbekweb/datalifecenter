import { z } from 'zod';
import { localizedString } from './shared/localizedString.validator';

const heroStatSchema = z.object({
  label: localizedString(1, 'Nom kerak'),
  value: z.string().min(1, 'Qiymat kerak').max(20),
});

export const heroSchema = z.object({
  stats: z.array(heroStatSchema).min(1).max(6),
});

const skillItemSchema = z.object({
  label: localizedString(1, 'Nom kerak'),
  pct: z.coerce.number().int().min(0).max(100),
});

export const aboutSchema = z.object({
  stats: z
    .array(
      z.object({
        icon: z.string().min(1).max(40),
        label: localizedString(1, 'Nom kerak'),
        value: z.string().min(1).max(20),
        color: z.string().min(1).max(20),
      })
    )
    .min(1)
    .max(6),
  features: z.array(localizedString(1, 'Matn kerak')).min(1).max(10),
  skills: z.array(skillItemSchema).min(1).max(8),
  satisfaction: z
    .array(z.object({ value: z.string().min(1).max(10), label: localizedString(1, 'Nom kerak') }))
    .min(1)
    .max(4),
});

const serviceItemSchema = z.object({
  icon: z.string().min(1).max(40),
  title: localizedString(1, 'Sarlavha kerak'),
  color: z.string().min(1).max(20),
  desc: localizedString(1, 'Tavsif kerak'),
  feats: z.array(localizedString(1, 'Matn kerak')).min(1).max(6),
});

export const servicesSchema = z.object({
  items: z.array(serviceItemSchema).min(1).max(9),
});

const whyUsItemSchema = z.object({
  icon: z.string().min(1).max(40),
  title: localizedString(1, 'Sarlavha kerak'),
  color: z.string().min(1).max(20),
  stat: z.string().min(1).max(20),
  desc: localizedString(1, 'Tavsif kerak'),
});

export const whyUsSchema = z.object({
  items: z.array(whyUsItemSchema).min(1).max(9),
});

export const contactSchema = z.object({
  // phone/telegram/email/address til'dan qat'iy nazar bir xil — tarjima qilinmaydi
  phone: z.string().min(1).max(40),
  telegram: z.string().min(1).max(60),
  email: z.string().min(1).max(80),
  address: z.string().min(1).max(120),
  addressSub: localizedString(1, 'Manzil izohi kerak'),
  hours: z
    .array(
      z.object({
        day: localizedString(1, 'Kun nomi kerak'),
        time: z.string().min(1).max(30),
        closed: z.boolean().default(false),
      })
    )
    .min(1)
    .max(7),
});

export const subscriptionPlanSchema = z.object({
  price: z.coerce.number().min(0),
  currency: z.string().min(1).max(10),
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
