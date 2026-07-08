import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Video } from 'lucide-react';
import { LiveSession, getMySessions } from '../../api/sessions';
import { SESSION_STATUS_META, formatSessionTime } from '../../components/sessions/sessionMeta';

// Talaba yozilgan kurslarning barcha jonli darslari
export default function StudentSessionsPage(): React.ReactElement {
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [status, setStatus]     = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    getMySessions()
      .then((data) => { if (!cancelled) { setSessions(data); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
          Jonli <span className="accent">darslar</span>
        </h1>
        <p style={{ fontSize: 13.5, color: '#64748b' }}>Siz yozilgan kurslar bo'yicha rejalashtirilgan onlayn darslar</p>
      </div>

      {status === 'loading' && <p style={{ color: '#94a3b8', fontSize: 14 }}>Yuklanmoqda...</p>}
      {status === 'error' && <p style={{ color: '#dc2626', fontSize: 14 }}>Ma'lumotlarni yuklab bo'lmadi.</p>}

      {status === 'ready' && sessions.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>
            Hozircha rejalashtirilgan jonli darslar yo'q. Kursga yozilsangiz, mentorlaringiz e'lon qilgan darslar shu yerda ko'rinadi.
          </p>
          <Link to="/courses">
            <button className="btn-primary">Kurslarni ko'rish</button>
          </Link>
        </div>
      )}

      {status === 'ready' && sessions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sessions.map((s) => {
            const meta = SESSION_STATUS_META[s.status];
            const isLive = s.status === 'LIVE';
            return (
              <div key={s.id} className="card"
                style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', background: s.course.bg, border: `1.5px solid ${s.course.border}` }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', border: `1.5px solid ${s.course.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Video size={19} style={{ color: isLive ? '#16a34a' : s.course.color }} />
                </div>
                <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <p style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a' }}>{s.title}</p>
                  <p style={{ fontSize: 12.5, color: '#64748b' }}>
                    {s.course.title} · {s.mentor.name} · {formatSessionTime(s.startsAt, s.durationMin)}
                  </p>
                  {s.description && <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>{s.description}</p>}
                </div>
                <span className="tag" style={{ background: meta.bg, borderColor: meta.border, color: meta.color, fontWeight: 700, flexShrink: 0 }}>
                  {meta.label}
                </span>
                <a href={s.meetingUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', flexShrink: 0 }}>
                  <button className={isLive ? 'btn-primary' : 'btn-outline'} style={{ fontSize: 12.5, padding: '9px 16px' }}>
                    <Video size={14} /> {isLive ? "Darsga qo'shilish" : 'Xona havolasi'}
                  </button>
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
