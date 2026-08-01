import { Prisma } from '@prisma/client';

// Prisma 7 driver-adapter (pg) FK xatosini har doim ham P2003 ga o'ramaydi —
// DriverAdapterError ichida postgres kodi (23001/23503) keladi. Ikkala holatni
// ham bitta joyda tekshiramiz, xizmatlar 500 o'rniga tushunarli 409 qaytarsin.
export function isForeignKeyViolation(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
    return true;
  }
  return pgCodeOf(err) === '23001' || pgCodeOf(err) === '23503';
}

// Noyoblik buzilishi (P2002 / postgres 23505) — parallel ikki so'rov bir xil
// yozuvni yaratmoqchi bo'lganda "mavjudini olamiz" yo'liga o'tish uchun
export function isUniqueViolation(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return true;
  }
  return pgCodeOf(err) === '23505';
}

function pgCodeOf(err: unknown): string | undefined {
  const own = (err as { code?: unknown })?.code;
  const cause = (err as { cause?: { code?: unknown; originalCode?: unknown } })?.cause;
  return [own, cause?.code, cause?.originalCode].find((c): c is string => typeof c === 'string');
}
