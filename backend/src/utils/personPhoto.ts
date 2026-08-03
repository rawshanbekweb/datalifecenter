/**
 * Mentor va jamoa profili o'rtasida rasmni bo'lishish.
 *
 * NEGA KERAK: bir odam ikkita yozuvda bo'lishi mumkin — `Mentor` (saytdagi
 * "Mentorlar" bo'limi) va `TeamMember` ("Jamoa" bo'limi), ular `mentorId`
 * orqali bog'lanadi. Rasm esa har birida O'Z ustunida saqlanadi. Natijada
 * admin mentor kartasiga surat yuklasa, xuddi shu odam jamoa bo'limida
 * rasmsiz turaverardi (va aksincha) — foydalanuvchi buni "rasm hamma joyda
 * birdek tushmayapti" deb ko'rgan.
 *
 * Yechim o'qish paytida: o'z rasmi bo'lmasa, bog'langan profilnikini oladi.
 * Ustunlar dublikatlanmaydi — admin rasmni istalgan bittasiga yuklaydi.
 *
 * Fokus nuqtasi rasm bilan BIRGA ko'chadi: aks holda begona rasm o'zining
 * emas, qabul qiluvchi yozuvning fokusi bilan kadrlanib, yuz kadrdan
 * chiqib ketardi.
 */
export interface PersonPhoto {
  photoUrl: string | null;
  focusX: number;
  focusY: number;
}

export function inheritPhoto<T extends PersonPhoto>(entity: T, linked: PersonPhoto | null | undefined): T {
  if (entity.photoUrl || !linked?.photoUrl) return entity;
  return { ...entity, photoUrl: linked.photoUrl, focusX: linked.focusX, focusY: linked.focusY };
}
