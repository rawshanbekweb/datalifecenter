import { z } from 'zod';

const statItemSchema = z.object({
  label: z.string().min(1, 'Nom kerak').max(40),
  value: z.string().min(1, "Qiymat kerak").max(20),
});

export const heroSchema = z.object({
  stats: z.array(statItemSchema).min(1).max(6),
});

const skillItemSchema = z.object({
  label: z.string().min(1).max(40),
  pct: z.coerce.number().int().min(0).max(100),
});

export const aboutSchema = z.object({
  stats: z.array(
    z.object({ icon: z.string().min(1).max(40), label: z.string().min(1).max(40), value: z.string().min(1).max(20), color: z.string().min(1).max(20) })
  ).min(1).max(6),
  features: z.array(z.string().min(1).max(80)).min(1).max(10),
  skills: z.array(skillItemSchema).min(1).max(8),
  satisfaction: z.array(z.object({ value: z.string().min(1).max(10), label: z.string().min(1).max(30) })).min(1).max(4),
});

const serviceItemSchema = z.object({
  icon: z.string().min(1).max(40),
  title: z.string().min(1).max(60),
  color: z.string().min(1).max(20),
  desc: z.string().min(1).max(300),
  feats: z.array(z.string().min(1).max(60)).min(1).max(6),
});

export const servicesSchema = z.object({
  items: z.array(serviceItemSchema).min(1).max(9),
});

const whyUsItemSchema = z.object({
  icon: z.string().min(1).max(40),
  title: z.string().min(1).max(60),
  color: z.string().min(1).max(20),
  stat: z.string().min(1).max(20),
  desc: z.string().min(1).max(300),
});

export const whyUsSchema = z.object({
  items: z.array(whyUsItemSchema).min(1).max(9),
});

export const contactSchema = z.object({
  phone: z.string().min(1).max(40),
  telegram: z.string().min(1).max(60),
  email: z.string().min(1).max(80),
  address: z.string().min(1).max(120),
  addressSub: z.string().min(1).max(80),
  hours: z.array(z.object({ day: z.string().min(1).max(30), time: z.string().min(1).max(30), closed: z.boolean().default(false) })).min(1).max(7),
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
