import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Radio, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LiveSession, getSession } from '../api/sessions';
import { useAuth } from '../hooks/useAuth';
import { SESSION_STATUS_META, formatSessionTime } from '../components/sessions/sessionMeta';

type Status = 'loading' | 'ready' | 'forbidden' | 'error';

// Jitsi xonalari saytning o'zida iframe orqali ochiladi; boshqa provayderlar
// (Zoom, Google Meet) iframe'da ishlashga ruxsat bermaydi — tashqi havola qoladi.
function isEmbeddableJitsi(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host === 'meet.jit.si' || host.endsWith('.jit.si') || host === '8x8.vc' || host.endsWith('.8x8.vc');
  } catch {
    return false;
  }
}

// Jitsi panelida ko'rinadigan tugmalar — `desktop` ekran ulashish (mentor
// noutbuk ekranini translyatsiya qilishi) uchun ochiq turishi shart
const JITSI_TOOLBAR = ['microphone', 'camera', 'desktop', 'tileview', 'raisehand', 'fullscreen', 'chat', 'settings', 'hangup'];

// Jitsi URL'iga foydalanuvchi ismi, "kutish sahifasi"ni o'chirish, "ilovada
// ochish" bezovtasini o'chirish va to'g'ri toolbar sozlamasini qo'shadi —
// talaba/mentor sahifaga kirgach darhol xonaga qo'shiladi
function jitsiEmbedUrl(url: string, displayName: string): string {
  const base = url.split('#')[0];
  const config = [
    `userInfo.displayName=${encodeURIComponent(JSON.stringify(displayName))}`,
    'config.prejoinConfig.enabled=false',
    'config.disableDeepLinking=true',
    `config.toolbarButtons=${encodeURIComponent(JSON.stringify(JITSI_TOOLBAR))}`,
  ].join('&');
  return `${base}#${config}`;
}

export default function LiveSessionPage(): React.ReactElement {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [session, setSession] = useState<LiveSession | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    getSession(id!)
      .then((data) => { if (!cancelled) { setSession(data); setStatus('ready'); } })
      .catch((err: { status?: number; message?: string }) => {
        if (cancelled) return;
        setErrorMsg(err.message || t('common.error'));
        setStatus(err.status === 403 ? 'forbidden' : 'error');
      });
    return () => { cancelled = true; };
  }, [id, t]);

  // Rejalashtirilgan sessiya mentor tomonidan boshlanishi (yoki vaqti o'tib
  // yakunlanishi) ni kutayotganda sahifa o'zi yangilanib turadi
  useEffect(() => {
    if (!session || session.status !== 'SCHEDULED') return;
    const timer = setInterval(() => {
      getSession(id!).then(setSession).catch(() => {});
    }, 60_000);
    return () => clearInterval(timer);
  }, [id, session]);

  const embeddable = useMemo(
    () => (session ? isEmbeddableJitsi(session.meetingUrl) : false),
    [session]
  );

  if (status === 'loading') {
    return <section style={{ padding: '200px 24px 80px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>{t('common.loading')}</section>;
  }

  if (status === 'forbidden' || status === 'error' || !session) {
    return (
      <section style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '160px 24px 80px' }}>
        <div className="card" style={{ padding: 32, maxWidth: 480, textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
            {status === 'forbidden' ? t('student.live.noAccess') : t('common.error')}
          </p>
          <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 20 }}>{errorMsg}</p>
          <Link to="/dashboard"><button className="btn-outline"><ArrowLeft size={14} /> {t('cabinet.backToCabinet')}</button></Link>
        </div>
      </section>
    );
  }

  const meta = SESSION_STATUS_META[session.status];
  const isLive = session.status === 'LIVE';
  const canJoin = session.status === 'LIVE' || session.status === 'SCHEDULED';
  // Boshlanishiga 10 daqiqadan ko'p vaqt bo'lsa — bo'sh xonaga kiritmay, kutish kartasi ko'rsatiladi
  const isEarly = session.status === 'SCHEDULED' && Date.now() < new Date(session.startsAt).getTime() - 10 * 60_000;

  return (
    <section style={{ padding: '110px 0 40px', minHeight: '100vh', background: '#0f172a' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        {/* Sarlavha paneli */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
          <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> {t('cabinet.cabinet')}
          </Link>
          <div style={{ width: 1, height: 16, background: '#334155' }} />
          {isLive
            ? <Radio size={16} style={{ color: '#4ade80' }} />
            : <Video size={16} style={{ color: '#7dd3fc' }} />}
          <p style={{ fontSize: 15, fontWeight: 800, color: '#f8fafc', flex: '1 1 auto', minWidth: 0 }}>
            {session.title}
          </p>
          <span className="tag" style={{ background: meta.bg, borderColor: meta.border, color: meta.color, fontWeight: 700, flexShrink: 0 }}>
            {t(meta.labelKey)}
          </span>
        </div>
        <p style={{ fontSize: 12.5, color: '#94a3b8', marginBottom: 16 }}>
          {session.course.title} · {session.mentor.name} · {formatSessionTime(session.startsAt, session.durationMin)}
        </p>

        {isEarly ? (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <Video size={26} style={{ color: '#94a3b8', margin: '0 auto 10px' }} />
            <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{t('student.live.notStarted')}</p>
            <p style={{ fontSize: 13.5, color: '#64748b' }}>
              {formatSessionTime(session.startsAt, session.durationMin)}
            </p>
            <p style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 8 }}>{t('student.live.roomOpens')}</p>
          </div>
        ) : canJoin && embeddable ? (
          <>
            {(user?.role === 'MENTOR' || user?.role === 'ADMIN') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', marginBottom: 10, borderRadius: 10, background: 'rgba(14,165,233,0.12)', border: '1px solid #0e7490' }}>
                <Video size={14} style={{ color: '#7dd3fc', flexShrink: 0 }} />
                <p style={{ fontSize: 12.5, color: '#bae6fd' }}>{t('student.live.mentorTip')}</p>
              </div>
            )}
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #334155', background: '#000' }}>
              <iframe
                title={session.title}
                src={jitsiEmbedUrl(session.meetingUrl, user?.name || t('student.live.participant'))}
                allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
                style={{ width: '100%', height: 'calc(100vh - 175px)', minHeight: 520, border: 'none', display: 'block' }}
              />
            </div>
          </>
        ) : (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            {canJoin ? (
              <>
                <p style={{ fontSize: 14, color: '#475569', marginBottom: 18 }}>
                  {t('student.live.externalInfo', { host: (() => { try { return new URL(session.meetingUrl).hostname; } catch { return 'URL'; } })() })}
                </p>
                <a href={session.meetingUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <button className="btn-primary"><ExternalLink size={14} /> {t('sessions.join')}</button>
                </a>
              </>
            ) : (
              <p style={{ fontSize: 14, color: '#475569' }}>
                {session.status === 'ENDED' ? t('student.live.ended') : t('student.live.cancelled')}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
