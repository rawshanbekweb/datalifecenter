import { MessageStatus } from '@prisma/client';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/ApiError';

interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}

export async function createContactMessage(input: ContactInput) {
  return prisma.contactMessage.create({ data: input });
}

export async function listContactMessages() {
  return prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function updateContactMessageStatus(id: string, status: MessageStatus) {
  const message = await prisma.contactMessage.findUnique({ where: { id } });
  if (!message) {
    throw ApiError.notFound('Xabar topilmadi');
  }
  return prisma.contactMessage.update({ where: { id }, data: { status } });
}
