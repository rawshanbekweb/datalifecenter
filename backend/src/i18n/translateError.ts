import { DEFAULT_LOCALE, SupportedLocale } from '../config/locale';
import { ERROR_MESSAGES } from './errorMessages';

/**
 * Xabarni lug'at kalitiga keltiradi.
 *
 * Kodda apostrof ikki xil yozilgan — ASCII (') va tipografik (‘ / ’ / ʻ / ʼ).
 * Masalan "So'rov topilmadi" va "So‘rov topilmadi" ikkalasi ham bor edi.
 * Normalizatsiyasiz ular ikki alohida kalit bo'lardi va biri tarjimasiz
 * qolardi, shuning uchun hammasi ASCII apostrofga keltiriladi.
 */
export function normalizeMessageKey(message: string): string {
  return message
    .replace(/[‘’ʻʼ´`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Xato matnini so'rov tiliga o'giradi.
 *
 * Kalit — o'zbekcha matnning o'zi (errorMessages.ts sarlavhasiga qarang), shu
 * sababli `uz` uchun hech narsa qilinmaydi. Lug'atda yo'q matn (dinamik yoki
 * shablondan yig'ilgan) o'zgarishsiz qaytadi — bu ATAYIN: tarjimasi yo'q
 * xabar ko'rinmay qolgandan ko'ra o'zbekcha ko'ringani yaxshiroq.
 */
export function translateErrorMessage(message: string, locale: SupportedLocale | undefined): string {
  const target = locale ?? DEFAULT_LOCALE;
  if (target === 'uz') return message;

  const entry = ERROR_MESSAGES[normalizeMessageKey(message)];
  return entry ? entry[target] : message;
}
