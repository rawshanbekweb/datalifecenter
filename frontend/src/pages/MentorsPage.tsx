import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SectionHeader from '../components/common/SectionHeader';
import MentorCard, { MentorCardData } from '../components/mentors/MentorCard';
import { listMentors } from '../api/mentors';

type Mentor = MentorCardData;

type Status = 'loading' | 'ready' | 'error';

export default function MentorsPage(): React.ReactElement {
  const { t } = useTranslation();
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [status, setStatus]   = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    listMentors()
      .then((data: Mentor[]) => { if (!cancelled) { setMentors(data); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="section-light" style={{ padding:'160px 0 104px' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
        <SectionHeader pill={t('pages.mentors.pill')} title={t('pages.mentors.title')} accent={t('pages.mentors.accent')} sub={t('pages.mentors.sub')} />

        {status === 'loading' && <p style={{ textAlign:'center', color:'#94a3b8', fontSize:14 }}>{t('common.loading')}</p>}
        {status === 'error' && <p style={{ textAlign:'center', color:'#dc2626', fontSize:14 }}>{t('pages.mentors.loadError')}</p>}
        {status === 'ready' && mentors.length === 0 && (
          <p style={{ textAlign:'center', color:'#94a3b8', fontSize:14 }}>{t('pages.mentors.empty')}</p>
        )}
        {status === 'ready' && mentors.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }} className="mentors-grid">
            {mentors.map((m, i) => <MentorCard key={m.id} mentor={m} index={i} />)}
          </div>
        )}
      </div>
      <style>{`@media(max-width:1024px){.mentors-grid{grid-template-columns:1fr 1fr!important}} @media(max-width:600px){.mentors-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}
