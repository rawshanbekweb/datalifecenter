import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import { useAuth } from '../../hooks/useAuth';
import { getMyNotifications, markAllNotificationsRead, markNotificationRead, type AppNotification } from '../../api/notifications';

const POLL_MS = 45000;

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return i18n.t('notifications.timeAgo.now');
  if (min < 60) return i18n.t('notifications.timeAgo.minutes', { n: min });
  const hr = Math.floor(min / 60);
  if (hr < 24) return i18n.t('notifications.timeAgo.hours', { n: hr });
  const day = Math.floor(hr / 24);
  return i18n.t('notifications.timeAgo.days', { n: day });
}

export default function NotificationBell(): React.ReactElement | null {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [open, setOpen] = useState<boolean>(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = (): void => {
    getMyNotifications().then((res) => { setItems(res.items); setUnreadCount(res.unreadCount); }).catch(() => {});
  };

  useEffect(() => {
    if (!user) return;
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [user]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent): void => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!user) return null;

  const handleItemClick = async (n: AppNotification): Promise<void> => {
    setOpen(false);
    if (!n.readAt) {
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, readAt: new Date().toISOString() } : i)));
      setUnreadCount((c) => Math.max(0, c - 1));
      markNotificationRead(n.id).catch(() => {});
    }
    if (n.link) navigate(n.link);
  };

  const handleMarkAll = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt || new Date().toISOString() })));
    setUnreadCount(0);
    markAllNotificationsRead().catch(() => {});
  };

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <button onClick={() => setOpen((v) => !v)} title={t('notifications.title')}
        style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', border: '1.5px solid #e2e8f0', color: '#475569', cursor: 'pointer' }}>
        <Bell size={16} />
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, background: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', border: '2px solid #fff' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 44, right: 0, width: 340, maxWidth: '90vw', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', zIndex: 200, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>{t('notifications.title')}</p>
            {unreadCount > 0 && (
              <button onClick={handleMarkAll} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: '#0ea5e9', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                <CheckCheck size={13} /> {t('notifications.markAll')}
              </button>
            )}
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {items.length === 0 && (
              <p style={{ padding: '28px 16px', textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>{t('notifications.empty')}</p>
            )}
            {items.map((n) => (
              <button key={n.id} onClick={() => handleItemClick(n)}
                style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 16px', background: n.readAt ? '#fff' : '#f0f9ff', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  {!n.readAt && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0ea5e9', flexShrink: 0, marginTop: 5 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{n.title}</p>
                    {n.body && <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 4 }}>{n.body}</p>}
                    <p style={{ fontSize: 10.5, color: '#94a3b8' }}>{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
