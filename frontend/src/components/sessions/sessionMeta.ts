import { SessionStatus } from '../../api/sessions';
import i18n from '../../i18n/i18n';
import { formatDate, formatTime } from '../../utils/format';

export interface SessionStatusMeta {
  labelKey: string;
  color: string;
  bg: string;
  border: string;
}

// labelKey render paytida t() qilinadi (til sahifa reload'ida qotib qoladi)
export const SESSION_STATUS_META: Record<SessionStatus, SessionStatusMeta> = {
  SCHEDULED: { labelKey: 'sessions.status.SCHEDULED', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  LIVE:      { labelKey: 'sessions.status.LIVE',      color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  ENDED:     { labelKey: 'sessions.status.ENDED',     color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  CANCELLED: { labelKey: 'sessions.status.CANCELLED', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
};

export function formatSessionTime(startsAt: string, durationMin: number): string {
  const start = new Date(startsAt);
  const date = formatDate(start, { day: 'numeric', month: 'long' });
  const time = formatTime(start);
  return i18n.t('sessions.timeLine', { date, time, n: durationMin });
}
