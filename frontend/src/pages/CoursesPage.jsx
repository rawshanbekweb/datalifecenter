import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import SectionHeader from '../components/common/SectionHeader';
import CourseCard from '../components/courses/CourseCard';
import { listCourses } from '../api/courses';

const LEVELS = [
  { value: '', label: 'Barcha darajalar' },
  { value: 'BEGINNER', label: 'Boshlang\'ich' },
  { value: 'INTERMEDIATE', label: "O'rta" },
  { value: 'ADVANCED', label: "Yuqori" },
];

const PRICE_OPTIONS = [
  { value: '', label: 'Barcha kurslar' },
  { value: 'true', label: 'Bepul' },
  { value: 'false', label: 'Pullik' },
];

export default function CoursesPage() {
  const [search, setSearch] = useState('');
  const [level, setLevel]   = useState('');
  const [isFree, setIsFree] = useState('');
  const [courses, setCourses] = useState([]);
  const [status, setStatus]   = useState('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    const timer = setTimeout(() => {
      listCourses({ search, level, isFree, limit: 50 })
        .then(({ items }) => { if (!cancelled) { setCourses(items); setStatus('ready'); } })
        .catch(() => { if (!cancelled) setStatus('error'); });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [search, level, isFree]);

  return (
    <section className="section-light" style={{ padding:'160px 0 104px' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
        <SectionHeader pill="Kurslar katalogi" title="Barcha" accent="kurslar" sub="O'zingizga mos yo'nalishni tanlang va bugunoq boshlang" />

        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:32, justifyContent:'center' }}>
          <div style={{ position:'relative', flex:'1 1 260px', maxWidth:320 }}>
            <Search size={15} style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
            <input className="inp" style={{ paddingLeft:38 }} placeholder="Kurs qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="inp" style={{ maxWidth:200, cursor:'pointer' }} value={level} onChange={e => setLevel(e.target.value)}>
            {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <select className="inp" style={{ maxWidth:180, cursor:'pointer' }} value={isFree} onChange={e => setIsFree(e.target.value)}>
            {PRICE_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        {status === 'loading' && <p style={{ textAlign:'center', color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</p>}
        {status === 'error' && <p style={{ textAlign:'center', color:'#dc2626', fontSize:14 }}>Kurslarni yuklab bo'lmadi. Backend ishga tushirilganini tekshiring.</p>}
        {status === 'ready' && courses.length === 0 && (
          <p style={{ textAlign:'center', color:'#94a3b8', fontSize:14 }}>Hech qanday kurs topilmadi.</p>
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
