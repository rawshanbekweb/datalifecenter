import { apiFetch } from './client';
import { API_URL } from './config';
import { getToken } from './token';
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

// SSE oqimiga obuna: yangi bildirishnoma kelganda onNotify chaqiriladi.
// EventSource emas, fetch-stream ishlatiladi — EventSource Authorization
// header'ni qo'llamaydi, Safari'da esa krossdomen cookie bloklanadi.
// Qaytgan funksiya obunani to'xtatadi. Uzilishda eksponensial backoff
// bilan qayta ulanadi.
export function subscribeNotifications(onNotify: () => void): () => void {
  let stopped = false;
  let controller: AbortController | null = null;

  const run = async (): Promise<void> => {
    let retryMs = 5000;
    while (!stopped) {
      controller = new AbortController();
      try {
        const token = getToken();
        const res = await fetch(`${API_URL}/notifications/stream`, {
          credentials: 'include',
          headers: {
            Accept: 'text/event-stream',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });
        // Sessiya eskirgan/ruxsat yo'q — qayta ulanish foydasiz, to'xtaymiz
        // (keyingi oddiy so'rov 401 olib ilova logout oqimini ishga soladi)
        if (res.status === 401 || res.status === 403) return;
        if (!res.ok || !res.body) throw new Error(`SSE ${res.status}`);
        retryMs = 5000; // muvaffaqiyatli ulanish — backoff qayta boshlanadi

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          // SSE hodisalari bo'sh qator bilan ajratiladi
          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';
          for (const event of events) {
            if (event.split('\n').some((line) => line.startsWith('event: notify'))) {
              onNotify();
            }
          }
        }
      } catch {
        // tarmoq uzildi yoki abort — quyida qayta ulanamiz
      }
      if (stopped) return;
      await new Promise((resolve) => setTimeout(resolve, retryMs));
      retryMs = Math.min(retryMs * 2, 60000);
    }
  };

  void run();
  return () => {
    stopped = true;
    controller?.abort();
  };
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
