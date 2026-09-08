import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { comparePassword, hashPassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { sendPasswordResetEmail, sendVerificationEmail } from './email.service';
import { createSession, revokeAllSessions, SessionContext } from './session.service';
import { assertNotLocked, clearFailures, recordFailure } from './loginThrottle';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
}

interface LoginInput {
  email: string;
  password: string;
}

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  avatarUrl: string | null;
  focusX: number;
  focusY: number;
  emailVerifiedAt?: Date | null;
  // Jamoa profili bog'langanmi. Mentor ham jamoa a'zosi bo'lishi mumkin,
  // shuning uchun rolning o'zi yetarli emas — kabinet havolasi shu bayroqqa qarab
  // ko'rsatiladi (frontend/src/components/Navbar.tsx).
  teamProfile?: { id: string } | null;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    // Avatar kadrga kesilganda markazda qoladigan nuqta (foizda)
    focusX: user.focusX,
    focusY: user.focusY,
    emailVerified: !!user.emailVerifiedAt,
    hasTeamProfile: !!user.teamProfile,
  };
}

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 soat

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Tasdiqlash tokeni yaratib email yuboradi (SMTP o'chiq bo'lsa jim o'tadi)
async function issueVerificationEmail(userId: string, email: string, name: string): Promise<void> {
  const token = crypto.randomBytes(32).toString('hex');
  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId } }),
    prisma.emailVerificationToken.create({
      data: { userId, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + VERIFY_TOKEN_TTL_MS) },
    }),
  ]);
  const verifyUrl = `${env.FRONTEND_URL.replace(/\/+$/, '')}/verify-email?token=${token}`;
  await sendVerificationEmail(email, name, verifyUrl);
}

/**
 * Bitta telefon raqamiga ruxsat etilgan hisob soni. Bir oila bir raqamdan
 * foydalanishi mumkin (ota-ona + farzand), shuning uchun 1 emas — lekin bir
 * raqam bilan o'nlab hisob ochilishi soxta ro'yxatdan o'tishning aniq belgisi.
 */
const MAX_ACCOUNTS_PER_PHONE = 3;

export async function register(input: RegisterInput, ctx: SessionContext = {}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict('Bu email allaqachon ro\'yxatdan o\'tgan', 'EMAIL_TAKEN');
  }

  // Telefon validator'da normallashgan holga keltirilgan, shuning uchun oddiy
  // tenglik bilan sanash yetarli ("+998 88 …" va "998 88 …" bir xil satr)
  if (input.phone) {
    const samePhone = await prisma.user.count({ where: { phone: input.phone } });
    if (samePhone >= MAX_ACCOUNTS_PER_PHONE) {
      throw ApiError.conflict(
        "Bu telefon raqami bilan hisob ochish chegarasi tugagan. Administratorga murojaat qiling.",
        'PHONE_LIMIT'
      );
    }
  }

  const passwordHash = await hashPassword(input.password);
  let user;
  try {
    user = await prisma.user.create({
      data: { name: input.name, email: input.email, passwordHash, phone: input.phone },
    });
  } catch (err) {
    // Tekshiruv bilan yaratish orasida boshqa so'rov ulgurgan bo'lishi mumkin (poyga) —
    // unique constraint xatosi 500 emas, xuddi yuqoridagi kabi 409 bo'lib qaytsin
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw ApiError.conflict('Bu email allaqachon ro\'yxatdan o\'tgan', 'EMAIL_TAKEN');
    }
    throw err;
  }

  await issueVerificationEmail(user.id, user.email, user.name);

  const sid = await createSession(user.id, ctx);
  const token = signToken({ userId: user.id, role: user.role, tv: user.tokenVersion, sid });
  return { user: toPublicUser(user), token };
}

// Email bazada bo'lmaganda ham bcrypt solishtiruvi bajarilishi uchun soxta hash —
// aks holda javob vaqti farqidan email ro'yxatda bor-yo'qligini bilib olish mumkin
const DUMMY_HASH_PROMISE = hashPassword(crypto.randomBytes(16).toString('hex'));

