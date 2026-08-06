import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ENABLED_LOCALES, LOCALE_ENGLISH_LABELS, Locale, CONTENT_BASE_LOCALE } from '../../i18n/config';
import { LocalizedString } from '../../types/locale';

interface LocalizedFieldProps {
  label: string;
  value: LocalizedString;
  onChange: (next: LocalizedString) => void;
  multiline?: boolean;
  required?: boolean;
  placeholder?: string;
  rows?: number;
}

// Barcha admin kontent-tahrirlash formalarida oddiy <input>/<textarea> o'rniga
// ishlatiladi — ENABLED_LOCALES bo'yicha til-tab beradi. Stage 0'da faqat bitta
// (UZ) til yoqilgani uchun tab qatori butunlay yashiriladi va oddiy inputdek ko'rinadi;
// yangi til ENABLED_LOCALES'ga qo'shilishi bilan bu yerda hech narsa o'zgartirish shart emas.
//
// DIQQAT: bu yerda CONTENT_BASE_LOCALE (uz) ishlatiladi, DEFAULT_LOCALE emas.
// Sayt interfeysi qoraqalpoqchada ochilsa ham, bazadagi kontentning majburiy
// tayanch tili uz bo'lib qoladi (backend validatori shuni talab qiladi va slug
// title.uz dan yasaladi) — sabab i18n/config.ts izohida.
export default function LocalizedField({
  label,
  value,
  onChange,
  multiline,
  required,
  placeholder,
  rows = 3,
}: LocalizedFieldProps): React.ReactElement {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Locale>(CONTENT_BASE_LOCALE);
  const current = value?.[tab] ?? '';
  const base = value?.[CONTENT_BASE_LOCALE] ?? '';
  const showTabs = ENABLED_LOCALES.length > 1;

  const setTabValue = (v: string): void => {
    onChange({ ...value, [tab]: v });
  };

  return (
    <div>
      {(label || showTabs) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 5, minHeight: 20 }}>
          <label style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
            {label}{label && required ? ' *' : ''}
          </label>
          {showTabs && (
            <div style={{ display: 'flex', gap: 4 }}>
              {ENABLED_LOCALES.map((loc) => {
                const active = tab === loc;
                // Bo'sh tarjimalar shu yerda darhol ko'rinadi — admin har bir
                // tabni bosib chiqmasdan qaysi til qolganini biladi.
                const missing = !(value?.[loc] ?? '').trim();
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setTab(loc)}
                    aria-pressed={active}
                    title={`${LOCALE_ENGLISH_LABELS[loc]}${missing ? ` — ${t('admin.localizedField.empty')}` : ''}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10.5,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      padding: '3px 7px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      border: active ? '1.5px solid #0ea5e9' : '1px solid #e2e8f0',
                      background: active ? '#f0f9ff' : '#fff',
                      color: active ? '#0ea5e9' : '#64748b',
                    }}
                  >
                    {loc.toUpperCase()}
                    {missing && loc !== CONTENT_BASE_LOCALE && (
                      <span aria-hidden style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      {multiline ? (
        <textarea
          className="inp"
          lang={tab === 'kaa' ? 'uz' : tab}
          value={current}
          onChange={(e) => setTabValue(e.target.value)}
          required={required && tab === CONTENT_BASE_LOCALE}
          rows={rows}
          style={{ resize: 'none' }}
          placeholder={placeholder}
        />
      ) : (
        <input
          className="inp"
          lang={tab === 'kaa' ? 'uz' : tab}
          value={current}
          onChange={(e) => setTabValue(e.target.value)}
          required={required && tab === CONTENT_BASE_LOCALE}
          placeholder={placeholder}
        />
      )}
      {tab !== CONTENT_BASE_LOCALE && !current && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
          <p style={{ fontSize: 11, color: '#94a3b8' }}>{t('admin.localizedField.untranslated')}</p>
          {base && (
            <button
              type="button"
              onClick={() => setTabValue(base)}
              style={{ fontSize: 11, fontWeight: 700, color: '#0ea5e9', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}
            >
              {t('admin.localizedField.copyFromBase')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
