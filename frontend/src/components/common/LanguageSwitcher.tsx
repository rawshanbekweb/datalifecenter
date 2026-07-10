import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { ENABLED_LOCALES, LOCALE_LABELS } from '../../i18n/config';
import { useLocale } from '../../hooks/useLocale';

// ENABLED_LOCALES'da bitta til bo'lsa (Stage 0) hech narsa ko'rsatmaydi —
// yangi til qo'shilishi bilan (config.ts) avtomatik paydo bo'ladi.
export default function LanguageSwitcher(): React.ReactElement | null {
  const { t } = useTranslation();
  const { locale, switchLocale } = useLocale();
  const [open, setOpen] = useState(false);

  if (ENABLED_LOCALES.length < 2) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title={t('nav.language')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 10,
          background: '#f1f5f9', border: '1.5px solid #e2e8f0', color: '#475569', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}
      >
        <Globe size={15} /> {locale.toUpperCase()}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
          <div
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#fff',
              border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              overflow: 'hidden', minWidth: 150, zIndex: 200,
            }}
          >
            {ENABLED_LOCALES.map((loc) => (
              <button
                key={loc}
                onClick={() => { setOpen(false); switchLocale(loc); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 13,
                  fontWeight: loc === locale ? 700 : 500,
                  color: loc === locale ? '#0ea5e9' : '#334155',
                  background: loc === locale ? '#f0f9ff' : '#fff',
                  border: 'none', cursor: 'pointer',
                }}
              >
                {LOCALE_LABELS[loc]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
