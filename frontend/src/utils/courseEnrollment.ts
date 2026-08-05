import type { CourseFormat } from '../components/courses/CourseFormatBadge';

/**
 * Kursning qabul holati — formatga QARAB hisoblanadi.
 *
 * NEGA ALOHIDA FAYL: bu mantiq kurs kartasida ham, kurs sahifasida ham
 * kerak va ikkalasida boshqacha yozilsa, karta "Tez orada" desa-yu sahifa
 * yozilish tugmasini ko'rsatadigan holat kelib chiqardi.
 *
 * Qoida oddiy: HYBRID kursda ikki yo'l bor va ular mustaqil — biri yopilsa
 * kurs hali ham qabul qilyapti, shuning uchun "Tez orada" FAQAT ikkalasi
 * ham yopilganda ko'rsatiladi. ONLINE/OFFLINE kursda esa faqat o'ziga
 * tegishli bayroq qaraladi.
 *
 * Maydonlar eski javoblarda bo'lmasligi mumkin — `!== false` bilan
 * tekshiriladi, ya'ni noma'lum holat "ochiq" deb qabul qilinadi.
 */
export interface CourseEnrollmentFlags {
  format?: CourseFormat | null;
  onlineEnrollmentOpen?: boolean;
  offlineEnrollmentOpen?: boolean;
}

export interface EnrollmentState {
  /** Onlayn yozilish tugmasi ishlaydimi (ONLINE va HYBRID uchun) */
  onlineOpen: boolean;
  /** Offline guruhga qabul ochiqmi (OFFLINE va HYBRID uchun) */
  offlineOpen: boolean;
  /** Kursda umuman ochiq yo'l qolmaganmi — kartadagi "Tez orada" shunga qarab */
  allClosed: boolean;
  /** Faqat bitta yo'l yopilgan (gibrid kursda "onlayn tez orada" kabi izoh uchun) */
  partiallyClosed: boolean;
}

export function enrollmentState(course: CourseEnrollmentFlags): EnrollmentState {
  const format = course.format ?? 'ONLINE';
  const online = course.onlineEnrollmentOpen !== false;
  const offline = course.offlineEnrollmentOpen !== false;

  // Formatga tegishli bo'lmagan bayroq e'tiborga olinmaydi: ONLINE kursda
  // offline bayrog'i yopiq tursa ham u hech narsaga ta'sir qilmasligi kerak.
  const onlineOpen = format === 'OFFLINE' ? false : online;
  const offlineOpen = format === 'ONLINE' ? false : offline;

  const relevant = format === 'HYBRID' ? [online, offline] : format === 'ONLINE' ? [online] : [offline];

  return {
    onlineOpen,
    offlineOpen,
    allClosed: relevant.every((open) => !open),
    partiallyClosed: relevant.some((open) => !open) && relevant.some((open) => open),
  };
}
