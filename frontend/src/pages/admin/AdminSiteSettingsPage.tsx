import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, ArrowDown, ArrowUp, ExternalLink, Inbox, Plus, RotateCcw, Save, Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSiteSettingsAdmin, updateSiteSettingSection } from '../../api/siteSettings';
import { ICON_NAMES, resolveIcon } from '../../utils/iconMap';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import LocalizedField from '../../components/admin/LocalizedField';
import { useConfirm, useToast } from '../../components/common/Feedback';
import { useLocale } from '../../hooks/useLocale';
import { ENABLED_LOCALES } from '../../i18n/config';
import { LocalizedString, emptyLocalizedString } from '../../types/locale';

type SectionKey = 'hero' | 'about' | 'services' | 'why_us' | 'contact';

const SECTION_KEYS: SectionKey[] = ['hero', 'about', 'services', 'why_us', 'contact'];

// Har bo'lim bosh sahifadagi qaysi blokka mos kelishini ko'rsatish uchun —
// "Ko'rish" havolasi shu anchor'ga olib boradi.
const SECTION_ANCHOR: Record<SectionKey, string> = {
  hero: '#home',
  about: '#about',
  services: '#services',
  why_us: '#why-us',
  contact: '#contact',
};

interface StatItem { label: LocalizedString; value: string }
interface AboutStatItem { icon: string; label: LocalizedString; value: string; color: string }
interface SkillItem { label: LocalizedString; pct: number }
interface SatisfactionItem { value: string; label: LocalizedString }
interface ServiceItem { icon: string; title: LocalizedString; color: string; desc: LocalizedString; feats: LocalizedString[] }
interface WhyUsItem { icon: string; title: LocalizedString; color: string; stat: string; desc: LocalizedString }
interface HoursItem { day: LocalizedString; time: string; closed: boolean }

interface HeroData { stats: StatItem[] }
interface AboutData { stats: AboutStatItem[]; features: LocalizedString[]; skills: SkillItem[]; satisfaction: SatisfactionItem[] }
interface ServicesData { items: ServiceItem[] }
interface WhyUsData { items: WhyUsItem[] }
interface ContactData { phone: string; telegram: string; email: string; address: string; addressSub: LocalizedString; hours: HoursItem[] }

interface Sections {
  hero: HeroData;
  about: AboutData;
  services: ServicesData;
  why_us: WhyUsData;
  contact: ContactData;
}

const EMPTY_SECTIONS: Sections = {
  hero: { stats: [] },
  about: { stats: [], features: [], skills: [], satisfaction: [] },
  services: { items: [] },
  why_us: { items: [] },
  contact: { phone: '', telegram: '', email: '', address: '', addressSub: emptyLocalizedString(), hours: [] },
};

const PRESET_COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#0f172a'];

/** Ro'yxatdagi elementni bir pog'ona yuqoriga/pastga suradi. */
function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Tarjimasi bo'sh (uz maydoni to'ldirilmagan) matnlar soni. */
function countEmptyBase(values: (LocalizedString | undefined)[]): number {
  return values.filter((v) => !(v?.uz ?? '').trim()).length;
}

// ── Umumiy kichik bloklar ────────────────────────────────────────────────────

