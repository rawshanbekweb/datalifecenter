import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getSiteSettingsAdmin, updateSiteSettingSection } from '../../api/siteSettings';
import { ICON_NAMES } from '../../utils/iconMap';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import LocalizedField from '../../components/admin/LocalizedField';
import { LocalizedString, emptyLocalizedString } from '../../types/locale';

type SectionKey = 'hero' | 'about' | 'services' | 'why_us' | 'contact';

const TABS: { key: SectionKey; labelKey: string }[] = [
  { key: 'hero', labelKey: 'admin.siteSettings.tabs.hero' },
  { key: 'about', labelKey: 'admin.siteSettings.tabs.about' },
  { key: 'services', labelKey: 'admin.siteSettings.tabs.services' },
  { key: 'why_us', labelKey: 'admin.siteSettings.tabs.why_us' },
  { key: 'contact', labelKey: 'admin.siteSettings.tabs.contact' },
];

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

const EMPTY_HERO: HeroData = { stats: [] };
const EMPTY_ABOUT: AboutData = { stats: [], features: [], skills: [], satisfaction: [] };
const EMPTY_SERVICES: ServicesData = { items: [] };
const EMPTY_WHY_US: WhyUsData = { items: [] };
const EMPTY_CONTACT: ContactData = { phone: '', telegram: '', email: '', address: '', addressSub: emptyLocalizedString(), hours: [] };

function Field({ label, children }: { label: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div style={{ flex: 1, minWidth: 120 }}>
      <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

function RowCard({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }): React.ReactElement {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, padding: 14, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 10, flexWrap: 'wrap' }}>
      {children}
      <button type="button" onClick={onRemove}
        style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #fecaca', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', flexShrink: 0 }}>
        <Trash2 size={14} />
      </button>
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

function IconSelect({ value, onChange }: { value: string; onChange: (v: string) => void }): React.ReactElement {
  return (
    <select className="inp" value={value} onChange={(e) => onChange(e.target.value)} style={{ fontSize: 13 }}>
      {ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
    </select>
  );
}

// ---- Hero ----
function HeroForm({ data, onChange }: { data: HeroData; onChange: (d: HeroData) => void }): React.ReactElement {
  const { t } = useTranslation();
  const update = (i: number, patch: Partial<StatItem>) => {
    const stats = data.stats.map((s, idx) => (idx === i ? { ...s, ...patch } : s));
    onChange({ ...data, stats });
  };
  return (
    <div>
      <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 14 }}>{t('admin.siteSettings.heroHint')}</p>
      {data.stats.map((s, i) => (
        <RowCard key={i} onRemove={() => onChange({ ...data, stats: data.stats.filter((_, idx) => idx !== i) })}>
          <Field label={t('admin.siteSettings.f.value')}><input className="inp" value={s.value} onChange={(e) => update(i, { value: e.target.value })} /></Field>
          <div style={{ flex: 1, minWidth: 160 }}>
            <LocalizedField label={t('admin.siteSettings.f.name')} value={s.label} onChange={(next) => update(i, { label: next })} />
          </div>
        </RowCard>
      ))}
      <AddButton label={t('admin.siteSettings.addStat')} onClick={() => onChange({ ...data, stats: [...data.stats, { value: '', label: emptyLocalizedString() }] })} />
    </div>
  );
}

