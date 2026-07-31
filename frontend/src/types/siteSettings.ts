import { LocalizedString } from './locale';

/**
 * Bosh sahifa bo'limlarining shakli.
 *
 * Ilgari bu tiplar AdminSiteSettingsPage ichida edi — endi jonli ko'rinish
 * (SectionPreview) va tayyor shablonlar (siteSettingTemplates) ham aynan shu
 * shakldan foydalanadi, shuning uchun umumiy joyga chiqarildi. Backenddagi
 * validators/siteSettings.validator.ts bilan mos bo'lishi shart.
 */

export interface StatItem { label: LocalizedString; value: string }
export interface AboutStatItem { icon: string; label: LocalizedString; value: string; color: string }
export interface SkillItem { label: LocalizedString; pct: number }
export interface SatisfactionItem { value: string; label: LocalizedString }
export interface ServiceItem { icon: string; title: LocalizedString; color: string; desc: LocalizedString; feats: LocalizedString[] }
export interface WhyUsItem { icon: string; title: LocalizedString; color: string; stat: string; desc: LocalizedString }
export interface HoursItem { day: LocalizedString; time: string; closed: boolean }

export interface HeroData { stats: StatItem[] }
export interface AboutData { stats: AboutStatItem[]; features: LocalizedString[]; skills: SkillItem[]; satisfaction: SatisfactionItem[] }
export interface ServicesData { items: ServiceItem[] }
export interface WhyUsData { items: WhyUsItem[] }
export interface ContactData {
  phone: string;
  telegram: string;
  email: string;
  address: string;
  addressSub: LocalizedString;
  hours: HoursItem[];
}

export interface Sections {
  hero: HeroData;
  about: AboutData;
  services: ServicesData;
  why_us: WhyUsData;
  contact: ContactData;
}

export type SectionKey = keyof Sections;

export const SECTION_KEYS: SectionKey[] = ['hero', 'about', 'services', 'why_us', 'contact'];
