import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Phone, Send, MapPin, Mail, CheckCircle, Loader, MessageSquare, AlertCircle } from 'lucide-react';
import { sendContactMessage } from '../api/contact';

interface StaticInfoItem {
  icon: React.ElementType;
  label: string;
  color: string;
  bg: string;
  border: string;
  href: (v: string) => string;
}

interface HoursItem {
  day: string;
  time: string;
  closed: boolean;
}

interface ContactSettings {
  phone?: string;
  telegram?: string;
  email?: string;
  address?: string;
  addressSub?: string;
  hours?: HoursItem[];
}

interface ContactProps {
  settings?: ContactSettings;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

type ContactStatus = 'idle' | 'loading' | 'success' | 'error';

const DEFAULT_CONTACT: Required<ContactSettings> = {
  phone: '+998 99 208 11 77',
  telegram: '@datalife_uz',
  email: 'info@datalife.uz',
  address: "Qoraqolpog'iston, Nukus",
  addressSub: "Amir Temur ko'chasi, 108",
  hours: [
    { day: 'Dushanba — Juma', time: '09:00 — 19:00', closed: false },
    { day: 'Shanba', time: '09:00 — 19:00', closed: false },
    { day: 'Yakshanba', time: 'Yopiq', closed: true },
  ],
};

// Ikonka/rang doim bir xil qoladi — faqat qiymat (telefon raqami, email va h.k.) admin orqali o'zgaradi
const INFO_META: StaticInfoItem[] = [
  { icon:Phone,  label:'home.contact.phoneLabel',  color:'#0ea5e9', bg:'#f0f9ff', border:'#bae6fd', href:(v) => `tel:${v.replace(/\s+/g,'')}` },
  { icon:Send,   label:'Telegram', color:'#9333ea', bg:'#faf5ff', border:'#e9d5ff', href:(v) => `https://t.me/${v.replace(/^@/,'')}` },
  { icon:Mail,   label:'Email',    color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0', href:(v) => `mailto:${v}` },
  { icon:MapPin, label:'home.contact.addressLabel',   color:'#d97706', bg:'#fffbeb', border:'#fde68a', href:() => '#' },
];

function MapBox({ query }: { query: string }): React.ReactElement {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  return (
    <div style={{ borderRadius:16, height:190, overflow:'hidden', border:'1.5px solid #e2e8f0', boxShadow:'0 2px 10px rgba(0,0,0,0.04)' }}>
      <iframe title="DATA LIFE manzili" src={src} width="100%" height="100%" style={{ border:0, display:'block' }}
        loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
    </div>
  );
}

export default function Contact({ settings }: ContactProps = {}): React.ReactElement {
  const { t } = useTranslation();
  const info = { ...DEFAULT_CONTACT, ...settings };
  const hours = settings?.hours?.length ? settings.hours : DEFAULT_CONTACT.hours;
  const mapQuery = [info.address, info.addressSub].filter(Boolean).join(', ');
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
  const [form, setForm]         = useState<FormState>({ name:'', email:'', phone:'', subject:'', message:'' });
  const [status, setStatus]     = useState<ContactStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void =>
    setForm((f: FormState) => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault(); setStatus('loading');
    try {
      await sendContactMessage(form);
      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message || "Xabarni yuborib bo'lmadi");
      setStatus('error');
    }
  };

  return (
    <section id="contact" className="section-gray" style={{ padding:'104px 0' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:52 }}>
          <span className="pill">{t('home.contact.pill')}</span>
          <h2 className="h-section" style={{ marginBottom:10 }}>{t('home.contact.titleStart')} <span className="accent">{t('home.contact.titleAccent')}</span></h2>
          <p className="sub">{t('home.contact.subtitle')}</p>
        </motion.div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:40 }} className="contact-grid">

