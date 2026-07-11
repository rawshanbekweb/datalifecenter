import React, { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Star, Quote } from 'lucide-react';
import { listTestimonials } from '../api/testimonials';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  text: string;
  rating: number;
}

type TestimonialsStatus = 'loading' | 'ready' | 'error';

export default function Testimonials(): React.ReactElement | null {
  const { t } = useTranslation();
  const [items, setItems]   = useState<Testimonial[]>([]);
  const [status, setStatus] = useState<TestimonialsStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    listTestimonials()
      .then((data: Testimonial[]) => { if (!cancelled) { setItems(data); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  // Hali sharh qo'shilmagan yoki xato bo'lsa bo'lim umuman ko'rsatilmaydi
  if (status !== 'loading' && items.length === 0) return null;

  return (
    <section id="testimonials" className="section-light" style={{ padding:'104px 0' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
        <m.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:52 }}>
          <span className="pill" style={{ background:'#f0fdf4', borderColor:'#bbf7d0', color:'#16a34a' }}>{t('home.testimonials.pill')}</span>
          <h2 className="h-section" style={{ marginBottom:10 }}>{t('home.testimonials.titleStart')} <span className="accent">{t('home.testimonials.titleAccent')}</span></h2>
          <p className="sub">{t('home.testimonials.subtitle')}</p>
        </m.div>

        {status === 'loading' && <p style={{ textAlign:'center', color:'#94a3b8', fontSize:14 }}>{t('common.loading')}</p>}

        {status === 'ready' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }} className="testimonials-grid">
            {items.map((t: Testimonial, i: number) => (
              <m.div key={t.id} initial={{ opacity:0, y:28 }} whileInView={{ opacity:1, y:0 }}
                viewport={{ once:true, margin:'-30px' }} transition={{ duration:0.5, delay:(i%3)*0.1 }}
                className="card" style={{ padding:'26px 24px', boxShadow:'0 2px 16px rgba(0,0,0,0.06)', position:'relative' }}>
                <Quote size={28} style={{ color:'#bae6fd', marginBottom:10 }} />
                <div style={{ display:'flex', gap:2, marginBottom:12 }}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} size={14} fill={idx < t.rating ? '#f59e0b' : 'none'} style={{ color:'#f59e0b' }} />
                  ))}
                </div>
                <p style={{ fontSize:13.5, color:'#475569', lineHeight:1.8, marginBottom:20 }}>{t.text}</p>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  {t.avatarUrl ? (
                    <img src={t.avatarUrl} alt={t.name} style={{ width:40, height:40, borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
                  ) : (
                    <div style={{ width:40, height:40, borderRadius:'50%', background:'#f0f9ff', border:'1.5px solid #bae6fd', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontWeight:800, color:'#0ea5e9', fontSize:15 }}>
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize:13.5, fontWeight:800, color:'#0f172a' }}>{t.name}</p>
                    <p style={{ fontSize:11.5, color:'#94a3b8' }}>{t.role}</p>
                  </div>
                </div>
              </m.div>
            ))}
          </div>
        )}
      </div>
      <style>{`@media(max-width:1024px){.testimonials-grid{grid-template-columns:1fr 1fr!important}} @media(max-width:600px){.testimonials-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}
