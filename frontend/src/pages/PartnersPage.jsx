import { useEffect, useState } from 'react';
import SectionHeader from '../components/common/SectionHeader';
import PartnerCard from '../components/partners/PartnerCard';
import { listPartners } from '../api/partners';

export default function PartnersPage() {
  const [partners, setPartners] = useState([]);
  const [status, setStatus]     = useState('loading');

  useEffect(() => {
    let cancelled = false;
    listPartners()
      .then((data) => { if (!cancelled) { setPartners(data); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="section-light" style={{ padding:'160px 0 104px' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
        <SectionHeader pill="Ishonchli aloqalar" title="Hamkor" accent="larimiz" sub="Biz bilan hamkorlik qiluvchi kompaniyalar va tashkilotlar" />

        {status === 'loading' && <p style={{ textAlign:'center', color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</p>}
        {status === 'error' && <p style={{ textAlign:'center', color:'#dc2626', fontSize:14 }}>Hamkorlarni yuklab bo'lmadi. Backend ishga tushirilganini tekshiring.</p>}
        {status === 'ready' && partners.length === 0 && (
          <p style={{ textAlign:'center', color:'#94a3b8', fontSize:14 }}>Hozircha hamkorlar qo'shilmagan.</p>
        )}
        {status === 'ready' && partners.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }} className="partners-grid">
            {partners.map((p, i) => <PartnerCard key={p.id} partner={p} index={i} />)}
          </div>
        )}
      </div>
      <style>{`@media(max-width:900px){.partners-grid{grid-template-columns:1fr 1fr!important}} @media(max-width:520px){.partners-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}