          {/* Form */}
          <motion.div initial={{ opacity:0, x:-24 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}>
            <div className="card" style={{ padding:32, boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
                <div className="icon-box"><MessageSquare size={18} style={{ color:'#0ea5e9' }} /></div>
                <div>
                  <p style={{ fontWeight:800, color:'#0f172a', fontSize:16 }}>{t('home.contact.formTitle')}</p>
                  <p style={{ fontSize:12, color:'#94a3b8' }}>{t('home.contact.formSub')}</p>
                </div>
              </div>

              {status === 'success' ? (
                <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
                  style={{ textAlign:'center', padding:'40px 0' }}>
                  <div style={{ width:60, height:60, borderRadius:'50%', margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0fdf4', border:'2px solid #86efac' }}>
                    <CheckCircle size={28} style={{ color:'#16a34a' }} />
                  </div>
                  <h4 style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:6 }}>{t('home.contact.sentTitle')}</h4>
                  <p style={{ color:'#64748b', fontSize:13, marginBottom:24 }}>{t('home.contact.sentSub')}</p>
                  <button className="btn-outline" onClick={() => { setStatus('idle'); setForm({ name:'',email:'',phone:'',subject:'',message:'' }); }}>
                    {t('home.contact.sendAgain')}
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  {status === 'error' && (
                    <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:12, background:'#fef2f2', border:'1.5px solid #fecaca' }}>
                      <AlertCircle size={16} style={{ color:'#dc2626', flexShrink:0 }} />
                      <p style={{ fontSize:13, color:'#dc2626' }}>{errorMsg}</p>
                    </motion.div>
                  )}
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div>
                      <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>{t('home.contact.nameLabel')} *</label>
                      <input className="inp" name="name" value={form.name} onChange={change} required placeholder={t('home.contact.namePlaceholder')}/>
                    </div>
                    <div>
                      <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>{t('home.contact.phoneLabel')}</label>
                      <input className="inp" name="phone" value={form.phone} onChange={change} placeholder="+998 90 ..."/>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Email *</label>
                    <input className="inp" type="email" name="email" value={form.email} onChange={change} required placeholder="you@example.com"/>
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>{t('home.contact.subjectLabel')}</label>
                    <select className="inp" name="subject" value={form.subject} onChange={change} style={{ cursor:'pointer' }}>
                      <option value="">{t('home.contact.subjectSelect')}</option>
                      <option value="course">{t('home.contact.subjectCourse')}</option>
                      <option value="service">{t('home.contact.subjectService')}</option>
                      <option value="project">{t('home.contact.subjectProject')}</option>
                      <option value="other">{t('home.contact.subjectOther')}</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>{t('home.contact.messageLabel')} *</label>
                    <textarea className="inp" name="message" value={form.message} onChange={change} required rows={4} placeholder={t('home.contact.messagePlaceholder')} style={{ resize:'none' }}/>
                  </div>
                  <button type="submit" disabled={status==='loading'} className="btn-primary"
                    style={{ justifyContent:'center', opacity:status==='loading'?0.7:1 }}>
                    {status==='loading' ? <><Loader size={15} style={{ animation:'spin 1s linear infinite' }}/> {t('common.sending')}</> : <><Send size={14}/> {t('home.contact.sendButton')}</>}
                  </button>
                </form>
              )}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity:0, x:24 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}
            style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {([
              { ...INFO_META[0], value: info.phone, sub: t('home.contact.phoneSub') },
              { ...INFO_META[1], value: info.telegram, sub: t('home.contact.telegramSub') },
              { ...INFO_META[2], value: info.email, sub: t('home.contact.emailSub') },
              { ...INFO_META[3], value: info.address, sub: info.addressSub, href: () => mapsUrl },
            ]).map((inf) => {
              const Icon = inf.icon;
              const href = inf.href(inf.value);
              return (
                <motion.a key={inf.label} href={href} target={href.startsWith('http')?'_blank':undefined} rel="noopener noreferrer"
                  whileHover={{ x:5 }} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', borderRadius:16, textDecoration:'none', background:inf.bg, border:`1.5px solid ${inf.border}`, transition:'all 0.25s', boxShadow:'0 2px 10px rgba(0,0,0,0.04)' }}>
                  <div style={{ width:42, height:42, flexShrink:0, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', border:`1.5px solid ${inf.border}`, boxShadow:'0 2px 6px rgba(0,0,0,0.06)' }}>
                    <Icon size={18} style={{ color:inf.color }}/>
                  </div>
                  <div>
                    <p style={{ fontSize:10, color:'#94a3b8', marginBottom:1, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{inf.label.includes('.') ? t(inf.label) : inf.label}</p>
                    <p style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>{inf.value}</p>
                    <p style={{ fontSize:11, color:'#94a3b8' }}>{inf.sub}</p>
                  </div>
                </motion.a>
              );
            })}
            <MapBox query={mapQuery} />
            <div className="card" style={{ padding:'16px 18px', boxShadow:'0 2px 10px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize:13, fontWeight:800, color:'#0f172a', marginBottom:12 }}>⏰ {t('home.contact.hoursTitle')}</p>
              {hours.map((h: HoursItem) => (
                <div key={h.day} style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:13, color:'#64748b' }}>{h.day}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:h.closed?'#cbd5e1':'#0ea5e9', fontFamily:'JetBrains Mono,monospace' }}>{h.time}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @media(max-width:860px){.contact-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}
