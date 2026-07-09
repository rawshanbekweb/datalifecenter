import { apiFetch } from './client';
import { LocalizedString } from '../types/locale';

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: 'ALL' | 'STUDENTS' | 'MENTORS';
  course?: { id: string; title: string } | null;
  courseId?: string | null;
  createdAt: string;
}

export interface CreateAnnouncementInput {
  title: LocalizedString;
  body: LocalizedString;
  audience?: Announcement['audience'];
  courseId?: string | null;
}

// ---------- Shaxsiy bildirishnomalar ----------

export function getMyNotifications(): Promise<{ items: AppNotification[]; unreadCount: number }> {
  return apiFetch('/notifications');
}

export function markNotificationRead(id: string): Promise<{ read: boolean }> {
  return apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
}

export function markAllNotificationsRead(): Promise<{ read: boolean }> {
  return apiFetch('/notifications/read-all', { method: 'PATCH' });
}

// ---------- Admin e'lonlari ----------

export function listAnnouncements(): Promise<Announcement[]> {
  return apiFetch('/announcements');
}

export function createAnnouncement(data: CreateAnnouncementInput): Promise<Announcement> {
  return apiFetch('/announcements', { method: 'POST', body: JSON.stringify(data) });
}

export function deleteAnnouncement(id: string): Promise<{ deleted: boolean }> {
  return apiFetch(`/announcements/${id}`, { method: 'DELETE' });
}
