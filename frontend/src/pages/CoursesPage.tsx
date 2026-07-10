import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import SectionHeader from '../components/common/SectionHeader';
import CourseCard, { CourseCardData } from '../components/courses/CourseCard';
import { listCourses } from '../api/courses';

type Status = 'loading' | 'ready' | 'error';

// Qiymatlar API filtriga ketadi, label'lar render paytida t() qilinadi
const LEVELS: { value: string; labelKey: string }[] = [
  { value: '', labelKey: 'pages.courses.allLevels' },
  { value: 'BEGINNER', labelKey: 'levels.BEGINNER' },
  { value: 'INTERMEDIATE', labelKey: 'levels.INTERMEDIATE' },
  { value: 'ADVANCED', labelKey: 'levels.ADVANCED' },
];

const PRICE_OPTIONS: { value: string; labelKey: string }[] = [
  { value: '', labelKey: 'pages.courses.allCourses' },
  { value: 'true', labelKey: 'common.free' },
  { value: 'false', labelKey: 'pages.courses.paid' },
];

export default function CoursesPage(): React.ReactElement {
  const { t } = useTranslation();
  const [search, setSearch] = useState<string>('');
  const [level, setLevel]   = useState<string>('');
  const [isFree, setIsFree] = useState<string>('');
  const [courses, setCourses] = useState<CourseCardData[]>([]);
  const [status, setStatus]   = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    const timer = setTimeout(() => {
      listCourses({ search, level, isFree, limit: 50 })
        .then(({ items }: { items: CourseCardData[] }) => { if (!cancelled) { setCourses(items); setStatus('ready'); } })
        .catch(() => { if (!cancelled) setStatus('error'); });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [search, level, isFree]);

  return (
    <section className="section-light" style={{ padding:'160px 0 104px' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
        <SectionHeader pill={t('pages.courses.pill')} title={t('pages.courses.title')} accent={t('pages.courses.accent')} sub={t('pages.courses.sub')} />

        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:32, justifyContent:'center' }}>
          <div style={{ position:'relative', flex:'1 1 260px', maxWidth:320 }}>
            <Search size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
            <input className="inp" style={{ paddingLeft:38 }} placeholder={t('pages.courses.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="inp" style={{ maxWidth:200, cursor:'pointer' }} value={level} onChange={(e) => setLevel(e.target.value)}>
            {LEVELS.map((l) => <option key={l.value} value={l.value}>{t(l.labelKey)}</option>)}
          </select>
          <select className="inp" style={{ maxWidth:180, cursor:'pointer' }} value={isFree} onChange={(e) => setIsFree(e.target.value)}>
            {PRICE_OPTIONS.map((p) => <option key={p.value} value={p.value}>{t(p.labelKey)}</option>)}
          </select>
        </div>

        {status === 'loading' && <p style={{ textAlign:'center', color:'#94a3b8', fontSize:14 }}>{t('common.loading')}</p>}
        {status === 'error' && <p style={{ textAlign:'center', color:'#dc2626', fontSize:14 }}>{t('home.courses.loadError')}</p>}
        {status === 'ready' && courses.length === 0 && (
          <p style={{ textAlign:'center', color:'#94a3b8', fontSize:14 }}>{t('pages.courses.empty')}</p>
        )}
        {status === 'ready' && courses.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }} className="courses-grid">
            {courses.map((c, i) => <CourseCard key={c.id} course={c} index={i} />)}
          </div>
        )}
      </div>
      <style>{`@media(max-width:1024px){.courses-grid{grid-template-columns:1fr 1fr!important}} @media(max-width:600px){.courses-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}
