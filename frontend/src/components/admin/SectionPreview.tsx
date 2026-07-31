import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Mail, MapPin, Phone, Send } from 'lucide-react';
import { resolveIcon } from '../../utils/iconMap';
import { Locale } from '../../i18n/config';
import { LocalizedString } from '../../types/locale';
import {
  AboutData, ContactData, HeroData, SectionKey, Sections, ServicesData, WhyUsData,
} from '../../types/siteSettings';

/**
 * Sayt sozlamalarining JONLI KO'RINISHI.
 *
 * Bosh sahifadagi haqiqiy komponentlar (Hero, About, Services…) qayta
 * ishlatilmadi — ular butun ekran kengligiga mo'ljallangan, framer-motion
 * `whileInView` animatsiyalariga bog'liq va tarjimasi yechilgan (string)
 * ma'lumot kutadi. Admin formasida esa xom `LocalizedString` turadi va panel
 * tor ustunga sig'ishi kerak. Shu sabab bu yerda ataylab soddalashtirilgan,
 * lekin ayni dizayn tilidagi (rang chizig'i, ikonka qutisi, karta) nusxa
 * chiziladi: maqsad — piksel aniqligi emas, kontentni saqlashdan oldin
 * ko'rish (ikonka, rang, matn uzunligi, elementlar soni).
 */

interface SectionPreviewProps {
  section: SectionKey;
  data: Sections[SectionKey];
  /** Ko'rinish qaysi tilda chizilsin (admin til tugmalari bilan almashtiradi) */
  locale: Locale;
}

// ── Yordamchilar ─────────────────────────────────────────────────────────────

/** Tanlangan tildagi matn; tarjima bo'sh bo'lsa asosiy (uz) matnga qaytadi. */
function text(value: LocalizedString | undefined, locale: Locale): string {
  if (!value) return '';
  return (value[locale] ?? '').trim() || (value.uz ?? '').trim();
}

/** Matn umuman yo'q bo'lsa formadagi bo'sh joyni ko'rsatuvchi kulrang o'rin. */
function Placeholder({ label }: { label: string }): React.ReactElement {
  return <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>{label}</span>;
}

function Text({ value, locale, fallback }: { value: LocalizedString | undefined; locale: Locale; fallback: string }): React.ReactElement {
  const resolved = text(value, locale);
  return resolved ? <>{resolved}</> : <Placeholder label={fallback} />;
}

const CARD: React.CSSProperties = {
  position: 'relative', overflow: 'hidden',
  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
  padding: '14px 14px 14px 16px',
};

const GRID: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10,
};

// ── Bo'limlar ────────────────────────────────────────────────────────────────