// ---- About ----
function AboutForm({ data, onChange }: { data: AboutData; onChange: (d: AboutData) => void }): React.ReactElement {
  const { t } = useTranslation();
  const updateStat = (i: number, patch: Partial<AboutStatItem>) =>
    onChange({ ...data, stats: data.stats.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });
  const updateSkill = (i: number, patch: Partial<SkillItem>) =>
    onChange({ ...data, skills: data.skills.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });
  const updateSat = (i: number, patch: Partial<SatisfactionItem>) =>
    onChange({ ...data, satisfaction: data.satisfaction.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });
  const updateFeature = (i: number, val: LocalizedString) =>
    onChange({ ...data, features: data.features.map((f, idx) => (idx === i ? val : f)) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{t('admin.siteSettings.aboutStatsCards')}</p>
        {data.stats.map((s, i) => (
          <RowCard key={i} onRemove={() => onChange({ ...data, stats: data.stats.filter((_, idx) => idx !== i) })}>
            <Field label={t('admin.siteSettings.f.icon')}><IconSelect value={s.icon} onChange={(v) => updateStat(i, { icon: v })} /></Field>
            <Field label={t('admin.siteSettings.f.value')}><input className="inp" value={s.value} onChange={(e) => updateStat(i, { value: e.target.value })} /></Field>
            <div style={{ flex: 1, minWidth: 160 }}>
              <LocalizedField label={t('admin.siteSettings.f.name')} value={s.label} onChange={(next) => updateStat(i, { label: next })} />
            </div>
            <Field label={t('admin.siteSettings.f.color')}><input className="inp" type="color" value={s.color} onChange={(e) => updateStat(i, { color: e.target.value })} style={{ padding: 3, height: 38 }} /></Field>
          </RowCard>
        ))}
        <AddButton label={t('admin.siteSettings.addStat')} onClick={() => onChange({ ...data, stats: [...data.stats, { icon: 'Users', value: '', label: emptyLocalizedString(), color: '#0ea5e9' }] })} />
      </div>

      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{t('admin.siteSettings.aboutFeatures')}</p>
        {data.features.map((f, i) => (
          <RowCard key={i} onRemove={() => onChange({ ...data, features: data.features.filter((_, idx) => idx !== i) })}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <LocalizedField label={t('admin.siteSettings.f.text')} value={f} onChange={(next) => updateFeature(i, next)} />
            </div>
          </RowCard>
        ))}
        <AddButton label={t('admin.siteSettings.addFeature')} onClick={() => onChange({ ...data, features: [...data.features, emptyLocalizedString()] })} />
      </div>

      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{t('admin.siteSettings.aboutSkills')}</p>
        {data.skills.map((s, i) => (
          <RowCard key={i} onRemove={() => onChange({ ...data, skills: data.skills.filter((_, idx) => idx !== i) })}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <LocalizedField label={t('admin.siteSettings.f.name')} value={s.label} onChange={(next) => updateSkill(i, { label: next })} />
            </div>
            <Field label={t('admin.siteSettings.f.pct')}><input className="inp" type="number" min={0} max={100} value={s.pct} onChange={(e) => updateSkill(i, { pct: Number(e.target.value) })} /></Field>
          </RowCard>
        ))}
        <AddButton label={t('admin.siteSettings.addSkill')} onClick={() => onChange({ ...data, skills: [...data.skills, { label: emptyLocalizedString(), pct: 50 }] })} />
      </div>

      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{t('admin.siteSettings.aboutSatisfaction')}</p>
        {data.satisfaction.map((s, i) => (
          <RowCard key={i} onRemove={() => onChange({ ...data, satisfaction: data.satisfaction.filter((_, idx) => idx !== i) })}>
            <Field label={t('admin.siteSettings.f.value')}><input className="inp" value={s.value} onChange={(e) => updateSat(i, { value: e.target.value })} /></Field>
            <div style={{ flex: 1, minWidth: 160 }}>
              <LocalizedField label={t('admin.siteSettings.f.name')} value={s.label} onChange={(next) => updateSat(i, { label: next })} />
            </div>
          </RowCard>
        ))}
        <AddButton label={t('admin.siteSettings.addIndicator')} onClick={() => onChange({ ...data, satisfaction: [...data.satisfaction, { value: '', label: emptyLocalizedString() }] })} />
      </div>
    </div>
  );
}

// ---- Services / Why Us (bir xil shakldagi kartalar) ----
function ServicesForm({ data, onChange }: { data: ServicesData; onChange: (d: ServicesData) => void }): React.ReactElement {
  const { t } = useTranslation();
  const update = (i: number, patch: Partial<ServiceItem>) =>
    onChange({ ...data, items: data.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });
  const updateFeat = (i: number, fi: number, val: LocalizedString) =>
    update(i, { feats: data.items[i].feats.map((f, idx) => (idx === fi ? val : f)) });

  return (
    <div>
      {data.items.map((it, i) => (
        <div key={i} style={{ padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10, alignItems: 'flex-end' }}>
            <Field label={t('admin.siteSettings.f.icon')}><IconSelect value={it.icon} onChange={(v) => update(i, { icon: v })} /></Field>
            <div style={{ flex: 1, minWidth: 160 }}>
              <LocalizedField label={t('admin.siteSettings.f.title')} value={it.title} onChange={(next) => update(i, { title: next })} />
            </div>
            <Field label={t('admin.siteSettings.f.color')}><input className="inp" type="color" value={it.color} onChange={(e) => update(i, { color: e.target.value })} style={{ padding: 3, height: 38 }} /></Field>
            <button type="button" onClick={() => onChange({ ...data, items: data.items.filter((_, idx) => idx !== i) })}
              style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #fecaca', background: '#fff', cursor: 'pointer', color: '#dc2626', flexShrink: 0 }}>
              <Trash2 size={14} />
            </button>
          </div>
          <div style={{ marginBottom: 10 }}>
            <LocalizedField label={t('admin.siteSettings.f.desc')} multiline rows={2} value={it.desc} onChange={(next) => update(i, { desc: next })} />
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>{t('admin.siteSettings.servicesFeatures')}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {it.feats.map((f, fi) => (
              <div key={fi} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <LocalizedField label="" value={f} onChange={(next) => updateFeat(i, fi, next)} />
                </div>
                <button type="button" onClick={() => update(i, { feats: it.feats.filter((_, idx) => idx !== fi) })}
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #fecaca', background: '#fff', cursor: 'pointer', color: '#dc2626', flexShrink: 0 }}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => update(i, { feats: [...it.feats, emptyLocalizedString()] })}
              className="btn-outline" style={{ fontSize: 12, padding: '6px 12px', alignSelf: 'flex-start' }}>
              <Plus size={12} /> {t('admin.siteSettings.addFeat')}
            </button>
          </div>
        </div>
      ))}
      <AddButton label={t('admin.siteSettings.addService')} onClick={() => onChange({ ...data, items: [...data.items, { icon: 'Globe', title: emptyLocalizedString(), color: '#0ea5e9', desc: emptyLocalizedString(), feats: [] }] })} />
    </div>
  );
}

function WhyUsForm({ data, onChange }: { data: WhyUsData; onChange: (d: WhyUsData) => void }): React.ReactElement {
  const { t } = useTranslation();
  const update = (i: number, patch: Partial<WhyUsItem>) =>
    onChange({ ...data, items: data.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });
  return (
    <div>
      {data.items.map((it, i) => (
        <div key={i} style={{ padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10, alignItems: 'flex-end' }}>
            <Field label={t('admin.siteSettings.f.icon')}><IconSelect value={it.icon} onChange={(v) => update(i, { icon: v })} /></Field>
            <div style={{ flex: 1, minWidth: 160 }}>
              <LocalizedField label={t('admin.siteSettings.f.title')} value={it.title} onChange={(next) => update(i, { title: next })} />
            </div>
            <Field label={t('admin.siteSettings.whyStat')}><input className="inp" value={it.stat} onChange={(e) => update(i, { stat: e.target.value })} placeholder="40+" /></Field>
            <Field label={t('admin.siteSettings.f.color')}><input className="inp" type="color" value={it.color} onChange={(e) => update(i, { color: e.target.value })} style={{ padding: 3, height: 38 }} /></Field>
            <button type="button" onClick={() => onChange({ ...data, items: data.items.filter((_, idx) => idx !== i) })}
              style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid #fecaca', background: '#fff', cursor: 'pointer', color: '#dc2626', flexShrink: 0 }}>
              <Trash2 size={14} />
            </button>
          </div>
          <LocalizedField label={t('admin.siteSettings.f.desc')} multiline rows={2} value={it.desc} onChange={(next) => update(i, { desc: next })} />
        </div>
      ))}
      <AddButton label={t('admin.siteSettings.addCard')} onClick={() => onChange({ ...data, items: [...data.items, { icon: 'Zap', title: emptyLocalizedString(), color: '#0ea5e9', stat: '', desc: emptyLocalizedString() }] })} />
    </div>
  );
}

// ---- Contact ----
function ContactForm({ data, onChange }: { data: ContactData; onChange: (d: ContactData) => void }): React.ReactElement {
  const { t } = useTranslation();
  const updateHour = (i: number, patch: Partial<HoursItem>) =>
    onChange({ ...data, hours: data.hours.map((h, idx) => (idx === i ? { ...h, ...patch } : h)) });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label={t('admin.siteSettings.phone')}><input className="inp" value={data.phone} onChange={(e) => onChange({ ...data, phone: e.target.value })} /></Field>
        <Field label={t('admin.siteSettings.telegram')}><input className="inp" value={data.telegram} onChange={(e) => onChange({ ...data, telegram: e.target.value })} /></Field>
        <Field label={t('admin.siteSettings.email')}><input className="inp" value={data.email} onChange={(e) => onChange({ ...data, email: e.target.value })} /></Field>
        <Field label={t('admin.siteSettings.address')}><input className="inp" value={data.address} onChange={(e) => onChange({ ...data, address: e.target.value })} /></Field>
        <LocalizedField label={t('admin.siteSettings.addressSub')} value={data.addressSub} onChange={(next) => onChange({ ...data, addressSub: next })} />
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>{t('admin.siteSettings.hoursTitle')}</p>
        {data.hours.map((h, i) => (
          <RowCard key={i} onRemove={() => onChange({ ...data, hours: data.hours.filter((_, idx) => idx !== i) })}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <LocalizedField label={t('admin.siteSettings.day')} value={h.day} onChange={(next) => updateHour(i, { day: next })} />
            </div>
            <Field label={t('admin.siteSettings.time')}><input className="inp" value={h.time} onChange={(e) => updateHour(i, { time: e.target.value })} /></Field>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#334155', paddingBottom: 9 }}>
              <input type="checkbox" checked={h.closed} onChange={(e) => updateHour(i, { closed: e.target.checked })} /> {t('admin.siteSettings.closed')}
            </label>
          </RowCard>
        ))}
        <AddButton label={t('admin.siteSettings.addDay')} onClick={() => onChange({ ...data, hours: [...data.hours, { day: emptyLocalizedString(), time: '', closed: false }] })} />
      </div>
    </div>
  );
}

export default function AdminSiteSettingsPage(): React.ReactElement {
  const { t } = useTranslation();
  const [tab, setTab] = useState<SectionKey>('hero');
  const [loaded, setLoaded] = useState<boolean>(false);
  const [hero, setHero] = useState<HeroData>(EMPTY_HERO);
  const [about, setAbout] = useState<AboutData>(EMPTY_ABOUT);
  const [services, setServices] = useState<ServicesData>(EMPTY_SERVICES);
  const [whyUs, setWhyUs] = useState<WhyUsData>(EMPTY_WHY_US);
  const [contact, setContact] = useState<ContactData>(EMPTY_CONTACT);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string>('');

  useEffect(() => {
    getSiteSettingsAdmin().then((data) => {
      if (data.hero) setHero(data.hero);
      if (data.about) setAbout(data.about);
      if (data.services) setServices(data.services);
      if (data.why_us) setWhyUs(data.why_us);
      if (data.contact) setContact(data.contact);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  const save = async (): Promise<void> => {
    setSaveState('saving');
    setSaveError('');
    const payload: Record<SectionKey, unknown> = { hero, about, services, why_us: whyUs, contact };
    try {
      await updateSiteSettingSection(tab, payload[tab]);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (err: any) {
      setSaveError(err.message || t('common.error'));
      setSaveState('error');
    }
  };

  return (
    <div>
      <AdminPageHeader title={t('admin.siteSettings.title')} sub={t('admin.siteSettings.sub')} />

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {TABS.map((tabItem) => (
          <button key={tabItem.key} onClick={() => setTab(tabItem.key)}
            style={{
              padding: '8px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
              border: tab === tabItem.key ? '1.5px solid #0ea5e9' : '1.5px solid #e2e8f0',
              background: tab === tabItem.key ? '#f0f9ff' : '#fff',
              color: tab === tabItem.key ? '#0ea5e9' : '#64748b',
            }}>
            {t(tabItem.labelKey)}
          </button>
        ))}
      </div>

      {!loaded && <p style={{ color: '#94a3b8', fontSize: 14 }}>{t('common.loading')}</p>}

      {loaded && (
        <div className="card" style={{ padding: 24 }}>
          {tab === 'hero' && <HeroForm data={hero} onChange={setHero} />}
          {tab === 'about' && <AboutForm data={about} onChange={setAbout} />}
          {tab === 'services' && <ServicesForm data={services} onChange={setServices} />}
          {tab === 'why_us' && <WhyUsForm data={whyUs} onChange={setWhyUs} />}
          {tab === 'contact' && <ContactForm data={contact} onChange={setContact} />}

          {saveState === 'error' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: '#fef2f2', border: '1.5px solid #fecaca', marginTop: 18 }}>
              <AlertCircle size={15} style={{ color: '#dc2626' }} />
              <p style={{ fontSize: 13, color: '#dc2626' }}>{saveError}</p>
            </div>
          )}

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
            <button onClick={save} disabled={saveState === 'saving'} className="btn-primary" style={{ opacity: saveState === 'saving' ? 0.7 : 1 }}>
              {saveState === 'saved' ? <><CheckCircle size={15} /> {t('admin.siteSettings.saved')}</> : <><Save size={15} /> {saveState === 'saving' ? t('common.saving') : t('common.save')}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
