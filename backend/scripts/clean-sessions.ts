import 'dotenv/config';
import { prisma } from '../src/config/prisma';

/**
 * Eskirgan seans yozuvlarini o'chiradi.
 *
 * NEGA KERAK: har login yangi qator yaratadi va yopilgani ham o'chmaydi.
 * Bir yildan keyin faol foydalanuvchida yuzlab o'lik qator yig'iladi —
 * ular hech narsaga kerak emas, lekin IP saqlagani uchun shaxsiy ma'lumot
 * bo'lib turaveradi.
 *
 * NIMA O'CHADI (ikkalasi ham 30 kundan eski):
 *   1. Yopilgan seanslar (`revokedAt` bor)
 *   2. Yopilmagan, lekin 30 kundan beri ishlatilmagan seanslar — token
 *      muddati (7 kun) allaqachon tugagan, ya'ni ular baribir o'lik
 *
 * Standart holatda FAQAT sanaydi. O'chirish uchun ataylab `--apply` kerak.
 *
 * Ishga tushirish:
 *   npm run clean:sessions
 *   npm run clean:sessions -- --apply
 *   $env:DATABASE_URL='<prod>'; npm run clean:sessions -- --apply
 */

const APPLY = process.argv.includes('--apply');
const DAYS = Number(process.argv.find((a) => a.startsWith('--days='))?.split('=')[1] ?? 30);

async function main(): Promise<void> {
  if (!Number.isFinite(DAYS) || DAYS < 1) {
    console.error("--days butun va 1 dan katta bo'lishi kerak");
    process.exit(1);
  }

  const cutoff = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000);
  const where = {
    OR: [
      { revokedAt: { lt: cutoff } },
      { lastSeenAt: { lt: cutoff } },
    ],
  };

  try {
    const total = await prisma.session.count();
    const stale = await prisma.session.count({ where });

    console.log(`Jami seans: ${total}`);
    console.log(`${DAYS} kundan eski (yopilgan yoki ishlatilmagan): ${stale}`);

    if (stale === 0) {
      console.log("O'chiriladigan narsa yo'q.");
      return;
    }

    if (!APPLY) {
      console.log(`\nBu QURUQ ishga tushirish. O'chirish uchun: npm run clean:sessions -- --apply`);
      return;
    }

    const { count } = await prisma.session.deleteMany({ where });
    console.log(`\nO'chirildi: ${count}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
