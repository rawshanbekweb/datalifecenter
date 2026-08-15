import type { TFunction } from 'i18next';

/**
 * Guruh jadvali bilan ishlash — hafta kunlari va keyingi dars vaqti.
 *
 * NEGA FRONTENDDA HISOBLANADI: guruh jadvali takrorlanuvchi qoida
 * (`weekdays` + `startTime`), aniq vaqt nuqtasi emas. "18:00" — o'quvchi
 * turgan joyning soati. Buni serverda absolyut vaqtga aylantirish uchun
 * mintaqani bilish kerak bo'lardi; brauzer esa uni allaqachon biladi,
 * shuning uchun hisob shu yerda va mintaqa xatolari umuman yuzaga kelmaydi.
 */

export interface GroupSchedule {
  startsAt: string;
  endsAt?: string | null;
  weekdays: number[];
  startTime?: string | null;
  durationMin?: number;
}

/** "Du, Cho, Ju" — bo'sh ro'yxatda bo'sh satr */
export function formatWeekdays(weekdays: number[], t: TFunction): string {
  return [...weekdays]
    .sort((a, b) => a - b)
    .map((d) => t(`weekdayShort.${d}`))
    .join(', ');
}

/** "Du, Cho, Ju · 18:00" — jadvalning bir qatorli ko'rinishi */
export function formatSchedule(group: GroupSchedule, t: TFunction): string {
  const days = formatWeekdays(group.weekdays, t);
  if (!days) return group.startTime ?? '';
  return group.startTime ? `${days} · ${group.startTime}` : days;
}

/**
 * Keyingi darsning aniq vaqti (mahalliy). Jadval to'liq emas (kun yoki vaqt
 * ko'rsatilmagan) yoki guruh tugagan bo'lsa — null.
 *
 * Ikki hafta oldinga qaraladi: haftalik takror bo'lgani uchun mos kun shu
 * oraliqda albatta uchraydi, uchramasa jadval bo'sh degani.
 */
export function nextLessonAt(group: GroupSchedule, from: Date = new Date()): Date | null {
  if (group.weekdays.length === 0 || !group.startTime) return null;

  const [hours, minutes] = group.startTime.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  // Guruh hali boshlanmagan bo'lsa qidiruv boshlanish sanasidan yuradi
  const start = new Date(group.startsAt);
  const cursor = new Date(Math.max(from.getTime(), start.getTime()));
  cursor.setHours(0, 0, 0, 0);
  const end = group.endsAt ? new Date(group.endsAt) : null;

  for (let i = 0; i < 14; i += 1) {
    const day = new Date(cursor);
    day.setDate(day.getDate() + i);
    if (!group.weekdays.includes(day.getDay())) continue;

    day.setHours(hours, minutes, 0, 0);
    // Bugungi dars allaqachon o'tib ketgan bo'lsa keyingisiga o'tamiz
    if (day.getTime() < from.getTime()) continue;
    if (end && day.getTime() > end.getTime()) return null;
    return day;
  }
  return null;
}
