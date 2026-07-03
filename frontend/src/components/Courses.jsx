import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { listCourses } from '../api/courses';
import CourseCard from './courses/CourseCard';

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [status, setStatus]   = useState('loading');

  useEffect(() => {
    let cancelled = false;
    listCourses({ limit: 6 })
      .then(({ items }) => { if (!cancelled) { setCourses(items); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section id="courses" className="section-light" style={{ padding:'104px 0' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px' }}>
        <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }}
          style={{ textAlign:'center', marginBottom:52 }}>
          <span className="pill">Our Programs</span>
          <h2 className="h-section" style={{ marginBottom:10 }}>Kurs<span className="accent">larimiz</span></h2>
          <p className="sub">Har bir sohada professional bo'lish uchun to'liq dasturlar</p>
        </motion.div>

        {status === 'error' && (
          <p style={{ textAlign:'center', color:'#dc2626', fontSize:14 }}>Kurslarni yuklab bo'lmadi. Backend ishga tushirilganini tekshiring.</p>
        )}
        {status === 'loading' && (
          <p style={{ textAlign:'center', color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</p>
        )}

        {status === 'ready' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20 }} className="courses-grid">
            {courses.map((c, i) => <CourseCard key={c.id} course={c} index={i} />)}
          </div>
        )}

        <div style={{ textAlign:'center', marginTop:36 }}>
          <Link to="/courses">
            <button className="btn-dark" style={{ display:'inline-flex', alignItems:'center', gap:8 }}>Barcha Kurslar <ArrowRight size={15}/></button>
          </Link>
        </div>
      </div>
      <style>{`@media(max-width:1024px){.courses-grid{grid-template-columns:1fr 1fr!important}} @media(max-width:600px){.courses-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}
