import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SkillsInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  label: string;
  max?: number;
}

/**
 * Ko'nikmalar ro'yxati — Enter yoki vergul bilan qo'shiladi.
 *
 * Oddiy "vergul bilan ajratilgan matn" maydoni emas: xodim nimani kiritganini
 * darhol teg sifatida ko'radi va backend ham massiv kutadi (TeamMember.skills).
 */
export default function SkillsInput({ value, onChange, label, max = 20 }: SkillsInputProps): React.ReactElement {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');

  const add = (raw: string): void => {
    // Bir vaqtda bir nechta ("React, Node, SQL") qo'yilishi ham qo'llab-quvvatlanadi
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const p of parts) {
      if (next.length >= max) break;
      if (!next.some((s) => s.toLowerCase() === p.toLowerCase())) next.push(p);
    }
    onChange(next);
    setDraft('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' || e.key === ',') {
      // Enter formani yubormasligi kerak — bu maydon forma ichida yashaydi
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div>
      <label style={{ fontSize: 12, color: '#475569', fontWeight: 600, display: 'block', marginBottom: 5 }}>
        {label} <span style={{ color: '#94a3b8', fontWeight: 500 }}>({value.length}/{max})</span>
      </label>
      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {value.map((s) => (
            <span key={s} className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#f0f9ff', borderColor: '#bae6fd', color: '#0284c7' }}>
              {s}
              <button type="button" onClick={() => onChange(value.filter((x) => x !== s))} aria-label={`${s} — ${t('common.delete')}`}
                style={{ display: 'flex', border: 'none', background: 'transparent', cursor: 'pointer', color: 'inherit', padding: 0 }}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        className="inp"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        // Maydondan chiqib ketilganda yozilgan matn yo'qolmasin
        onBlur={() => add(draft)}
        disabled={value.length >= max}
        placeholder={t('team.form.skillsPlaceholder')}
      />
      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{t('team.form.skillsHint')}</p>
    </div>
  );
}
