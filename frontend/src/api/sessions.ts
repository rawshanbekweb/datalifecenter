import { apiFetch } from './client';
import { LocalizedString } from '../types/locale';

export type SessionStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';

// Talaba ko'radigan (o'z tiliga tekislangan) sessiya — GET /sessions/mine
export interface LiveSession {
  id: string;
  title: string;
  description?: string | null;
  meetingUrl: string;
  startsAt: string;
  durationMin: number;
  status: SessionStatus;
  course: { id: string; title: string; slug: string; color: string; bg: string; border: string; iconKey: string };
  mentor: { id: string; name: string; photoUrl?: string | null };
  targetStudentIds: string[];
}

// Mentor/admin boshqaruv ko'rinishi — xom (barcha til) ma'lumot, tahrirlash uchun
export interface ManagedLiveSession {
  id: string;
  title: LocalizedString;
  description?: LocalizedString | null;
  meetingUrl: string;
  startsAt: string;
  durationMin: number;
  status: SessionStatus;
  course: { id: string; title: LocalizedString; slug: string; color: string; bg: string; border: string; iconKey: string };
  mentor: { id: string; name: string; photoUrl?: string | null };
  targetStudentIds: string[];
}

export interface CreateSessionInput {
  courseId: string;
  title: LocalizedString;
  description?: LocalizedString;
  meetingUrl: string;
  startsAt: string;
  durationMin: number;
  targetStudentIds?: string[];
}

export function getMySessions(): Promise<LiveSession[]> {
  return apiFetch('/sessions/mine');
}

// Saytdagi jonli efir sahifasi (/live/:id) uchun — huquq backend'da tekshiriladi
export function getSession(id: string): Promise<LiveSession> {
  return apiFetch(`/sessions/${id}`);
}

export function getManagedSessions(): Promise<ManagedLiveSession[]> {
  return apiFetch('/sessions/manage');
}

export function createSession(input: CreateSessionInput): Promise<ManagedLiveSession> {
  return apiFetch('/sessions', { method: 'POST', body: JSON.stringify(input) });
}

export function updateSession(id: string, input: Partial<CreateSessionInput> & { status?: SessionStatus }): Promise<ManagedLiveSession> {
  return apiFetch(`/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteSession(id: string): Promise<{ deleted: boolean }> {
  return apiFetch(`/sessions/${id}`, { method: 'DELETE' });
}
