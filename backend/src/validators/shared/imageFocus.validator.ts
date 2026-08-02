import { z } from 'zod';

/**
 * Rasmning fokus nuqtasi — doira/kvadrat kadrga kesilganda markazda qoladigan joy.
 *
 * Foizda saqlanadi va frontendda to'g'ridan-to'g'ri CSS `object-position` ga
 * tushadi. 0..100 oralig'i MAJBURIY: oraliqdan tashqari qiymat rasmni kadrdan
 * butunlay surib yuboradi va bo'sh joy ko'rinadi.
 *
 * Ikkalasi ham ixtiyoriy — berilmasa bazadagi default (50/50, ya'ni markaz)
 * qoladi, demak eski yozuvlar va eski mijozlar avvalgidek ishlayveradi.
 */
const percent = z.coerce.number().int().min(0, 'Fokus 0 dan kichik bo\'lmaydi').max(100, 'Fokus 100 dan katta bo\'lmaydi');

export const imageFocusFields = {
  focusX: percent.optional(),
  focusY: percent.optional(),
};
