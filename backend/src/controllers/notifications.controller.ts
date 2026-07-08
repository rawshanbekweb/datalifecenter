import { Request, Response } from 'express';
import * as notificationsService from '../services/notifications.service';
import * as announcementsService from '../services/announcements.service';
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

// ---------- E'lonlar (admin) ----------

export const createAnnouncementHandler = asyncHandler(async (req: Request, res: Response) => {
  const announcement = await announcementsService.createAnnouncement(req.body);
  sendSuccess(res, announcement, 201);
});

export const listAnnouncementsHandler = asyncHandler(async (_req: Request, res: Response) => {
  const announcements = await announcementsService.listAnnouncements();
  sendSuccess(res, announcements);
});

export const deleteAnnouncementHandler = asyncHandler(async (req: Request, res: Response) => {
  await announcementsService.deleteAnnouncement(req.params.id as string);
  sendSuccess(res, { deleted: true });
});