function Field({ label, children, minWidth = 120 }: { label: string; children: React.ReactNode; minWidth?: number }): React.ReactElement {
  return (
    <div style={{ flex: 1, minWidth }}>
      <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

function IconBtn({ onClick, disabled, title, danger, children }: {
  onClick: () => void; disabled?: boolean; title: string; danger?: boolean; children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled} title={title} aria-label={title}
      style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${danger ? '#fecaca' : '#e2e8f0'}`,
        background: '#fff',
        color: disabled ? '#cbd5e1' : danger ? '#dc2626' : '#64748b',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

/** Har bir ro'yxat elementi ustidagi bir xil boshqaruv to'plami: yuqori/past/o'chirish. */
function RowControls({ index, total, onMove, onRemove }: {
  index: number; total: number; onMove: (to: number) => void; onRemove: () => void;
}): React.ReactElement {
  const { t } = useTranslation();
  return (
    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
      <IconBtn title={t('admin.siteSettings.moveUp')} disabled={index === 0} onClick={() => onMove(index - 1)}>
        <ArrowUp size={13} />
      </IconBtn>
      <IconBtn title={t('admin.siteSettings.moveDown')} disabled={index === total - 1} onClick={() => onMove(index + 1)}>
        <ArrowDown size={13} />
      </IconBtn>
      <IconBtn title={t('common.delete')} danger onClick={onRemove}>
        <Trash2 size={13} />
      </IconBtn>
    </div>
  );
}

function RowCard({ index, total, onMove, onRemove, children }: {
  index: number; total: number; onMove: (to: number) => void; onRemove: () => void; children: React.ReactNode;
}): React.ReactElement {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, padding: 14, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 10, flexWrap: 'wrap' }}>
      {children}
      <RowControls index={index} total={total} onMove={onMove} onRemove={onRemove} />
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }): React.ReactElement {
  return (
    <button type="button" onClick={onClick} className="btn-outline" style={{ fontSize: 12.5, padding: '8px 14px' }}>
      <Plus size={14} /> {label}
    </button>
  );
}

function EmptyState({ text }: { text: string }): React.ReactElement {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 14px', borderRadius: 12, border: '1.5px dashed #e2e8f0', background: '#fcfdff', marginBottom: 10 }}>
      <Inbox size={16} style={{ color: '#cbd5e1', flexShrink: 0 }} />
      <p style={{ fontSize: 12.5, color: '#94a3b8' }}>{text}</p>
    </div>
  );
}

/** Bo'lim ichidagi guruh sarlavhasi + element soni. */
function GroupTitle({ title, count }: { title: string; count: number }): React.ReactElement {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{title}</p>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 700, color: '#64748b', background: '#f1f5f9', borderRadius: 20, padding: '2px 8px' }}>
        {count}
      </span>
    </div>
  );
}

/** Ikonka tanlash — nomlar ro'yxati yonida haqiqiy ikonka ko'rinib turadi. */
function IconField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }): React.ReactElement {
  const Icon = resolveIcon(value);
  return (
    <Field label={label} minWidth={168}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f9ff', border: '1.5px solid #bae6fd', color: '#0284c7' }}>
          <Icon size={18} />
        </div>
        <select className="inp" value={value} onChange={(e) => onChange(e.target.value)} style={{ fontSize: 13, padding: '10px 12px' }}>
          {!ICON_NAMES.includes(value) && <option value={value}>{value}</option>}
          {ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
    </Field>
  );
}

/** Rang tanlash — swatch + hex maydon + tez tanlash uchun presetlar. */
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }): React.ReactElement {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#0ea5e9';
  return (
    <Field label={label} minWidth={190}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <input
          type="color" value={safe} onChange={(e) => onChange(e.target.value)} aria-label={label}
          style={{ width: 38, height: 38, padding: 3, borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', cursor: 'pointer', flexShrink: 0 }}
        />
        <input
          className="inp" value={value} onChange={(e) => onChange(e.target.value)} placeholder="#0ea5e9" spellCheck={false}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, padding: '10px 12px', textTransform: 'lowercase' }}
        />
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {PRESET_COLORS.map((c) => (
          <button
            key={c} type="button" onClick={() => onChange(c)} title={c} aria-label={c}
            style={{
              width: 18, height: 18, borderRadius: 6, background: c, cursor: 'pointer',
              border: c.toLowerCase() === value.toLowerCase() ? '2px solid #0f172a' : '1px solid rgba(15,23,42,0.12)',
            }}
          />
        ))}
      </div>
    </Field>
  );
}

// ── Bo'lim formalari ─────────────────────────────────────────────────────────

function HeroForm({ data, onChange }: { data: HeroData; onChange: (d: HeroData) => void }): React.ReactElement {
  const { t } = useTranslation();
  const setStats = (stats: StatItem[]): void => onChange({ ...data, stats });
  const update = (i: number, patch: Partial<StatItem>): void =>
    setStats(data.stats.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  return (
    <div>
      <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 14 }}>{t('admin.siteSettings.heroHint')}</p>
      {data.stats.length === 0 && <EmptyState text={t('admin.siteSettings.emptyList')} />}
      {data.stats.map((s, i) => (
        <RowCard key={i} index={i} total={data.stats.length}
          onMove={(to) => setStats(move(data.stats, i, to))}
          onRemove={() => setStats(data.stats.filter((_, idx) => idx !== i))}>
          <Field label={t('admin.siteSettings.f.value')}>
            <input className="inp" value={s.value} onChange={(e) => update(i, { value: e.target.value })} placeholder="2000+" />
          </Field>
          <div style={{ flex: 2, minWidth: 200 }}>
            <LocalizedField label={t('admin.siteSettings.f.name')} value={s.label} onChange={(next) => update(i, { label: next })} />
          </div>
        </RowCard>
      ))}
      <AddButton label={t('admin.siteSettings.addStat')}
        onClick={() => setStats([...data.stats, { value: '', label: emptyLocalizedString() }])} />
    </div>
  );
}

function AboutForm({ data, onChange }: { data: AboutData; onChange: (d: AboutData) => void }): React.ReactElement {
  const { t } = useTranslation();
  const updateStat = (i: number, patch: Partial<AboutStatItem>): void =>
    onChange({ ...data, stats: data.stats.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });
  const updateSkill = (i: number, patch: Partial<SkillItem>): void =>
    onChange({ ...data, skills: data.skills.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });
  const updateSat = (i: number, patch: Partial<SatisfactionItem>): void =>
    onChange({ ...data, satisfaction: data.satisfaction.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <GroupTitle title={t('admin.siteSettings.aboutStatsCards')} count={data.stats.length} />
        {data.stats.length === 0 && <EmptyState text={t('admin.siteSettings.emptyList')} />}
        {data.stats.map((s, i) => (
          <RowCard key={i} index={i} total={data.stats.length}
            onMove={(to) => onChange({ ...data, stats: move(data.stats, i, to) })}
            onRemove={() => onChange({ ...data, stats: data.stats.filter((_, idx) => idx !== i) })}>
            <IconField label={t('admin.siteSettings.f.icon')} value={s.icon} onChange={(v) => updateStat(i, { icon: v })} />
            <Field label={t('admin.siteSettings.f.value')}>
              <input className="inp" value={s.value} onChange={(e) => updateStat(i, { value: e.target.value })} />
            </Field>
            <div style={{ flex: 2, minWidth: 200 }}>
              <LocalizedField label={t('admin.siteSettings.f.name')} value={s.label} onChange={(next) => updateStat(i, { label: next })} />
            </div>
            <ColorField label={t('admin.siteSettings.f.color')} value={s.color} onChange={(v) => updateStat(i, { color: v })} />
          </RowCard>
        ))}
        <AddButton label={t('admin.siteSettings.addStat')}
          onClick={() => onChange({ ...data, stats: [...data.stats, { icon: 'Users', value: '', label: emptyLocalizedString(), color: '#0ea5e9' }] })} />
      </div>

      <div>
        <GroupTitle title={t('admin.siteSettings.aboutFeatures')} count={data.features.length} />
        {data.features.length === 0 && <EmptyState text={t('admin.siteSettings.emptyList')} />}
        {data.features.map((f, i) => (
          <RowCard key={i} index={i} total={data.features.length}
            onMove={(to) => onChange({ ...data, features: move(data.features, i, to) })}
            onRemove={() => onChange({ ...data, features: data.features.filter((_, idx) => idx !== i) })}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <LocalizedField label={t('admin.siteSettings.f.text')} value={f}
                onChange={(next) => onChange({ ...data, features: data.features.map((x, idx) => (idx === i ? next : x)) })} />
            </div>
          </RowCard>
        ))}
        <AddButton label={t('admin.siteSettings.addFeature')}
          onClick={() => onChange({ ...data, features: [...data.features, emptyLocalizedString()] })} />
      </div>

      <div>
        <GroupTitle title={t('admin.siteSettings.aboutSkills')} count={data.skills.length} />
        {data.skills.length === 0 && <EmptyState text={t('admin.siteSettings.emptyList')} />}
        {data.skills.map((s, i) => (
          <RowCard key={i} index={i} total={data.skills.length}
            onMove={(to) => onChange({ ...data, skills: move(data.skills, i, to) })}
            onRemove={() => onChange({ ...data, skills: data.skills.filter((_, idx) => idx !== i) })}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <LocalizedField label={t('admin.siteSettings.f.name')} value={s.label} onChange={(next) => updateSkill(i, { label: next })} />
            </div>
            <Field label={t('admin.siteSettings.f.pct')} minWidth={90}>
              <input className="inp" type="number" min={0} max={100} value={s.pct}
                // Progress bar 0–100 oralig'ida chiziladi — chegaradan tashqari
                // qiymat saytda buzuq ko'rinadi, shuning uchun shu yerda qisiladi.
                onChange={(e) => updateSkill(i, { pct: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })} />
            </Field>
            <div style={{ flex: 1, minWidth: 120, paddingBottom: 10 }}>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, s.pct))}%` }} /></div>
            </div>
          </RowCard>
        ))}
        <AddButton label={t('admin.siteSettings.addSkill')}
          onClick={() => onChange({ ...data, skills: [...data.skills, { label: emptyLocalizedString(), pct: 50 }] })} />
      </div>

      <div>
        <GroupTitle title={t('admin.siteSettings.aboutSatisfaction')} count={data.satisfaction.length} />
        {data.satisfaction.length === 0 && <EmptyState text={t('admin.siteSettings.emptyList')} />}
        {data.satisfaction.map((s, i) => (
          <RowCard key={i} index={i} total={data.satisfaction.length}
            onMove={(to) => onChange({ ...data, satisfaction: move(data.satisfaction, i, to) })}
            onRemove={() => onChange({ ...data, satisfaction: data.satisfaction.filter((_, idx) => idx !== i) })}>
            <Field label={t('admin.siteSettings.f.value')}>
              <input className="inp" value={s.value} onChange={(e) => updateSat(i, { value: e.target.value })} />
            </Field>
            <div style={{ flex: 2, minWidth: 200 }}>
              <LocalizedField label={t('admin.siteSettings.f.name')} value={s.label} onChange={(next) => updateSat(i, { label: next })} />
            </div>
          </RowCard>
        ))}
        <AddButton label={t('admin.siteSettings.addIndicator')}
          onClick={() => onChange({ ...data, satisfaction: [...data.satisfaction, { value: '', label: emptyLocalizedString() }] })} />
      </div>
    </div>
  );
}

