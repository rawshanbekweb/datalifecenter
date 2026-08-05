import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { storageProvider } from '../services/storage.service';
import { emailEnabled } from '../services/email.service';

/**
 * Servis sog'lig'i — tashqi monitoring (GitHub Actions, UptimeRobot) shu
 * endpointni so'raydi.
 *
 * "Servis ko'tarilgan" degani hali "ishlayapti" degani emas: baza uzilgan
 * yoki fayl xotirasi sozlanmagan holatda ham eski endpoint 200 qaytaraverardi
 * va nosozlik faqat foydalanuvchi shikoyat qilganda bilinardi. Shuning uchun
 * bu yerda haqiqiy bog'liqliklar tekshiriladi.
 *
 * Baza uzilgan bo'lsa 503 qaytadi — monitoring shu kodga qarab ogohlantiradi.
 *
 * ATAYIN OCHIQ va ATAYIN QISQA: hech qanday versiya, yo'l, env qiymati yoki
 * xato tafsiloti chiqmaydi (ular hujumchiga ma'lumot beradi) — faqat holat.
 */
export const healthHandler = asyncHandler(async (_req: Request, res: Response) => {
  let database: 'ok' | 'down' = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = 'down';
  }

  const data = {
    status: database === 'ok' ? 'ok' : 'degraded',
    database,
    // 'local' = ephemeral disk: yuklangan fayllar keyingi deployda yo'qoladi
    storage: storageProvider,
    // 'off' = BREVO_API_KEY yo'q: parol tiklash va tasdiqlash xatlari jimgina
    // yuborilmaydi. Bu holat monitoringda ko'rinishi uchun shu yerda turibdi
    // (storage kabi — faqat provayder nomi, hech qanday kalit yoki manzil emas).
    email: emailEnabled ? 'brevo' : 'off',
    uptimeSeconds: Math.round(process.uptime()),
  };

  sendSuccess(res, data, database === 'ok' ? 200 : 503);
});
