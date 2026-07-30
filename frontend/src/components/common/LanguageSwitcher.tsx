import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, m } from 'framer-motion';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { ENABLED_LOCALES, LOCALE_ENGLISH_LABELS, LOCALE_LABELS, Locale } from '../../i18n/config';
import { useLocale } from '../../hooks/useLocale';

// ENABLED_LOCALES'da bitta til bo'lsa (Stage 0) hech narsa ko'rsatmaydi —
// yangi til qo'shilishi bilan (config.ts) avtomatik paydo bo'ladi.
export default function LanguageSwitcher(): React.ReactElement | null {
  const { t } = useTranslation();
  const { locale, switchLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Escape bilan yopilganda fokus tugmaga qaytadi, ochilganda esa joriy til
  // elementiga o'tadi — klaviatura bilan yurish uzilib qolmaydi.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    menuRef.current?.querySelector<HTMLButtonElement>('[data-active="true"]')?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (ENABLED_LOCALES.length < 2) return null;

  const choose = (loc: Locale): void => {
    setOpen(false);
    if (loc !== locale) switchLocale(loc);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        title={`${t('nav.language')} — ${LOCALE_LABELS[locale]}`}
        aria-label={`${t('nav.language')}: ${LOCALE_ENGLISH_LABELS[locale]}`}
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderRadius: 10,
          background: open ? '#e0f2fe' : '#f1f5f9',
          border: `1.5px solid ${open ? '#bae6fd' : '#e2e8f0'}`,
          color: open ? '#0284c7' : '#475569',
          cursor: 'pointer', fontSize: 13, fontWeight: 700, lineHeight: 1,
          transition: 'background 0.2s, border-color 0.2s, color 0.2s',
        }}
      >
        <Globe size={15} style={{ flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.04em' }}>
          {locale.toUpperCase()}
        </span>
        <ChevronDown
          size={13}
          style={{ flexShrink: 0, opacity: 0.7, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
            <m.div
              ref={menuRef}
              role="menu"
              aria-label={t('nav.language')}
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              style={{
                position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#fff',
                border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 12px 34px rgba(15,23,42,0.13)',
                overflow: 'hidden', minWidth: 190, zIndex: 200, transformOrigin: 'top right',
              }}
            >
              <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#94a3b8', padding: '9px 14px 6px' }}>
                {t('nav.language')}
              </p>
              {ENABLED_LOCALES.map((loc) => {
                const active = loc === locale;
                return (
                  <button
                    key={loc}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    data-active={active}
                    // `lang` — brauzer shu element uchun to'g'ri shrift/tipografika
                    // qoidalarini (masalan :lang(ru) harflar orasi) qo'llashi uchun.
                    lang={loc === 'kaa' ? 'uz' : loc}
                    title={LOCALE_ENGLISH_LABELS[loc]}
                    onClick={() => choose(loc)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                      padding: '9px 14px', fontSize: 13.5,
                      fontWeight: active ? 700 : 500,
                      color: active ? '#0284c7' : '#334155',
                      background: active ? '#f0f9ff' : '#fff',
                      border: 'none', cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = '#fff'; }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                        padding: '3px 6px', borderRadius: 6, flexShrink: 0, minWidth: 34, textAlign: 'center',
                        background: active ? '#0ea5e9' : '#f1f5f9',
                        color: active ? '#fff' : '#64748b',
                      }}
                    >
                      {loc.toUpperCase()}
                    </span>
                    <span style={{ flex: 1 }}>{LOCALE_LABELS[loc]}</span>
                    {active && <Check size={14} style={{ flexShrink: 0 }} />}
                  </button>
                );
              })}
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
