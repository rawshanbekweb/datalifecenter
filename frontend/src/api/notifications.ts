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

// Qo'ng'iroq yopiq turganda faqat shu so'raladi — ro'yxatning o'zi emas
export function getUnreadNotificationsCount(): Promise<{ unreadCount: number }> {
  return apiFetch('/notifications/unread-count');
}

export function markNotificationRead(id: string): Promise<{ read: boolean }> {
  return apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
}

export function markAllNotificationsRead(): Promise<{ read: boolean }> {
  return apiFetch('/notifications/read-all', { method: 'PATCH' });
}

/**
 * SSE oqimi — BUTUN SAHIFA UCHUN BITTA ULANISH.
 *
 * NEGA UMUMIY: ulanish serverda doimiy resurs egallaydi va bitta
 * foydalanuvchiga 5 tadan ortiq ulanishga ruxsat berilmaydi
 * (notificationStream.ts). Sahifada esa bir vaqtda uchta obunachi bor:
 * bildirishnoma qo'ng'irog'i, yon menyudagi o'qilmagan xabarlar belgisi va
 * xabarlar oynasi. Har biri o'z ulanishini ochsa, ikkinchi tabdayoq limit
 * to'lib, server eng eski ulanishni uzib tashlardi — ya'ni allaqachon ochiq
 * turgan tab jim qolardi. Shuning uchun ulanish bitta, obunachilar esa
 * shu oqimni bo'lishadi (refcount bilan).
 *
 * EventSource emas, fetch-stream ishlatiladi — EventSource Authorization
 * header'ni qo'llamaydi, Safari'da esa krossdomen cookie bloklanadi.
 */
const listeners = new Set<() => void>();
let streamController: AbortController | null = null;
let streamRunning = false;
// Qaysi token 401/403 olgani — o'sha token bilan qayta urinilmaydi
// (aks holda eskirgan sessiya cheksiz 401 tsiklini hosil qilardi)
let rejectedToken: string | null = null;

function startStreamIfNeeded(): void {
  if (streamRunning || listeners.size === 0) return;
  if (rejectedToken !== null && (getToken() ?? null) === rejectedToken) return;
  streamRunning = true;
  void runStream();
}

async function runStream(): Promise<void> {
  let retryMs = 5000;
  try {
    while (listeners.size > 0) {
      streamController = new AbortController();
      try {
        const token = getToken();
        const res = await fetch(`${API_URL}/notifications/stream`, {
          credentials: 'include',
          headers: {
            Accept: 'text/event-stream',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: streamController.signal,
        });
        // Sessiya eskirgan/ruxsat yo'q — qayta ulanish foydasiz, to'xtaymiz
        // (keyingi oddiy so'rov 401 olib ilova logout oqimini ishga soladi)
        if (res.status === 401 || res.status === 403) {
          rejectedToken = token ?? null;
          break;
        }
        if (!res.ok || !res.body) throw new Error(`SSE ${res.status}`);
        retryMs = 5000; // muvaffaqiyatli ulanish — backoff qayta boshlanadi
        rejectedToken = null;

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
              // Bitta obunachining xatosi qolganlarini to'xtatmasligi kerak
              for (const listener of [...listeners]) {
                try {
                  listener();
                } catch {
                  // e'tiborsiz
                }
              }
            }
          }
        }
      } catch {
        // tarmoq uzildi yoki abort — quyida qayta ulanamiz
      }
      if (listeners.size === 0) break;
      await new Promise((resolve) => setTimeout(resolve, retryMs));
      retryMs = Math.min(retryMs * 2, 60000);
    }
  } finally {
    streamRunning = false;
    streamController = null;
    // Oqim tugagunicha yangi obunachi qo'shilgan bo'lishi mumkin
    // (komponent qayta ulangan payt) — u ulanishsiz qolmasin
    startStreamIfNeeded();
  }
}

/**
 * Yangi bildirishnoma kelganda `onNotify` chaqiriladi.
 * Qaytgan funksiya obunani bekor qiladi; oxirgi obunachi ketganda
 * umumiy ulanish ham yopiladi.
 */
export function subscribeNotifications(onNotify: () => void): () => void {
  listeners.add(onNotify);
  startStreamIfNeeded();

  return () => {
    listeners.delete(onNotify);
    if (listeners.size === 0) streamController?.abort();
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