function HeroPreview({ data, locale, empty }: { data: HeroData; locale: Locale; empty: string }): React.ReactElement {
  return (
    <div>
      {/* Hero'ning haqiqiy sarlavhasi tarjima fayllaridan keladi (admin uni bu
          yerdan tahrirlamaydi) — shuning uchun faqat ko'rgazma sifatida turadi */}
      <div style={{ textAlign: 'center', marginBottom: 16, opacity: 0.45 }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: '#0f172a' }}>DATA LIFE</div>
        <div style={{ fontSize: 11, color: '#64748b' }}>hero sarlavhasi — tarjima faylida</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(Math.max(data.stats.length, 1), 4)}, 1fr)`, gap: 8 }}>
        {data.stats.map((s, i) => (
          <div key={i} style={{ ...CARD, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#0ea5e9', lineHeight: 1.1 }}>
              {s.value || <Placeholder label="0" />}
            </div>
            <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 4 }}>
              <Text value={s.label} locale={locale} fallback={empty} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutPreview({ data, locale, empty }: { data: AboutData; locale: Locale; empty: string }): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={GRID}>
        {data.stats.map((s, i) => {
          const Icon = resolveIcon(s.icon);
          return (
            <div key={i} style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${s.color}14`, border: `1.5px solid ${s.color}33`,
              }}>
                <Icon size={16} style={{ color: s.color }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
                  {s.value || <Placeholder label="0" />}
                </div>
                <div style={{ fontSize: 10.5, color: '#64748b' }}>
                  <Text value={s.label} locale={locale} fallback={empty} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {data.features.length > 0 && (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {data.features.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#475569' }}>
              <CheckCircle size={14} style={{ color: '#10b981', flexShrink: 0, marginTop: 1 }} />
              <Text value={f} locale={locale} fallback={empty} />
            </li>
          ))}
        </ul>
      )}

      {data.skills.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {data.skills.map((s, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                <span style={{ color: '#334155', fontWeight: 600 }}>
                  <Text value={s.label} locale={locale} fallback={empty} />
                </span>
                <span style={{ color: '#0ea5e9', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{s.pct}%</span>
              </div>
              <div style={{ height: 5, borderRadius: 5, background: '#f1f5f9', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 5, width: `${Math.min(100, Math.max(0, s.pct))}%`,
                  background: 'linear-gradient(90deg,#0ea5e9,#6366f1)',
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {data.satisfaction.length > 0 && (
        <div style={{ display: 'flex', gap: 10 }}>
          {data.satisfaction.map((s, i) => (
            <div key={i} style={{ ...CARD, flex: 1, padding: 12, textAlign: 'center', background: '#f8fafc' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#6366f1', lineHeight: 1.1 }}>
                {s.value || <Placeholder label="0" />}
              </div>
              <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 3 }}>
                <Text value={s.label} locale={locale} fallback={empty} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ServicesPreview({ data, locale, empty }: { data: ServicesData; locale: Locale; empty: string }): React.ReactElement {
  return (
    <div style={GRID}>
      {data.items.map((it, i) => {
        const Icon = resolveIcon(it.icon);
        return (
          <div key={i} style={{ ...CARD, paddingTop: 16 }}>
            {/* Saytdagidek yuqoridagi rang chizig'i */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: it.color }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${it.color}14`, border: `1.5px solid ${it.color}33`,
              }}>
                <Icon size={15} style={{ color: it.color }} />
              </div>
              <h4 style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a' }}>
                <Text value={it.title} locale={locale} fallback={empty} />
              </h4>
            </div>
            <p style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.6, marginBottom: 9 }}>
              <Text value={it.desc} locale={locale} fallback={empty} />
            </p>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {it.feats.map((f, fi) => (
                <li key={fi} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: '#475569' }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: it.color, flexShrink: 0 }} />
                  <Text value={f} locale={locale} fallback={empty} />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function WhyUsPreview({ data, locale, empty }: { data: WhyUsData; locale: Locale; empty: string }): React.ReactElement {
  return (
    <div style={GRID}>
      {data.items.map((it, i) => {
        const Icon = resolveIcon(it.icon);
        return (
          <div key={i} style={CARD}>
            {/* Saytdagidek chapdagi rang chizig'i */}
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: it.color }} />
            <div style={{
              width: 30, height: 30, borderRadius: 9, marginBottom: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `${it.color}14`, border: `1.5px solid ${it.color}33`,
            }}>
              <Icon size={15} style={{ color: it.color }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
              {it.stat || <Placeholder label="0" />}
            </div>
            <h4 style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a', margin: '6px 0 5px' }}>
              <Text value={it.title} locale={locale} fallback={empty} />
            </h4>
            <p style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.6 }}>
              <Text value={it.desc} locale={locale} fallback={empty} />
            </p>
          </div>
        );
      })}
    </div>
  );
}

function ContactPreview({ data, locale, empty }: { data: ContactData; locale: Locale; empty: string }): React.ReactElement {
  const rows: { icon: typeof Phone; value: string; sub?: React.ReactNode }[] = [
    { icon: Phone, value: data.phone },
    { icon: Send, value: data.telegram },
    { icon: Mail, value: data.email },
    { icon: MapPin, value: data.address, sub: <Text value={data.addressSub} locale={locale} fallback={empty} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(({ icon: Icon, value, sub }, i) => (
          <div key={i} style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 10, padding: 11 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#f0f9ff', border: '1.5px solid #bae6fd',
            }}>
              <Icon size={14} style={{ color: '#0284c7' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a', wordBreak: 'break-word' }}>
                {value || <Placeholder label={empty} />}
              </div>
              {sub && <div style={{ fontSize: 11, color: '#94a3b8' }}>{sub}</div>}
            </div>
          </div>
        ))}
      </div>

      {data.hours.length > 0 && (
        <div style={{ ...CARD, padding: 12 }}>
          {data.hours.map((h, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 11.5,
              padding: '6px 0', borderTop: i === 0 ? 'none' : '1px solid #f1f5f9',
            }}>
              <span style={{ color: '#334155', fontWeight: 600 }}>
                <Text value={h.day} locale={locale} fallback={empty} />
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                color: h.closed ? '#f43f5e' : '#0ea5e9',
                whiteSpace: 'nowrap',
              }}>
                {h.time || <Placeholder label="--:--" />}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Umumiy kirish nuqtasi ────────────────────────────────────────────────────

export default function SectionPreview({ section, data, locale }: SectionPreviewProps): React.ReactElement {
  const { t } = useTranslation();
  const empty = t('admin.siteSettings.previewEmpty');

  switch (section) {
    case 'hero': return <HeroPreview data={data as HeroData} locale={locale} empty={empty} />;
    case 'about': return <AboutPreview data={data as AboutData} locale={locale} empty={empty} />;
    case 'services': return <ServicesPreview data={data as ServicesData} locale={locale} empty={empty} />;
    case 'why_us': return <WhyUsPreview data={data as WhyUsData} locale={locale} empty={empty} />;
    case 'contact': return <ContactPreview data={data as ContactData} locale={locale} empty={empty} />;
  }
}
