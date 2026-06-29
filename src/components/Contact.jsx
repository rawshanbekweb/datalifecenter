import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Send, MapPin, Mail, CheckCircle, Loader, MessageSquare } from 'lucide-react';

const INFO = [
  { icon:Phone,  label:'Telefon',  value:'+998 99 208 11 77', sub:'Du-Sha, 09:00–19:00',     color:'#0ea5e9', bg:'#f0f9ff', border:'#bae6fd', href:'tel:+998992081177' },
  { icon:Send,   label:'Telegram', value:'@datalife_uz',       sub:'Tezkor javob',             color:'#9333ea', bg:'#faf5ff', border:'#e9d5ff', href:'https://t.me/datalife_uz' },
  { icon:Mail,   label:'Email',    value:'info@datalife.uz',   sub:'24 soat ichida javob',     color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0', href:'mailto:info@datalife.uz' },
  { icon:MapPin, label:'Manzil',   value:'Toshkent, Yunusobod',sub:"Amir Temur ko'chasi, 108", color:'#d97706', bg:'#fffbeb', border:'#fde68a', href:'#' },
];

function MapBox() {
  return (
    <div style={{ borderRadius:16, height:190, position:'relative', overflow:'hidden', background:'#f8fafc', border:'1.5px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.3 }}>
        {Array.from({length:7}).map((_,i) => <line key={`h${i}`} x1="0" y1={`${(i+1)*12.5}%`} x2="100%" y2={`${(i+1)*12.5}%`} stroke="#0ea5e9" strokeWidth="0.7" strokeDasharray="6,12"/>)}
        {Array.from({length:9}).map((_,i) => <line key={`v${i}`} x1={`${(i+1)*10}%`} y1="0" x2={`${(i+1)*10}%`} y2="100%" stroke="#0ea5e9" strokeWidth="0.7" strokeDasharray="6,12"/>)}
      </svg>
      <motion.div animate={{ y:[-5,0,-5] }} transition={{ duration:2, repeat:Infinity, ease:'easeInOut' }}
        style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, zIndex:1 }}>
        <div style={{ width:44, height:44, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'#0ea5e9', boxShadow:'0 4px 16px rgba(14,165,233,0.35)' }}>
          <MapPin size={20} style={{ color:'#fff' }} />
        </div>
        <div style={{ background:'#fff', padding:'4px 14px', borderRadius:20, border:'1px solid #e2e8f0', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
          <span style={{ fontSize:11, color:'#0f172a', fontFamily:'JetBrains Mono,monospace', fontWeight:700 }}>DATA LIFE — Toshkent</span>
        </div>
      </motion.div>
      {[1,2].map(i => (
        <motion.div key={i} style={{ position:'absolute', borderRadius:'50%', border:'1.5px solid rgba(14,165,233,0.35)', width:50+i*36, height:50+i*36 }}
          animate={{ opacity:[0.5,0,0.5], scale:[1,1.2,1] }} transition={{ duration:2.5, delay:i*0.5, repeat:Infinity }} />
      ))}
    </div>
  );
}

export default function Contact() {
  const [form, setForm]     = useState({ name:'', email:'', phone:'', subject:'', message:'' });
  const [status, setStatus] = useState('idle');
  const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async e => {
    e.preventDefault(); setStatus('loading');
    await new Promise(r => setTimeout(r, 1500));
    setStatus('success');
  };

  return (
    <section id="contact" className="section-gray" style={{ padding:'104px 0' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:52 }}>
          <span className="pill">Get In Touch</span>
          <h2 className="h-section" style={{ marginBottom:10 }}>Biz Bilan <span className="accent">Bog'laning</span></h2>
          <p className="sub">Savollaringiz bormi? 24 soat ichida javob beramiz</p>
        </motion.div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:40 }} className="contact-grid">

          {/* Form */}
          <motion.div initial={{ opacity:0, x:-24 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}>
            <div className="card" style={{ padding:32, boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
                <div className="icon-box"><MessageSquare size={18} style={{ color:'#0ea5e9' }} /></div>
                <div>
                  <p style={{ fontWeight:800, color:'#0f172a', fontSize:16 }}>Xabar Yuboring</p>
                  <p style={{ fontSize:12, color:'#94a3b8' }}>Biz tezda javob beramiz</p>
                </div>
              </div>

              {status === 'success' ? (
                <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
                  style={{ textAlign:'center', padding:'40px 0' }}>
                  <div style={{ width:60, height:60, borderRadius:'50%', margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0fdf4', border:'2px solid #86efac' }}>
                    <CheckCircle size={28} style={{ color:'#16a34a' }} />
                  </div>
                  <h4 style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:6 }}>Xabar Yuborildi!</h4>
                  <p style={{ color:'#64748b', fontSize:13, marginBottom:24 }}>Tez orada siz bilan bog'lanamiz.</p>
                  <button className="btn-outline" onClick={() => { setStatus('idle'); setForm({ name:'',email:'',phone:'',subject:'',message:'' }); }}>
                    Yana yuborish
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div>
                      <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Ismingiz *</label>
                      <input className="inp" name="name" value={form.name} onChange={change} required placeholder="Ism Familiya"/>
                    </div>
                    <div>
                      <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Telefon</label>
                      <input className="inp" name="phone" value={form.phone} onChange={change} placeholder="+998 90 ..."/>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Email *</label>
                    <input className="inp" type="email" name="email" value={form.email} onChange={change} required placeholder="you@example.com"/>
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Mavzu</label>
                    <select className="inp" name="subject" value={form.subject} onChange={change} style={{ cursor:'pointer' }}>
                      <option value="">Tanlang...</option>
                      <option value="course">Kurs haqida</option>
                      <option value="service">Xizmat haqida</option>
                      <option value="project">Loyiha haqida</option>
                      <option value="other">Boshqa</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Xabar *</label>
                    <textarea className="inp" name="message" value={form.message} onChange={change} required rows={4} placeholder="Xabaringizni yozing..." style={{ resize:'none' }}/>
                  </div>
                  <button type="submit" disabled={status==='loading'} className="btn-primary"
                    style={{ justifyContent:'center', opacity:status==='loading'?0.7:1 }}>
                    {status==='loading' ? <><Loader size={15} style={{ animation:'spin 1s linear infinite' }}/> Yuborilmoqda...</> : <><Send size={14}/> Xabar Yuborish</>}
                  </button>
                </form>
              )}
            </div>
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity:0, x:24 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ duration:0.6 }}
            style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {INFO.map(inf => {
              const Icon = inf.icon;
              return (
                <motion.a key={inf.label} href={inf.href} target={inf.href.startsWith('http')?'_blank':undefined} rel="noopener noreferrer"
                  whileHover={{ x:5 }} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px', borderRadius:16, textDecoration:'none', background:inf.bg, border:`1.5px solid ${inf.border}`, transition:'all 0.25s', boxShadow:'0 2px 10px rgba(0,0,0,0.04)' }}>
                  <div style={{ width:42, height:42, flexShrink:0, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', border:`1.5px solid ${inf.border}`, boxShadow:'0 2px 6px rgba(0,0,0,0.06)' }}>
                    <Icon size={18} style={{ color:inf.color }}/>
                  </div>
                  <div>
                    <p style={{ fontSize:10, color:'#94a3b8', marginBottom:1, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{inf.label}</p>
                    <p style={{ fontSize:14, fontWeight:800, color:'#0f172a' }}>{inf.value}</p>
                    <p style={{ fontSize:11, color:'#94a3b8' }}>{inf.sub}</p>
                  </div>
                </motion.a>
              );
            })}
            <MapBox/>
            <div className="card" style={{ padding:'16px 18px', boxShadow:'0 2px 10px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize:13, fontWeight:800, color:'#0f172a', marginBottom:12 }}>⏰ Ish Vaqtlari</p>
              {[['Dushanba — Juma','09:00 — 19:00',false],['Shanba','09:00 — 19:00',false],['Yakshanba','Yopiq',true]].map(([d,t,cl])=>(
                <div key={d} style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:13, color:'#64748b' }}>{d}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:cl?'#cbd5e1':'#0ea5e9', fontFamily:'JetBrains Mono,monospace' }}>{t}</span>
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
