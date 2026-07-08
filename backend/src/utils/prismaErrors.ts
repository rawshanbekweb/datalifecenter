import { Prisma } from '@prisma/client';

// Prisma 7 driver-adapter (pg) FK xatosini har doim ham P2003 ga o'ramaydi —
// DriverAdapterError ichida postgres kodi (23001/23503) keladi. Ikkala holatni
// ham bitta joyda tekshiramiz, xizmatlar 500 o'rniga tushunarli 409 qaytarsin.
export function isForeignKeyViolation(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2003') {
    return true;
  }
  const own = (err as { code?: unknown })?.code;
  const cause = (err as { cause?: { code?: unknown; originalCode?: unknown } })?.cause;
  const code = [own, cause?.code, cause?.originalCode].find((c) => typeof c === 'string');
  return code === '23001' || code === '23503';
}
