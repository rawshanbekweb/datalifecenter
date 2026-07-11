import { Router } from 'express';
import {
  createAnnouncementHandler,
  deleteAnnouncementHandler,
  listAnnouncementsHandler,
  listMyNotificationsHandler,
  markAllNotificationsReadHandler,
  markNotificationReadHandler,
  streamNotificationsHandler,
} from '../controllers/notifications.controller';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { validateBody } from '../middleware/validateRequest';
import { createAnnouncementSchema } from '../validators/announcements.validator';

// Har bir foydalanuvchining shaxsiy bildirishnomalari
export const notificationsRouter = Router();
notificationsRouter.use(authenticate);
notificationsRouter.get('/', listMyNotificationsHandler);
notificationsRouter.get('/stream', streamNotificationsHandler);
notificationsRouter.patch('/read-all', markAllNotificationsReadHandler);
notificationsRouter.patch('/:id/read', markNotificationReadHandler);

// Admin e'lonlari
export const announcementsRouter = Router();
announcementsRouter.use(authenticate, authorize('ADMIN'));
announcementsRouter.get('/', listAnnouncementsHandler);
announcementsRouter.post('/', validateBody(createAnnouncementSchema), createAnnouncementHandler);
announcementsRouter.delete('/:id', deleteAnnouncementHandler);
