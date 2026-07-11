import { Request, Response } from 'express';
import * as notificationsService from '../services/notifications.service';
import * as announcementsService from '../services/announcements.service';
import { addStreamClient } from '../services/notificationStream';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

function userIdOf(req: Request): string {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.userId;
}

// ---------- Bildirishnomalar ----------

export const listMyNotificationsHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationsService.listMine(userIdOf(req));
  sendSuccess(res, result);
});

export const markNotificationReadHandler = asyncHandler(async (req: Request, res: Response) => {
  await notificationsService.markRead(userIdOf(req), req.params.id as string);
  sendSuccess(res, { read: true });
});

export const markAllNotificationsReadHandler = asyncHandler(async (req: Request, res: Response) => {
  await notificationsService.markAllRead(userIdOf(req));
  sendSuccess(res, { read: true });
});

// SSE oqimi: ulanish ochiq qoladi, yangi bildirishnoma yozilganda 'notify'
// hodisasi keladi — mijoz shunda ro'yxatni qayta so'raydi
export const streamNotificationsHandler = (req: Request, res: Response): void => {
  const userId = userIdOf(req);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // Nginx kabi proxy'lar SSE'ni buferlab qo'ymasligi uchun
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  res.write(': connected\n\n');

  // addStreamClient heartbeat'ni ham boshqaradi; qaytgan funksiya ulanish
  // uzilganda taymerni tozalab, ro'yxatdan chiqaradi
  const close = addStreamClient(userId, res);
  req.on('close', close);
};

// ---------- E'lonlar (admin) ----------

export const createAnnouncementHandler = asyncHandler(async (req: Request, res: Response) => {
  const announcement = await announcementsService.createAnnouncement(req.body);
  sendSuccess(res, announcement, 201);
});

export const listAnnouncementsHandler = asyncHandler(async (req: Request, res: Response) => {
  const announcements = await announcementsService.listAnnouncements(req.locale);
  sendSuccess(res, announcements);
});

export const deleteAnnouncementHandler = asyncHandler(async (req: Request, res: Response) => {
  await announcementsService.deleteAnnouncement(req.params.id as string);
  sendSuccess(res, { deleted: true });
});
