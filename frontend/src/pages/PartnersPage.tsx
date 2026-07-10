import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SectionHeader from '../components/common/SectionHeader';
import PartnerCard, { PartnerCardData } from '../components/partners/PartnerCard';
import { listPartners } from '../api/partners';

type Partner = PartnerCardData;

type Status = 'loading' | 'ready' | 'error';

export default function PartnersPage(): React.ReactElement {
  const { t } = useTranslation();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [status, setStatus]     = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    listPartners()
      .then((data: Partner[]) => { if (!cancelled) { setPartners(data); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="section-light" style={{ padding:'160px 0 104px' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
        <SectionHeader pill={t('pages.partners.pill')} title={t('pages.partners.title')} accent={t('pages.partners.accent')} sub={t('pages.partners.sub')} />

        {status === 'loading' && <p style={{ textAlign:'center', color:'#94a3b8', fontSize:14 }}>{t('common.loading')}</p>}
        {status === 'error' && <p style={{ textAlign:'center', color:'#dc2626', fontSize:14 }}>{t('pages.partners.loadError')}</p>}
        {status === 'ready' && partners.length === 0 && (
          <p style={{ textAlign:'center', color:'#94a3b8', fontSize:14 }}>{t('pages.partners.empty')}</p>
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