export async function login(input: LoginInput, ctx: SessionContext = {}) {
  // IP bo'yicha chegara botnetda ishlamaydi — hisob bo'yicha chegara shu yerda
  // (loginThrottle.ts). Tekshiruv bazaga murojaatdan OLDIN: qulflangan hisobga
  // kelgan urinish so'rov bo'yicha bironta ham DB/bcrypt ishini talab qilmaydi.
  assertNotLocked(input.email);

  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { teamProfile: { select: { id: true } } },
  });
  if (!user) {
    await comparePassword(input.password, await DUMMY_HASH_PROMISE);
    // Mavjud bo'lmagan email ham sanaladi — aks holda javob vaqti yoki qulf
    // holati orqali "bu email ro'yxatdan o'tganmi" degan savolga javob topilardi
    recordFailure(input.email);
    throw ApiError.unauthorized('Email yoki parol noto\'g\'ri', 'INVALID_CREDENTIALS');
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    recordFailure(input.email);
    throw ApiError.unauthorized('Email yoki parol noto\'g\'ri', 'INVALID_CREDENTIALS');
  }

  if (user.isBlocked) {
    throw ApiError.forbidden('Hisobingiz bloklangan. Administratorga murojaat qiling.', 'USER_BLOCKED');
  }

  // Parol to'g'ri chiqdi — hisoblagich tozalanadi, aks holda kunda bir necha bor
  // kiradigan foydalanuvchi vaqt o'tib chegaraga yetib qolardi
  clearFailures(input.email);

  const sid = await createSession(user.id, ctx);
  const token = signToken({ userId: user.id, role: user.role, tv: user.tokenVersion, sid });
  return { user: toPublicUser(user), token };
}

export async function verifyEmail(token: string) {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, emailVerifiedAt: true } } },
  });

  if (!record || record.expiresAt < new Date()) {
    throw ApiError.badRequest(
      "Havola yaroqsiz yoki muddati o'tgan. Profil sahifasidan qayta yuborishni so'rang.",
      'INVALID_VERIFY_TOKEN'
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: record.user.emailVerifiedAt ?? new Date() },
    }),
    prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } }),
  ]);
}

export async function resendVerification(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.notFound('Foydalanuvchi topilmadi');
  }
  if (user.emailVerifiedAt) {
    throw ApiError.conflict('Email allaqachon tasdiqlangan', 'ALREADY_VERIFIED');
  }
  await issueVerificationEmail(user.id, user.email, user.name);
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { teamProfile: { select: { id: true } } },
  });
  if (!user) {
    throw ApiError.notFound('Foydalanuvchi topilmadi');
  }
  return toPublicUser(user);
}

interface UpdateProfileInput {
  name?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  focusX?: number;
  focusY?: number;
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.notFound('Foydalanuvchi topilmadi');
  }
  // teamProfile ham qaytariladi — aks holda profil saqlangach frontend'dagi
  // hasTeamProfile bayrog'i noto'g'ri false'ga tushib, kabinet havolasi yo'qolardi
  const updated = await prisma.user.update({
    where: { id: userId },
    data: input,
    include: { teamProfile: { select: { id: true } } },
  });
  return toPublicUser(updated);
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  ctx: SessionContext = {}
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.notFound('Foydalanuvchi topilmadi');
  }

  const valid = await comparePassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized("Joriy parol noto'g'ri", 'INVALID_CURRENT_PASSWORD');
  }

  const passwordHash = await hashPassword(newPassword);
  // tokenVersion oshadi — barcha eski sessiyalar bekor bo'ladi;
  // joriy sessiya uchun yangi token qaytariladi (controller cookie'ni yangilaydi)
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, tokenVersion: { increment: 1 } },
  });

  // Eski seans yozuvlari ham yopiladi: `tokenVersion` allaqachon ularni
  // ishlamas qilgan, lekin yopilmasa seanslar ro'yxatida "ochiq" bo'lib
  // ko'rinib turardi. Joriy qurilma uchun darhol yangi seans ochiladi.
  await revokeAllSessions(userId);
  const sid = await createSession(updated.id, ctx);

  return signToken({ userId: updated.id, role: updated.role, tv: updated.tokenVersion, sid });
}

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 daqiqa

// Email mavjud bo'lsa token yaratib xat yuboradi. Email bazada yo'qligini
// oshkor qilmaslik uchun natija har doim bir xil (controller 200 qaytaradi).
export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.isBlocked) return;

  const token = crypto.randomBytes(32).toString('hex');

  await prisma.$transaction([
    // Eski tokenlar bekor qilinadi — bir vaqtda faqat bitta amal qiluvchi havola
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    }),
  ]);

  const resetUrl = `${env.FRONTEND_URL.replace(/\/+$/, '')}/reset-password?token=${token}`;
  await sendPasswordResetEmail(user.email, user.name, resetUrl);
}

export async function resetPassword(token: string, newPassword: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, isBlocked: true } } },
  });

  if (!record || record.usedAt || record.expiresAt < new Date() || record.user.isBlocked) {
    throw ApiError.badRequest(
      "Havola yaroqsiz yoki muddati o'tgan. Parolni tiklashni qaytadan so'rang.",
      'INVALID_RESET_TOKEN'
    );
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    // tokenVersion oshadi — o'g'irlangan sessiyalar ham darhol bekor bo'ladi
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  // Parolni tiklash — ko'pincha "hisobim o'g'irlangan" holati. Barcha qurilmalar
  // chiqariladi; foydalanuvchi yangi parol bilan qaytadan kiradi.
  await revokeAllSessions(record.userId);
}
