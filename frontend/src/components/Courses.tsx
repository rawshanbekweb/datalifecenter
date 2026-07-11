import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { listCourses } from '../api/courses';
import CourseCard from './courses/CourseCard';
import React from 'react';

type CourseStatus = 'loading' | 'ready' | 'error';

export default function Courses(): React.ReactElement {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<any[]>([]);
  const [status, setStatus]   = useState<CourseStatus>('loading');

  useEffect(() => {
    let cancelled = false;
    listCourses({ limit: 6 })
      .then(({ items }: { items: any[] }) => { if (!cancelled) { setCourses(items); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section id="courses" className="section-light" style={{ padding:'104px 0' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
        <m.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:52 }}>
          <span className="pill">{t('home.courses.pill')}</span>
          <h2 className="h-section" style={{ marginBottom:10 }}>{t('home.courses.titleStart')}<span className="accent">{t('home.courses.titleAccent')}</span></h2>
          <p className="sub">{t('home.courses.subtitle')}</p>
        </m.div>

        {status === 'error' && (
          <p style={{ textAlign:'center', color:'#dc2626', fontSize:14 }}>{t('home.courses.loadError')}</p>
        )}
        {status === 'loading' && (
          <p style={{ textAlign:'center', color:'#94a3b8', fontSize:14 }}>{t('common.loading')}</p>
        )}

        {status === 'ready' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }} className="courses-grid">
            {courses.map((c: any, i: number) => <CourseCard key={c.id} course={c} index={i} />)}
          </div>
        )}

        <div style={{ textAlign:'center', marginTop:36 }}>
          <Link to="/courses">
            <button className="btn-dark" style={{ display:'inline-flex', alignItems:'center', gap:8 }}>{t('home.courses.allCourses')} <ArrowRight size={15}/></button>
          </Link>
        </div>
      </div>
      <style>{`@media(max-width:1024px){.courses-grid{grid-template-columns:1fr 1fr!important}} @media(max-width:600px){.courses-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}
