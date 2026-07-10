import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Video, Radio } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LiveSession, getMySessions } from '../../api/sessions';
import { SESSION_STATUS_META, formatSessionTime } from './sessionMeta';

// Talaba kabinetida yaqinlashayotgan jonli darslar ro'yxati
export default function UpcomingSessionsPanel(): React.ReactElement | null {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loaded, setLoaded]     = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    getMySessions()
      .then((data) => { if (!cancelled) { setSessions(data); setLoaded(true); } })
      .catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  if (!loaded || sessions.length === 0) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Video size={17} style={{ color: '#9333ea' }} /> {t('sessions.panelTitle')}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sessions.map((s) => {
          const meta = SESSION_STATUS_META[s.status];
          const isLive = s.status === 'LIVE';
          return (
            <div key={s.id} className="card"
              style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', background: s.course.bg, border: `1.5px solid ${s.course.border}` }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', border: `1.5px solid ${s.course.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isLive
                  ? <Radio size={19} style={{ color: '#16a34a' }} />
                  : <Video size={19} style={{ color: s.course.color }} />}
              </div>
              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <p style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a' }}>{s.title}</p>
                <p style={{ fontSize: 12.5, color: '#64748b' }}>
                  {s.course.title} · {s.mentor.name} · {formatSessionTime(s.startsAt, s.durationMin)}
                </p>
                {s.description && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>{s.description}</p>}
              </div>
              <span className="tag" style={{ background: meta.bg, borderColor: meta.border, color: meta.color, fontWeight: 700, flexShrink: 0 }}>
                {t(meta.labelKey)}
              </span>
              <Link to={`/live/${s.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
                <button className={isLive ? 'btn-primary' : 'btn-outline'} style={{ fontSize: 12.5, padding: '9px 16px' }}>
                  <Video size={14} /> {isLive ? t('sessions.join') : t('sessions.openRoom')}
                </button>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
