import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, LayoutTemplate } from 'lucide-react';
import { Locale } from '../../i18n/config';
import { SectionKey } from '../../types/siteSettings';
import { SECTION_TEMPLATES, SectionTemplate, pickLocale } from './siteSettingTemplates';

/**
 * Bo'lim uchun tayyor shablonlar ro'yxati.
 *
 * Yopiq holatda faqat bitta qator egallaydi — forma bilan ishlayotgan adminni
 * chalg'itmasligi uchun. Shablonni qo'llash mavjud kontentni almashtiradi,
 * shuning uchun tasdiq so'raladi (tasdiqni chaqiruvchi `onApply` boshqaradi).
 */

interface TemplatePickerProps {
  section: SectionKey;
  /** Tanlangan shablon ma'lumotini qo'llaydi (tasdiq so'rash chaqiruvchida) */
  onApply: (template: SectionTemplate) => void;
  /** Shablon nomlari qaysi tilda ko'rsatilsin — interfeys tili */
  locale: Locale;
}

export default function TemplatePicker({ section, onApply, locale }: TemplatePickerProps): React.ReactElement | null {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const templates = SECTION_TEMPLATES[section] as SectionTemplate<SectionKey>[];
  if (!templates?.length) return null;

  return (
    <div style={{
      border: '1.5px solid #e2e8f0', borderRadius: 14, background: '#fff',
      marginBottom: 16, overflow: 'hidden',
    }}>
      <button
        type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px', background: 'transparent', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <LayoutTemplate size={16} style={{ color: '#0ea5e9', flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
            {t('admin.siteSettings.templatesTitle')}
          </span>
          <span style={{ display: 'block', fontSize: 11.5, color: '#94a3b8' }}>
            {t('admin.siteSettings.templatesHint', { n: templates.length })}
          </span>
        </span>
        <ChevronDown
          size={16}
          style={{
            color: '#94a3b8', flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform .2s ease',
          }}
        />
      </button>

      {open && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10,
          padding: '0 14px 14px', borderTop: '1px solid #f1f5f9', paddingTop: 14,
        }}>
          {templates.map((tpl) => (
            <div key={tpl.id} style={{
              display: 'flex', flexDirection: 'column', gap: 8,
              padding: 12, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0',
            }}>
              <p style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
                {pickLocale(tpl.name, locale)}
              </p>
              <p style={{ flex: 1, fontSize: 11.5, color: '#64748b', lineHeight: 1.55 }}>
                {pickLocale(tpl.desc, locale)}
              </p>
              <button
                type="button" onClick={() => onApply(tpl)} className="btn-outline"
                style={{ fontSize: 12, padding: '7px 12px', justifyContent: 'center' }}
              >
                {t('admin.siteSettings.templateApply')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
