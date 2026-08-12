import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ALL_ITEMS } from './adminNav';
import { Z } from '../../utils/zLayers';

/**
 * Ctrl+K — bo'limlarga klaviaturadan o'tish.
 *
 * Admin panelida yigirmata bo'lim bor va ular guruhlarga yig'ilgan, ya'ni
 * ko'pchiligiga yetish uchun avval guruhni ochish kerak. Bu oyna shu narxni
 * qoplaydi: bir necha harf yozib Enter bosasiz.
 *
 * Qidiruv TARJIMA QILINGAN nom bo'yicha ishlaydi — admin qaysi tilda ishlayotgan
 * bo'lsa, o'sha tilda yozadi. Manzil bo'yicha ham topiladi ("users" deb yozib
 * Foydalanuvchilarni topish mumkin), chunki manzillar hamma tilda bir xil.
 */

const MAX_RESULTS = 8;

/**
 * Header'dagi tugma shu hodisani yuboradi.
 *
 * Oyna o'z holatini o'zi boshqaradi, shuning uchun tugmaga prop uzatish uchun
 * holatni layout darajasiga ko'tarish kerak bo'lardi — bu esa har bosishda
 * butun admin panelini qayta render qilardi. Hodisa bilan ikkalasi bir-biridan
 * mustaqil qoladi.
 */
export const QUICK_JUMP_EVENT = 'admin:quick-jump';

export default function QuickJump(): React.ReactElement | null {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [cursor, setCursor] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Oyna yopilganda fokus qaysi elementda edi — o'sha yerga qaytariladi
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        // Brauzerning o'z Ctrl+K si (manzil qatoridan qidirish) ochilib
        // ketmasligi uchun hodisani o'zimizda ushlab qolamiz
        e.preventDefault();
        restoreFocus.current = document.activeElement as HTMLElement | null;
        setOpen((v) => !v);
      }
    };
    const onRequest = (): void => {
      restoreFocus.current = document.activeElement as HTMLElement | null;
      setOpen(true);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener(QUICK_JUMP_EVENT, onRequest);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener(QUICK_JUMP_EVENT, onRequest);
    };
  }, []);

  // Har ochilishda toza holatdan boshlanadi
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setCursor(0);
    // Fokus render tugagach beriladi
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const withLabels = ALL_ITEMS.map((item) => ({ item, label: t(item.labelKey) }));
    if (!needle) return withLabels.slice(0, MAX_RESULTS);
    return withLabels
      .filter(({ item, label }) =>
        label.toLowerCase().includes(needle) || item.to.toLowerCase().includes(needle))
      .slice(0, MAX_RESULTS);
  }, [query, t]);

  if (!open) return null;

  const close = (): void => {
    setOpen(false);
    restoreFocus.current?.focus();
  };

  const go = (to: string): void => {
    close();
    navigate(to);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => (results.length ? (c + 1) % results.length : 0));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => (results.length ? (c - 1 + results.length) % results.length : 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = results[cursor] ?? results[0];
      if (chosen) go(chosen.item.to);
    }
  };

  return (
    <div
      onKeyDown={onKeyDown}
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={t('admin.quickJump.title')}
      style={{
        position:'fixed', inset:0, zIndex: Z.modal,
        background:'rgba(15,23,42,0.55)',
        display:'flex', alignItems:'flex-start', justifyContent:'center',
        padding:'12vh 16px 16px',
      }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width:'100%', maxWidth:520, background:'#fff', borderRadius:16, border:'1px solid #e2e8f0', boxShadow:'0 24px 60px rgba(15,23,42,0.25)', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderBottom:'1px solid #e2e8f0' }}>
          <Search size={16} style={{ color:'#94a3b8', flexShrink:0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
            placeholder={t('admin.quickJump.placeholder')}
            style={{ flex:1, border:'none', outline:'none', fontSize:14.5, color:'#0f172a', background:'transparent' }} />
          <kbd style={{ fontSize:10.5, fontWeight:700, color:'#94a3b8', border:'1px solid #e2e8f0', borderRadius:6, padding:'2px 6px', fontFamily:'var(--font-mono)' }}>ESC</kbd>
        </div>

        {results.length === 0 && (
          <p style={{ padding:'20px 16px', fontSize:13, color:'#94a3b8', textAlign:'center' }}>
            {t('admin.quickJump.empty')}
          </p>
        )}

        <div style={{ padding:6, maxHeight:'52vh', overflowY:'auto' }}>
          {results.map(({ item, label }, i) => {
            const Icon = item.icon;
            const active = i === cursor;
            return (
              <button key={item.to} type="button"
                onClick={() => go(item.to)}
                onMouseEnter={() => setCursor(i)}
                style={{
                  display:'flex', alignItems:'center', gap:11, width:'100%',
                  padding:'10px 12px', borderRadius:10, border:'none', cursor:'pointer', textAlign:'left',
                  fontSize:13.5, fontWeight:600,
                  background: active ? '#f0f9ff' : 'transparent',
                  color: active ? '#0369a1' : '#334155',
                }}>
                <Icon size={15} />
                <span style={{ flex:1 }}>{label}</span>
                {active && <CornerDownLeft size={13} style={{ color:'#94a3b8' }} />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
