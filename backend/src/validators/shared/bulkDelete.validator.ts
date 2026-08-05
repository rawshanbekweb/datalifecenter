import { z } from 'zod';

/**
 * Ommaviy o'chirish uchun umumiy sxema — ochiq formalardan keladigan
 * yozuvlar (aloqa xabarlari, kurs so'rovlari, dars savollari) uchun.
 *
 * NEGA KERAK: spam yoki shunchaki gavjum kun to'lqinini bittalab tozalash
 * amalda imkonsiz.
 *
 * NEGA FAQAT ANIQ ID'LAR: "shu statusdagi hammasini o'chir" degan variant
 * qulayroq ko'rinadi, lekin bitta noto'g'ri bosishda haqiqiy murojaatlarni
 * ham olib ketardi va uni qaytarib bo'lmasdi. Admin nimani o'chirayotganini
 * ko'rib turgan bo'lishi kerak.
 *
 * 200 talik chegara: bitta so'rovda cheksiz ID yuborish xato bo'lganda
 * zararni ham, DB tranzaksiyasini ham cheklab bo'lmaydigan qiladi. Admin
 * sahifasi bir sahifadagi (ko'pi bilan 100 ta) yozuvni tanlaydi, ya'ni
 * amalda chegaraga urilmaydi.
 */
export const bulkDeleteSchema = z.object({
  ids: z
    .array(z.string().min(1))
    .min(1, 'Hech narsa tanlanmadi')
    .max(200, "Bir marta ko'pi bilan 200 ta o'chirish mumkin"),
});
