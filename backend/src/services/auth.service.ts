import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';
import { comparePassword, hashPassword } from '../utils/password';
import { signToken } from '../utils/jwt';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

function toPublicUser(user: { id: string; name: string; email: string; role: string; phone: string | null; avatarUrl: string | null }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
  };
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict('Bu email allaqachon ro\'yxatdan o\'tgan', 'EMAIL_TAKEN');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash, phone: input.phone },
  });

  const token = signToken({ userId: user.id, role: user.role });
  return { user: toPublicUser(user), token };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw ApiError.unauthorized('Email yoki parol noto\'g\'ri', 'INVALID_CREDENTIALS');
  }

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized('Email yoki parol noto\'g\'ri', 'INVALID_CREDENTIALS');
  }

  const token = signToken({ userId: user.id, role: user.role });
  return { user: toPublicUser(user), token };
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.notFound('Foydalanuvchi topilmadi');
  }
  return toPublicUser(user);
}
