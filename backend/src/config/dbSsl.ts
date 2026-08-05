import type { ConnectionOptions } from 'node:tls';

/**
 * Postgres hostiga qarab SSL sozlamasini beradi.
 *
 * NEGA KERAK: bulut provayderlari SSL talab qiladi, lekin ularning ulanish
 * satrida `sslmode` ko'rsatilmagan bo'lishi mumkin va sertifikat siyosati
 * har xil. Ilgari bu shart oltita faylda alohida-alohida yozilgan edi
 * (`/\.render\.com/`), shuning uchun provayder almashganda birortasi
 * yangilanmay qolib ketardi. Endi bitta joyda.
 *
 *   - Render (external `*.render.com`): SSL SHART, lekin sertifikat ommaviy
 *     CA'dan emas — tekshiruv o'chiriladi.
 *   - Neon (`*.neon.tech`): SSL SHART va sertifikati HAQIQIY ommaviy CA'dan —
 *     shuning uchun tekshiruv YOQILGAN holda qoldiriladi (o'chirish xavfsizlikni
 *     bekorga pasaytirardi).
 *   - localhost va boshqalar: hech narsa qo'shilmaydi, ulanish satri o'zi hal qiladi.
 */
export function pgSsl(databaseUrl: string | undefined): { ssl?: boolean | ConnectionOptions } {
  const url = databaseUrl ?? '';
  if (/\.render\.com/.test(url)) return { ssl: { rejectUnauthorized: false } };
  if (/\.neon\.tech/.test(url)) return { ssl: true };
  return {};
}
