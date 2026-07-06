import { SessionStatus } from '../../api/sessions';

export interface SessionStatusMeta {
  label: string;
  color: string;
  bg: string;
  border: string;
}

export const SESSION_STATUS_META: Record<SessionStatus, SessionStatusMeta> = {
  SCHEDULED: { label: 'Rejalashtirilgan', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  LIVE:      { label: 'Jonli efirda',     color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  ENDED:     { label: 'Yakunlangan',      color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  CANCELLED: { label: 'Bekor qilingan',   color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

export function formatSessionTime(startsAt: string, durationMin: number): string {
  const start = new Date(startsAt);
  const date = start.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long' });
  const time = start.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time} · ${durationMin} daqiqa`;
}
