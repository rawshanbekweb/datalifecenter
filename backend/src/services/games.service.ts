import { prisma } from '../config/prisma';
import { SupportedLocale } from '../config/locale';
import { ApiError } from '../utils/ApiError';
import { LocalizedString, resolveLocaleDeep } from '../utils/localizedField';
import { deleteUploadByUrl } from './storage.service';

export async function listGames(locale: SupportedLocale) {
  const games = await prisma.game.findMany({
    where: { published: true },
    orderBy: [{ featured: 'desc' }, { order: 'asc' }],
  });
  return resolveLocaleDeep(games, locale);
}

export async function listGamesAdmin() {
  return prisma.game.findMany({
    orderBy: [{ featured: 'desc' }, { order: 'asc' }],
  });
}

interface GameInput {
  title: LocalizedString;
  description: LocalizedString;
  logoUrl: string;
  apkUrl: string;
  version: string;
  apkSizeBytes?: number;
  order: number;
  featured: boolean;
  published: boolean;
}

export async function createGame(input: GameInput) {
  return prisma.game.create({ data: input });
}

export async function updateGame(id: string, input: Partial<GameInput>) {
  const game = await prisma.game.findUnique({ where: { id } });
  if (!game) {
    throw ApiError.notFound("O'yin topilmadi");
  }
  return prisma.game.update({ where: { id }, data: input });
}

export async function deleteGame(id: string) {
  const game = await prisma.game.findUnique({ where: { id } });
  if (!game) {
    throw ApiError.notFound("O'yin topilmadi");
  }
  await prisma.game.delete({ where: { id } });
  // 13+ MB'lik APK'ni bulut xotirada saqlab qolishning ma'nosi yo'q
  await deleteUploadByUrl(game.apkUrl);
  await deleteUploadByUrl(game.logoUrl);
}

export async function registerDownload(id: string) {
  const game = await prisma.game.findFirst({ where: { id, published: true } });
  if (!game) {
    throw ApiError.notFound("O'yin topilmadi");
  }
  return prisma.game.update({
    where: { id },
    data: { downloadsCount: { increment: 1 } },
  });
}
