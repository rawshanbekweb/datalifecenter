import { apiFetch } from './client';

/**
 * Kirilgan seanslar (qurilmalar).
 *
 * DIQQAT: `api/sessions.ts` BOSHQA narsa — u mentorning jonli darslari
 * (`LiveSession`) uchun. Shu sabab bu modul alohida nom bilan turadi.
 */

export interface AuthSession {
  id: string;
  /** "Chrome · Windows" ko'rinishidagi yorliq; noma'lum bo'lsa null */
  device: string | null;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  lastSeenAt: string;
  isCurrent: boolean;
}

export function fetchSessions(): Promise<AuthSession[]> {
  return apiFetch('/auth/sessions');
}

export function revokeSession(id: string): Promise<{ message: string }> {
  return apiFetch(`/auth/sessions/${id}`, { method: 'DELETE' });
}

export function revokeOtherSessions(): Promise<{ count: number; message: string }> {
  return apiFetch('/auth/sessions/others', { method: 'DELETE' });
}

/**
 * "Men shu yerdaman" signali. Javob tanasi yo'q (204) — butun ishi server
 * tomonda seansning `lastSeenAt` ini yangilash.
 */
export function sendHeartbeat(): Promise<void> {
  return apiFetch('/auth/heartbeat');
}
