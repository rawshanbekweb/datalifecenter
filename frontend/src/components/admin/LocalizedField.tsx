import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ENABLED_LOCALES, Locale } from '../../i18n/config';
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
  const [tab, setTab] = useState<Locale>('uz');
  const current = value?.[tab] ?? '';

  const setTabValue = (v: string): void => {
    onChange({ ...value, [tab]: v });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <label style={{ fontSize: 12, color: '#475569', fontWeight: 600 }}>
          {label} {required && '*'}
        </label>
        {ENABLED_LOCALES.length > 1 && (
          <div style={{ display: 'flex', gap: 4 }}>
            {ENABLED_LOCALES.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => setTab(loc)}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  border: tab === loc ? '1.5px solid #0ea5e9' : '1px solid #e2e8f0',
                  background: tab === loc ? '#f0f9ff' : '#fff',
                  color: tab === loc ? '#0ea5e9' : '#64748b',
                }}
              >
                {loc.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>
      {multiline ? (
        <textarea
          className="inp"
          value={current}
          onChange={(e) => setTabValue(e.target.value)}
          required={required && tab === 'uz'}
          rows={rows}
          style={{ resize: 'none' }}
          placeholder={placeholder}
        />
      ) : (
        <input
          className="inp"
          value={current}
          onChange={(e) => setTabValue(e.target.value)}
          required={required && tab === 'uz'}
          placeholder={placeholder}
        />
      )}
      {tab !== 'uz' && !current && (
        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
          {t('admin.localizedField.untranslated')}
        </p>
      )}
    </div>
  );
}