function ServicesForm({ data, onChange }: { data: ServicesData; onChange: (d: ServicesData) => void }): React.ReactElement {
  const { t } = useTranslation();
  const update = (i: number, patch: Partial<ServiceItem>): void =>
    onChange({ ...data, items: data.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });

  return (
    <div>
      {data.items.length === 0 && <EmptyState text={t('admin.siteSettings.emptyList')} />}
      {data.items.map((it, i) => (
        <div key={i} style={{ padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10, alignItems: 'flex-end' }}>
            <IconField label={t('admin.siteSettings.f.icon')} value={it.icon} onChange={(v) => update(i, { icon: v })} />
            <div style={{ flex: 2, minWidth: 200 }}>
              <LocalizedField label={t('admin.siteSettings.f.title')} value={it.title} onChange={(next) => update(i, { title: next })} />
            </div>
            <ColorField label={t('admin.siteSettings.f.color')} value={it.color} onChange={(v) => update(i, { color: v })} />
            <RowControls index={i} total={data.items.length}
              onMove={(to) => onChange({ ...data, items: move(data.items, i, to) })}
              onRemove={() => onChange({ ...data, items: data.items.filter((_, idx) => idx !== i) })} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <LocalizedField label={t('admin.siteSettings.f.desc')} multiline rows={2} value={it.desc} onChange={(next) => update(i, { desc: next })} />
          </div>
          <GroupTitle title={t('admin.siteSettings.servicesFeatures')} count={it.feats.length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {it.feats.map((f, fi) => (
              <div key={fi} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <LocalizedField label="" value={f}
                    onChange={(next) => update(i, { feats: it.feats.map((x, idx) => (idx === fi ? next : x)) })} />
                </div>
                <RowControls index={fi} total={it.feats.length}
                  onMove={(to) => update(i, { feats: move(it.feats, fi, to) })}
                  onRemove={() => update(i, { feats: it.feats.filter((_, idx) => idx !== fi) })} />
              </div>
            ))}
            <button type="button" onClick={() => update(i, { feats: [...it.feats, emptyLocalizedString()] })}
              className="btn-outline" style={{ fontSize: 12, padding: '6px 12px', alignSelf: 'flex-start' }}>
              <Plus size={12} /> {t('admin.siteSettings.addFeat')}
            </button>
          </div>
        </div>
      ))}
      <AddButton label={t('admin.siteSettings.addService')}
        onClick={() => onChange({ ...data, items: [...data.items, { icon: 'Globe', title: emptyLocalizedString(), color: '#0ea5e9', desc: emptyLocalizedString(), feats: [] }] })} />
    </div>
  );
}

function WhyUsForm({ data, onChange }: { data: WhyUsData; onChange: (d: WhyUsData) => void }): React.ReactElement {
  const { t } = useTranslation();
  const update = (i: number, patch: Partial<WhyUsItem>): void =>
    onChange({ ...data, items: data.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });

  return (
    <div>
      {data.items.length === 0 && <EmptyState text={t('admin.siteSettings.emptyList')} />}
      {data.items.map((it, i) => (
        <div key={i} style={{ padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10, alignItems: 'flex-end' }}>
            <IconField label={t('admin.siteSettings.f.icon')} value={it.icon} onChange={(v) => update(i, { icon: v })} />
            <div style={{ flex: 2, minWidth: 200 }}>
              <LocalizedField label={t('admin.siteSettings.f.title')} value={it.title} onChange={(next) => update(i, { title: next })} />
            </div>
            <Field label={t('admin.siteSettings.whyStat')} minWidth={90}>
              <input className="inp" value={it.stat} onChange={(e) => update(i, { stat: e.target.value })} placeholder="40+" />
            </Field>
            <ColorField label={t('admin.siteSettings.f.color')} value={it.color} onChange={(v) => update(i, { color: v })} />
            <RowControls index={i} total={data.items.length}
              onMove={(to) => onChange({ ...data, items: move(data.items, i, to) })}
              onRemove={() => onChange({ ...data, items: data.items.filter((_, idx) => idx !== i) })} />
          </div>
          <LocalizedField label={t('admin.siteSettings.f.desc')} multiline rows={2} value={it.desc} onChange={(next) => update(i, { desc: next })} />
        </div>
      ))}
      <AddButton label={t('admin.siteSettings.addCard')}
        onClick={() => onChange({ ...data, items: [...data.items, { icon: 'Zap', title: emptyLocalizedString(), color: '#0ea5e9', stat: '', desc: emptyLocalizedString() }] })} />
    </div>
  );
}

function ContactForm({ data, onChange }: { data: ContactData; onChange: (d: ContactData) => void }): React.ReactElement {
  const { t } = useTranslation();
  const updateHour = (i: number, patch: Partial<HoursItem>): void =>
    onChange({ ...data, hours: data.hours.map((h, idx) => (idx === i ? { ...h, ...patch } : h)) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* auto-fit — tor ekranda ustunlar avtomatik bitta qatorga tushadi */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <Field label={t('admin.siteSettings.phone')}>
          <input className="inp" type="tel" inputMode="tel" value={data.phone} onChange={(e) => onChange({ ...data, phone: e.target.value })} placeholder="+998 90 123 45 67" />
        </Field>
        <Field label={t('admin.siteSettings.telegram')}>
          <input className="inp" value={data.telegram} onChange={(e) => onChange({ ...data, telegram: e.target.value })} placeholder="@datalife" />
        </Field>
        <Field label={t('admin.siteSettings.email')}>
          <input className="inp" type="email" inputMode="email" spellCheck={false} value={data.email} onChange={(e) => onChange({ ...data, email: e.target.value })} placeholder="info@datalife.uz" />
        </Field>
        <Field label={t('admin.siteSettings.address')}>
          <input className="inp" value={data.address} onChange={(e) => onChange({ ...data, address: e.target.value })} />
        </Field>
        <div style={{ gridColumn: '1 / -1' }}>
          <LocalizedField label={t('admin.siteSettings.addressSub')} value={data.addressSub} onChange={(next) => onChange({ ...data, addressSub: next })} />
        </div>
      </div>

      <div>
        <GroupTitle title={t('admin.siteSettings.hoursTitle')} count={data.hours.length} />
        {data.hours.length === 0 && <EmptyState text={t('admin.siteSettings.emptyList')} />}
        {data.hours.map((h, i) => (
          <RowCard key={i} index={i} total={data.hours.length}
            onMove={(to) => onChange({ ...data, hours: move(data.hours, i, to) })}
            onRemove={() => onChange({ ...data, hours: data.hours.filter((_, idx) => idx !== i) })}>
            <div style={{ flex: 2, minWidth: 200 }}>
              <LocalizedField label={t('admin.siteSettings.day')} value={h.day} onChange={(next) => updateHour(i, { day: next })} />
            </div>
            <Field label={t('admin.siteSettings.time')}>
              <input className="inp" value={h.time} disabled={h.closed} placeholder="09:00 — 18:00"
                onChange={(e) => updateHour(i, { time: e.target.value })}
                style={{ opacity: h.closed ? 0.5 : 1 }} />
            </Field>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#334155', paddingBottom: 11, cursor: 'pointer', flexShrink: 0 }}>
              <input type="checkbox" checked={h.closed} onChange={(e) => updateHour(i, { closed: e.target.checked })} />
              {t('admin.siteSettings.closed')}
            </label>
          </RowCard>
        ))}
        <AddButton label={t('admin.siteSettings.addDay')}
          onClick={() => onChange({ ...data, hours: [...data.hours, { day: emptyLocalizedString(), time: '', closed: false }] })} />
      </div>
    </div>
  );
}

// ── Sahifa ───────────────────────────────────────────────────────────────────

/** Bo'limdagi barcha ko'p tilli matnlarni tekis ro'yxatga yig'adi. */
function collectLocalized(key: SectionKey, s: Sections): (LocalizedString | undefined)[] {
  switch (key) {
    case 'hero': return s.hero.stats.map((x) => x.label);
    case 'about': return [
      ...s.about.stats.map((x) => x.label),
      ...s.about.features,
      ...s.about.skills.map((x) => x.label),
      ...s.about.satisfaction.map((x) => x.label),
    ];
    case 'services': return s.services.items.flatMap((x) => [x.title, x.desc, ...x.feats]);
    case 'why_us': return s.why_us.items.flatMap((x) => [x.title, x.desc]);
    case 'contact': return [s.contact.addressSub, ...s.contact.hours.map((x) => x.day)];
  }
}

export default function AdminSiteSettingsPage(): React.ReactElement {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();
  const { basename } = useLocale();

  const [tab, setTab] = useState<SectionKey>('hero');
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [sections, setSections] = useState<Sections>(EMPTY_SECTIONS);
  // Oxirgi muvaffaqiyatli saqlangan holat — "o'zgargan bo'limlar" shu bilan
  // solishtirib aniqlanadi, shuning uchun saqlash faqat kerakli PATCH'ni yuboradi.
  const [baseline, setBaseline] = useState<Sections>(EMPTY_SECTIONS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSiteSettingsAdmin()
      .then((data) => {
        const next: Sections = {
          hero: data.hero ?? EMPTY_SECTIONS.hero,
          about: data.about ?? EMPTY_SECTIONS.about,
          services: data.services ?? EMPTY_SECTIONS.services,
          why_us: data.why_us ?? EMPTY_SECTIONS.why_us,
          contact: { ...EMPTY_SECTIONS.contact, ...(data.contact ?? {}) },
        };
        setSections(next);
        setBaseline(next);
      })
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : t('common.loadFailed')))
      .finally(() => setLoaded(true));
  }, [t]);

  const dirty = useMemo<SectionKey[]>(
    () => SECTION_KEYS.filter((k) => JSON.stringify(sections[k]) !== JSON.stringify(baseline[k])),
    [sections, baseline],
  );

  // Saqlanmagan o'zgarishlar bilan sahifadan chiqishga urinilsa brauzer ogohlantiradi.
  useEffect(() => {
    if (dirty.length === 0) return;
    const onBeforeUnload = (e: BeforeUnloadEvent): void => { e.preventDefault(); };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty.length]);

  const missingByTab = useMemo(() => {
    const out = {} as Record<SectionKey, number>;
    for (const k of SECTION_KEYS) out[k] = countEmptyBase(collectLocalized(k, sections));
    return out;
  }, [sections]);

  const save = async (): Promise<void> => {
    if (dirty.length === 0) return;

    // Bo'sh asosiy (uz) matn saytda bo'sh joy bo'lib ko'rinadi — bu odatda
    // unutilgan maydon, shuning uchun saqlashdan oldin tasdiq so'raladi.
    const missing = dirty.reduce((sum, k) => sum + missingByTab[k], 0);
    if (missing > 0 && !(await confirm(t('admin.siteSettings.missingWarn', { n: missing })))) return;

    setSaving(true);
    const failed: SectionKey[] = [];
    for (const key of dirty) {
      try {
        await updateSiteSettingSection(key, sections[key]);
      } catch (err: unknown) {
        failed.push(key);
        toast.error(`${t(`admin.siteSettings.tabs.${key}`)}: ${err instanceof Error ? err.message : t('common.error')}`);
      }
    }
    // Faqat muvaffaqiyatli bo'limlar "toza" deb belgilanadi — xato bo'lganlari
    // o'zgargan holicha qoladi va qayta saqlashga urinish mumkin.
    setBaseline({
      hero: failed.includes('hero') ? baseline.hero : sections.hero,
      about: failed.includes('about') ? baseline.about : sections.about,
      services: failed.includes('services') ? baseline.services : sections.services,
      why_us: failed.includes('why_us') ? baseline.why_us : sections.why_us,
      contact: failed.includes('contact') ? baseline.contact : sections.contact,
    });
    setSaving(false);
    if (failed.length === 0) toast.success(t('admin.siteSettings.savedCount', { n: dirty.length }));
  };

  const reset = async (): Promise<void> => {
    if (dirty.length === 0) return;
    if (!(await confirm(t('admin.siteSettings.resetConfirm'), { danger: true, confirmLabel: t('admin.siteSettings.reset') }))) return;
    setSections(baseline);
  };

  // basename bo'sh satr yoki '/ru' ko'rinishida — ikkalasida ham to'g'ri manzil chiqadi
  const previewHref = `${basename}/${SECTION_ANCHOR[tab]}`;

  return (
    <div>
      <AdminPageHeader
        title={t('admin.siteSettings.title')}
        sub={t('admin.siteSettings.sub')}
        actions={
          <a href={previewHref} target="_blank" rel="noopener noreferrer" className="btn-outline"
            style={{ fontSize: 12.5, padding: '8px 14px', textDecoration: 'none' }}>
            <ExternalLink size={14} /> {t('admin.siteSettings.preview')}
          </a>
        }
      />

      {ENABLED_LOCALES.length > 1 && (
        <p style={{ fontSize: 12.5, color: '#64748b', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '10px 14px', marginBottom: 16 }}>
          {t('admin.siteSettings.localeHint')}
        </p>
      )}

      <div role="tablist" aria-label={t('admin.siteSettings.title')} style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {SECTION_KEYS.map((key) => {
          const active = tab === key;
          return (
            <button key={key} role="tab" aria-selected={active} onClick={() => setTab(key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '8px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                border: active ? '1.5px solid #0ea5e9' : '1.5px solid #e2e8f0',
                background: active ? '#f0f9ff' : '#fff',
                color: active ? '#0ea5e9' : '#64748b',
              }}>
              {t(`admin.siteSettings.tabs.${key}`)}
              {dirty.includes(key) && (
                <span title={t('admin.siteSettings.unsaved')} aria-label={t('admin.siteSettings.unsaved')}
                  style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
              )}
            </button>
          );
        })}
      </div>

      {!loaded && <p style={{ color: '#94a3b8', fontSize: 14 }}>{t('common.loading')}</p>}

      {loaded && loadError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: '#fef2f2', border: '1.5px solid #fecaca' }}>
          <AlertCircle size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
          <p style={{ fontSize: 13, color: '#dc2626' }}>{loadError}</p>
        </div>
      )}

      {loaded && !loadError && (
        <>
          <div className="card" style={{ padding: 24 }}>
            {tab === 'hero' && <HeroForm data={sections.hero} onChange={(d) => setSections((p) => ({ ...p, hero: d }))} />}
            {tab === 'about' && <AboutForm data={sections.about} onChange={(d) => setSections((p) => ({ ...p, about: d }))} />}
            {tab === 'services' && <ServicesForm data={sections.services} onChange={(d) => setSections((p) => ({ ...p, services: d }))} />}
            {tab === 'why_us' && <WhyUsForm data={sections.why_us} onChange={(d) => setSections((p) => ({ ...p, why_us: d }))} />}
            {tab === 'contact' && <ContactForm data={sections.contact} onChange={(d) => setSections((p) => ({ ...p, contact: d }))} />}
          </div>

          {/* Formalar uzun — saqlash paneli doim ko'rinib turadi */}
          <div style={{
            position: 'sticky', bottom: 0, zIndex: 20, marginTop: 16,
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            padding: '12px 16px', borderRadius: 14,
            background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
            border: `1.5px solid ${dirty.length ? '#fde68a' : '#e2e8f0'}`,
            boxShadow: '0 -4px 20px rgba(15,23,42,0.06)',
          }}>
            <p style={{ flex: 1, minWidth: 180, fontSize: 12.5, fontWeight: 600, color: dirty.length ? '#b45309' : '#94a3b8' }}>
              {dirty.length
                ? t('admin.siteSettings.dirtyCount', { n: dirty.length })
                : t('admin.siteSettings.allSaved')}
            </p>
            {dirty.length > 0 && (
              <button type="button" onClick={reset} className="btn-outline" style={{ fontSize: 12.5, padding: '8px 14px' }}>
                <RotateCcw size={14} /> {t('admin.siteSettings.reset')}
              </button>
            )}
            <button type="button" onClick={save} disabled={saving || dirty.length === 0} className="btn-primary"
              style={{ fontSize: 13.5, padding: '10px 22px', opacity: saving || dirty.length === 0 ? 0.55 : 1, cursor: saving || dirty.length === 0 ? 'not-allowed' : 'pointer' }}>
              <Save size={15} /> {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
