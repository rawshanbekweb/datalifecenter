import { useCallback, useEffect, useState } from 'react';
import { Monitor, LogOut, ShieldCheck, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuthSession, fetchSessions, revokeOtherSessions, revokeSession } from '../../api/authSessions';
import { formatDateTime } from '../../utils/format';

/**
 * "Kirilgan qurilmalar" bo'limi — profil sahifasida.
 *
 * Joriy seansni ro'yxatdan chiqarib bo'lmaydi: uning uchun oddiy "Chiqish"
 * tugmasi bor. O'zini chiqarib yuborish tugmasi foydalanuvchini adashtiradi.
 */

/** "5 daqiqa oldin" — Intl.RelativeTimeFormat qoraqalpoqchani bilmaydi, shu bois qo'lda. */
function useRelativeTime(): (iso: string) => string {
  const { t } = useTranslation();
  return useCallback(
    (iso: string): string => {
      const diffMs = Date.now() - new Date(iso).getTime();
      const minutes = Math.floor(diffMs / 60_000);
      if (minutes < 2) return t('student.profile.devices.justNow');
      if (minutes < 60) return t('student.profile.devices.minutesAgo', { count: minutes });
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return t('student.profile.devices.hoursAgo', { count: hours });
      return t('student.profile.devices.daysAgo', { count: Math.floor(hours / 24) });
    },
    [t]
  );
}

export default function ActiveSessions(): React.ReactElement {
  const { t } = useTranslation();
  const relative = useRelativeTime();

  const [sessions, setSessions] = useState<AuthSession[] | null>(null);
  const [error, setError]   = useState<string>('');
  // Qaysi qator ustida amal ketayotgani — 'others' umumiy tugma uchun
  const [busy, setBusy]     = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    try {
      setSessions(await fetchSessions());
      setError('');
    } catch (err: unknown) {
      setError((err as Error).message || t('student.profile.devices.loadError'));
      setSessions([]);
    }
  }, [t]);

  useEffect(() => { void load(); }, [load]);

  const dropOne = async (id: string): Promise<void> => {
    setBusy(id);
    try {
      await revokeSession(id);
      setSessions((list) => (list ?? []).filter((s) => s.id !== id));
    } catch (err: unknown) {
      setError((err as Error).message || t('common.error'));
    } finally {
      setBusy(null);
    }
  };

  const dropOthers = async (): Promise<void> => {
    setBusy('others');
    try {
      await revokeOtherSessions();
      setSessions((list) => (list ?? []).filter((s) => s.isCurrent));
    } catch (err: unknown) {
      setError((err as Error).message || t('common.error'));
    } finally {
      setBusy(null);
    }
  };

  const others = (sessions ?? []).filter((s) => !s.isCurrent);

  return (
    <div className="card" style={{ padding:24, marginTop:20, display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
        <div>
          <p style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, fontWeight:800, color:'#0f172a' }}>
            <Monitor size={16} style={{ color:'#0ea5e9' }}/> {t('student.profile.devices.title')}
          </p>
          <p style={{ fontSize:12.5, color:'#64748b', marginTop:4 }}>{t('student.profile.devices.subtitle')}</p>
        </div>
        {others.length > 0 && (
          <button type="button" onClick={dropOthers} disabled={busy !== null} className="btn-outline"
            style={{ fontSize:12, padding:'7px 12px', opacity: busy !== null ? 0.7 : 1 }}>
            {busy === 'others' ? <Loader size={13} className="dl-spin" /> : <LogOut size={13} />}
            {t('student.profile.devices.revokeOthers')}
          </button>
        )}
      </div>

      {error && <p style={{ fontSize:13, color:'#dc2626' }}>{error}</p>}

      {sessions === null ? (
        <p style={{ fontSize:13, color:'#94a3b8' }}>{t('common.loading')}</p>
      ) : (
        <ul style={{ listStyle:'none', display:'flex', flexDirection:'column', gap:10 }}>
          {sessions.map((s) => (
            <li key={s.id}
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap',
                padding:'12px 14px', borderRadius:12, border:'1.5px solid #e2e8f0',
                background: s.isCurrent ? '#f0f9ff' : '#fff' }}>
              <div style={{ minWidth:0 }}>
                <p style={{ display:'flex', alignItems:'center', gap:8, fontSize:13.5, fontWeight:700, color:'#0f172a' }}>
                  {s.device || t('student.profile.devices.unknown')}
                  {s.isCurrent && (
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700,
                      color:'#0369a1', background:'#e0f2fe', borderRadius:999, padding:'2px 8px' }}>
                      <ShieldCheck size={11}/> {t('student.profile.devices.current')}
                    </span>
                  )}
                </p>
                <p style={{ fontSize:12, color:'#64748b', marginTop:3 }}>
                  {relative(s.lastSeenAt)}
                  {s.ip ? ` · ${s.ip}` : ''}
                  {` · ${t('student.profile.devices.since', { date: formatDateTime(s.createdAt, { dateStyle:'short', timeStyle:'short' }) })}`}
                </p>
              </div>
              {!s.isCurrent && (
                <button type="button" onClick={() => void dropOne(s.id)} disabled={busy !== null} className="btn-outline"
                  style={{ fontSize:12, padding:'6px 11px', flexShrink:0, opacity: busy !== null ? 0.7 : 1 }}>
                  {busy === s.id ? <Loader size={12} className="dl-spin" /> : <LogOut size={12} />}
                  {t('student.profile.devices.revoke')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
