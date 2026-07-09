import { apiFetch } from './client';

export type SessionStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';

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

export interface CreateSessionInput {
  courseId: string;
  title: string;
  description?: string;
  meetingUrl: string;
  startsAt: string;
  durationMin: number;
  targetStudentIds?: string[];
}

export function getMySessions(): Promise<LiveSession[]> {
  return apiFetch('/sessions/mine');
}

export function getManagedSessions(): Promise<LiveSession[]> {
  return apiFetch('/sessions/manage');
}

export function createSession(input: CreateSessionInput): Promise<LiveSession> {
  return apiFetch('/sessions', { method: 'POST', body: JSON.stringify(input) });
}

export function updateSession(id: string, input: Partial<CreateSessionInput> & { status?: SessionStatus }): Promise<LiveSession> {
  return apiFetch(`/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteSession(id: string): Promise<{ deleted: boolean }> {
  return apiFetch(`/sessions/${id}`, { method: 'DELETE' });
}
