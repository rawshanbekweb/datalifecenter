import { prisma } from '../config/prisma';
import { SupportedLocale } from '../config/locale';
import { resolveLocaleDeep } from '../utils/localizedField';

// Ochiq (public) — har bir bo'limdagi tarjima maydonlari so'ralgan tilga tekislanadi
export async function getAllSettings(locale: SupportedLocale): Promise<Record<string, unknown>> {
  const rows = await prisma.siteSetting.findMany();
  const raw = Object.fromEntries(rows.map((row) => [row.section, row.data]));
  return resolveLocaleDeep(raw, locale);
}

// Admin tahrirlash paneli — xom {uz,ru,kaa,en} obyektlari (barcha til tab'lari uchun)
export async function getAllSettingsAdmin(): Promise<Record<string, unknown>> {
  const rows = await prisma.siteSetting.findMany();
  return Object.fromEntries(rows.map((row) => [row.section, row.data]));
}

export async function upsertSection(section: string, data: unknown) {
  return prisma.siteSetting.upsert({
    where: { section },
    update: { data: data as object },
    create: { section, data: data as object },
  });
}
