import { useEffect, useState } from 'react';
import SectionHeader from '../components/common/SectionHeader';
import MentorCard from '../components/mentors/MentorCard';
import { listMentors } from '../api/mentors';

export default function MentorsPage() {
  const [mentors, setMentors] = useState([]);
  const [status, setStatus]   = useState('loading');

  useEffect(() => {
    let cancelled = false;
    listMentors()
      .then((data) => { if (!cancelled) { setMentors(data); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="section-light" style={{ padding:'160px 0 104px' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
        <SectionHeader pill="Bizning jamoa" title="Mentor" accent="larimiz" sub="Sohasining professional mutaxassislari sizga yo'l-yo'riq ko'rsatadi" />

        {status === 'loading' && <p style={{ textAlign:'center', color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</p>}
        {status === 'error' && <p style={{ textAlign:'center', color:'#dc2626', fontSize:14 }}>Mentorlarni yuklab bo'lmadi. Backend ishga tushirilganini tekshiring.</p>}
        {status === 'ready' && mentors.length === 0 && (
          <p style={{ textAlign:'center', color:'#94a3b8', fontSize:14 }}>Hozircha mentorlar qo'shilmagan.</p>
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
