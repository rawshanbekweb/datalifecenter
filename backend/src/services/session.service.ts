import { Request } from 'express';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

/**
 * Kirilgan seanslar ustidagi amallar.
 *
 * `Session` yozuvi har login'da yaratiladi va uning id'si tokenga `sid` bo'lib
 * tushadi — shu tufayli "Chiqish" haqiqatan ham tokenni o'ldiradi va bitta
 * qurilmani tanlab chiqarish mumkin bo'ladi.
 */

export interface SessionContext {
  userAgent?: string | null;
  ip?: string | null;
  deviceId?: string | null;
}

/**
 * Harakatsizlik chegarasi ROLGA QARAB.
 *
 * NEGA BIR XIL EMAS: xavf asosan imtiyozli hisoblarda — admin ochiq qoldirgan
 * noutbuk butun saytni ochib beradi. Talaba esa darsni 60 daqiqa o'qib o'tirsa
 * bironta ham API so'rovi ketmaydi va u o'rtada chiqib ketardi; bu xavfsizlik
 * emas, xalaqit bo'lardi.
 */
const IDLE_LIMIT_MS: Record<string, number> = {
  ADMIN: 60 * 60 * 1000,
  MENTOR: 60 * 60 * 1000,
  TEAM: 60 * 60 * 1000,
  STUDENT: 12 * 60 * 60 * 1000,
};

/** Notanish rol uchun eng qattiq chegara olinadi (xavfsiz tomonga xato qilamiz). */
export function idleLimitMs(role: string): number {
  return IDLE_LIMIT_MS[role] ?? 60 * 60 * 1000;
}

/**
 * `lastSeenAt` ni har so'rovda emas, shu oraliqda bir marta yozamiz.
 * Aks holda faol foydalanuvchi soniyasiga o'nlab UPDATE hosil qilardi.
 */
export const LAST_SEEN_THROTTLE_MS = 60 * 1000;

// Bazaga cheksiz uzun satr tushmasligi uchun. Haqiqiy User-Agent ~120 belgi.
const USER_AGENT_MAX = 300;

/** So'rovdan seans konteksti (qurilma tavsifi) yig'iladi. */
export function sessionContextFromRequest(req: Request): SessionContext {
  return {
    userAgent: req.headers['user-agent']?.slice(0, USER_AGENT_MAX) ?? null,
    // `trust proxy` server.ts da o'rnatilgan, shuning uchun req.ip haqiqiy mijoz IP'si
    ip: req.ip ?? null,
    deviceId: req.deviceId ?? null,
  };
}

/** Yangi seans yaratadi va uning id'sini (token uchun `sid`) qaytaradi. */
export async function createSession(userId: string, ctx: SessionContext): Promise<string> {
  const session = await prisma.session.create({
    data: {
      userId,
      userAgent: ctx.userAgent ?? null,
      ip: ctx.ip ?? null,
      deviceId: ctx.deviceId ?? null,
    },
    select: { id: true },
  });
  return session.id;
}

/**
 * User-Agent'dan odam o'qiy oladigan yorliq: "Chrome · Windows".
 *
 * Ataylab qo'pol va kutubxonasiz: ro'yxatda "bu qaysi qurilmam edi" degan
 * savolga javob berish yetarli, aniq versiya kerak emas.
 */
export function describeDevice(userAgent: string | null): string | null {
  if (!userAgent) return null;

  const browser =
    /Edg\//.test(userAgent) ? 'Edge'
    : /OPR\/|Opera/.test(userAgent) ? 'Opera'
    : /YaBrowser/.test(userAgent) ? 'Yandex'
    : /Firefox\//.test(userAgent) ? 'Firefox'
    // Chrome Safari'dan OLDIN tekshiriladi: Chrome'ning satrida ham "Safari"
    // bor, teskarisi esa yo'q — tartib almashsa hamma Chrome "Safari" bo'lardi
    : /Chrome\/|CriOS/.test(userAgent) ? 'Chrome'
    : /Safari\//.test(userAgent) ? 'Safari'
    : null;

  const os =
    /Windows/.test(userAgent) ? 'Windows'
    : /Android/.test(userAgent) ? 'Android'
    : /iPhone|iPad|iPod/.test(userAgent) ? 'iOS'
    : /Mac OS X|Macintosh/.test(userAgent) ? 'macOS'
    : /Linux/.test(userAgent) ? 'Linux'
    : null;

  if (!browser && !os) return null;
  return [browser, os].filter(Boolean).join(' · ');
}

/** Foydalanuvchining ochiq seanslari, eng so'nggi faollik boshida. */
export async function listSessions(userId: string, currentSid: string | undefined) {
  const sessions = await prisma.session.findMany({
    where: { userId, revokedAt: null },
    orderBy: { lastSeenAt: 'desc' },
    select: { id: true, userAgent: true, ip: true, createdAt: true, lastSeenAt: true },
  });

  return sessions.map((s) => ({
    id: s.id,
    device: describeDevice(s.userAgent),
    userAgent: s.userAgent,
    ip: s.ip,
    createdAt: s.createdAt,
    lastSeenAt: s.lastSeenAt,
    isCurrent: s.id === currentSid,
  }));
}

/**
 * Bitta seansni bekor qiladi.
 *
 * `userId` shartga ATAYIN kiritilgan: aks holda id'ni bilgan odam boshqa
 * foydalanuvchini saytdan chiqarib yuborardi.
 */
export async function revokeSession(userId: string, sessionId: string): Promise<void> {
  const { count } = await prisma.session.updateMany({
    where: { id: sessionId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (count === 0) {
    throw ApiError.notFound('Seans topilmadi');
  }
}

/** Joriysidan boshqa hamma seansni bekor qiladi, sonini qaytaradi. */
export async function revokeOtherSessions(userId: string, currentSid: string | undefined): Promise<number> {
  const { count } = await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
      ...(currentSid ? { NOT: { id: currentSid } } : {}),
    },
    data: { revokedAt: new Date() },
  });
  return count;
}

/** Barcha seanslarni bekor qiladi (parol o'zgarganda). */
export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
