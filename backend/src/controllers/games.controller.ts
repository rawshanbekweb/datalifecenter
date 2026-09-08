import { Request, Response } from 'express';
import * as gamesService from '../services/games.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';

export const listGamesHandler = asyncHandler(async (req: Request, res: Response) => {
  const games = await gamesService.listGames(req.locale);
  sendSuccess(res, games);
});

export const listGamesAdminHandler = asyncHandler(async (_req: Request, res: Response) => {
  const games = await gamesService.listGamesAdmin();
  sendSuccess(res, games);
});

export const createGameHandler = asyncHandler(async (req: Request, res: Response) => {
  const game = await gamesService.createGame(req.body);
  sendSuccess(res, game, 201);
});

export const updateGameHandler = asyncHandler(async (req: Request, res: Response) => {
  const game = await gamesService.updateGame(req.params.id as string, req.body);
  sendSuccess(res, game);
});

export const deleteGameHandler = asyncHandler(async (req: Request, res: Response) => {
  await gamesService.deleteGame(req.params.id as string);
  sendSuccess(res, { message: "O'yin o'chirildi" });
});

// ATAYIN POST, GET emas: GET "xavfsiz" (side-effect'siz) bo'lishi kerak —
// brauzer oldindan yuklash (prefetch), xavfsizlik skanerlari yoki havolani
// oddiy ko'rish ham GET so'rov yuboradi va hisoblagichni soxta oshiradi.
// Frontend haqiqiy APK havolasiga (game.apkUrl) to'g'ridan-to'g'ri yuklanadi,
// bu endpoint faqat bosishni fon rejimida (fire-and-forget) hisoblaydi.
export const downloadGameHandler = asyncHandler(async (req: Request, res: Response) => {
  const game = await gamesService.registerDownload(req.params.id as string);
  sendSuccess(res, { downloadsCount: game.downloadsCount });
});
