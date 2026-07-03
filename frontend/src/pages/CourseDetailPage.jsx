import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Star, Users, PlayCircle, Lock, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { getCourseBySlug } from '../api/courses';
import { createEnrollment, mockPayEnrollment } from '../api/enrollments';
import { resolveIcon } from '../utils/iconMap';
import { useAuth } from '../hooks/useAuth';
import ComingSoon from '../components/common/ComingSoon';

const LEVEL_LABELS = { BEGINNER: "Boshlang'ich", INTERMEDIATE: "O'rta", ADVANCED: 'Yuqori' };

export default function CourseDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [status, setStatus] = useState('loading');
  const [enrollStatus, setEnrollStatus] = useState('idle');
  const [enrollError, setEnrollError]   = useState('');
  const [enrollment, setEnrollment]     = useState(null);
  const [payStatus, setPayStatus]       = useState('idle');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    getCourseBySlug(slug)
      .then((data) => { if (!cancelled) { setCourse(data); setStatus('ready'); } })
      .catch((err) => { if (!cancelled) setStatus(err.status === 404 ? 'not-found' : 'error'); });
    return () => { cancelled = true; };
  }, [slug]);

  if (status === 'loading') {
    return <section style={{ padding:'200px 24px 80px', textAlign:'center', color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</section>;
  }
  if (status === 'not-found') {
    return <ComingSoon title="Kurs topilmadi" sub="Siz qidirgan kurs mavjud emas yoki o'chirilgan." />;
  }
  if (status === 'error') {
    return <ComingSoon title="Xatolik yuz berdi" sub="Kursni yuklab bo'lmadi. Backend ishga tushirilganini tekshiring." />;
  }

  const Icon = resolveIcon(course.iconKey);
  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  const enroll = async () => {
    setEnrollStatus('loading');
    try {
      const created = await createEnrollment(course.id);
      setEnrollment(created);
      setEnrollStatus('success');
    } catch (err) {
      if (err.code === 'ALREADY_ENROLLED') {
        setEnrollStatus('already');
      } else {
        setEnrollError(err.message || 'Xatolik yuz berdi');
        setEnrollStatus('error');
      }
    }
  };

  const simulatePayment = async () => {
    setPayStatus('loading');
    try {
      const paid = await mockPayEnrollment(enrollment.id);
      setEnrollment(paid);
      setPayStatus('success');
    } catch {
      setPayStatus('error');
    }
  };

  return (
    <section style={{ padding:'160px 0 104px' }}>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'0 24px' }}>
        <Link to="/courses" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'#64748b', textDecoration:'none', marginBottom:24 }}>
          <ArrowLeft size={14}/> Barcha kurslar
        </Link>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          className="card" style={{ padding:32, marginBottom:24, background:course.bg, border:`1.5px solid ${course.border}` }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:20, flexWrap:'wrap' }}>
            <div style={{ width:56, height:56, borderRadius:15, display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', border:`1.5px solid ${course.border}`, flexShrink:0 }}>
              <Icon size={26} style={{ color:course.color }} />
            </div>
            <div style={{ flex:1, minWidth:240 }}>
              <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(24px,3vw,32px)', fontWeight:800, color:'#0f172a', marginBottom:4 }}>{course.title}</h1>
              <p style={{ fontSize:14, color:course.color, fontWeight:700, marginBottom:12 }}>{course.subtitle}</p>
              <p style={{ color:'#64748b', fontSize:14, lineHeight:1.8 }}>{course.description}</p>
            </div>
          </div>

          <div style={{ display:'flex', gap:24, flexWrap:'wrap', marginTop:24, paddingTop:20, borderTop:`1px solid ${course.border}` }}>
            <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#475569' }}><Clock size={14}/> {course.durationMonths} oy</span>
            <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#475569' }}><Star size={14} fill={course.color} style={{ color:course.color }}/> {course.rating}</span>
            <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#475569' }}><Users size={14}/> {course.studentsCount} talaba</span>
            <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{LEVEL_LABELS[course.level]}</span>
            <span style={{ marginLeft:'auto', fontSize:14, fontWeight:800, color: course.isFree ? '#16a34a' : '#0f172a' }}>
              {course.isFree ? 'Bepul' : `${Number(course.price).toLocaleString('uz-UZ')} ${course.currency}`}
            </span>
          </div>
        </motion.div>

        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:24 }} className="detail-grid">
          <div>
            <h2 style={{ fontSize:18, fontWeight:800, color:'#0f172a', marginBottom:16 }}>Dastur tarkibi ({totalLessons} dars)</h2>
            {course.modules.map((mod, mi) => (
              <div key={mod.id} className="card" style={{ padding:'18px 20px', marginBottom:12 }}>
                <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:10 }}>
                  <span style={{ color:course.color, fontFamily:'JetBrains Mono,monospace', marginRight:8 }}>0{mi+1}</span>{mod.title}
                </p>
                {mod.lessons.map((lesson) => (
                  <div key={lesson.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', fontSize:13, color:'#64748b' }}>
                    {lesson.isFreePreview ? <PlayCircle size={15} style={{ color:course.color }}/> : <Lock size={13} style={{ color:'#cbd5e1' }}/>}
                    <span style={{ flex:1 }}>{lesson.title}</span>
                    {lesson.isFreePreview && <span className="tag" style={{ borderColor:course.border, color:course.color }}>Bepul</span>}
                    {lesson.durationMinutes && <span style={{ fontSize:11, color:'#94a3b8' }}>{lesson.durationMinutes} daq</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div>
            {course.mentor && (
              <div className="card" style={{ padding:20, marginBottom:16 }}>
                <p style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Mentor</p>
                <p style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:4 }}>{course.mentor.name}</p>
                <p style={{ fontSize:12, color:course.color, fontWeight:600, marginBottom:8 }}>{course.mentor.specialty}</p>
                <p style={{ fontSize:12, color:'#64748b', lineHeight:1.7 }}>{course.mentor.bio}</p>
              </div>
            )}
            <div className="card" style={{ padding:20 }}>
              {!user && (
                <>
                  <p style={{ fontSize:13, color:'#64748b', marginBottom:14, lineHeight:1.7 }}>
                    Kursga yozilish uchun hisobingizga kiring.
                  </p>
                  <Link to="/login" state={{ from: `/courses/${slug}` }}>
                    <button className="btn-primary" style={{ width:'100%', justifyContent:'center' }}>
                      Kirish va yozilish <ArrowRight size={15}/>
                    </button>
                  </Link>
                </>
              )}

              {user && enrollStatus === 'success' && enrollment.paymentStatus !== 'UNPAID' && (
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:12, background:'#f0fdf4', border:'1.5px solid #bbf7d0' }}>
                  <CheckCircle size={18} style={{ color:'#16a34a', flexShrink:0 }} />
                  <p style={{ fontSize:13, color:'#16a34a', fontWeight:600 }}>Muvaffaqiyatli yozildingiz!</p>
                </div>
              )}
              {user && enrollStatus === 'success' && enrollment.paymentStatus === 'UNPAID' && (
                <div>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px', borderRadius:12, background:'#fffbeb', border:'1.5px solid #fde68a', marginBottom:14 }}>
                    <CreditCard size={18} style={{ color:'#d97706', flexShrink:0, marginTop:1 }} />
                    <p style={{ fontSize:13, color:'#d97706', fontWeight:600, lineHeight:1.6 }}>
                      So'rovingiz qabul qilindi. To'lov tizimi tez orada ulanadi — hozircha yozilishingiz "Kutilmoqda" holatida.
                    </p>
                  </div>
                  {import.meta.env.DEV && payStatus !== 'success' && (
                    <button onClick={simulatePayment} disabled={payStatus === 'loading'} className="btn-outline"
                      style={{ width:'100%', justifyContent:'center', opacity: payStatus === 'loading' ? 0.7 : 1 }}>
                      {payStatus === 'loading' ? 'Simulyatsiya qilinmoqda...' : "[DEV] To'lovni simulyatsiya qilish"}
                    </button>
                  )}
                  {import.meta.env.DEV && payStatus === 'success' && (
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:12, background:'#f0fdf4', border:'1.5px solid #bbf7d0' }}>
                      <CheckCircle size={18} style={{ color:'#16a34a', flexShrink:0 }} />
                      <p style={{ fontSize:13, color:'#16a34a', fontWeight:600 }}>To'lov tasdiqlandi (dev simulyatsiya) — kurs faollashtirildi!</p>
                    </div>
                  )}
                </div>
              )}
              {user && enrollStatus === 'already' && (
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:12, background:'#f0f9ff', border:'1.5px solid #bae6fd' }}>
                  <CheckCircle size={18} style={{ color:'#0ea5e9', flexShrink:0 }} />
                  <p style={{ fontSize:13, color:'#0ea5e9', fontWeight:600 }}>Siz bu kursga allaqachon yozilgansiz.</p>
                </div>
              )}
              {user && (enrollStatus === 'idle' || enrollStatus === 'loading' || enrollStatus === 'error') && (
                <>
                  {enrollStatus === 'error' && (
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:12, background:'#fef2f2', border:'1.5px solid #fecaca', marginBottom:14 }}>
                      <AlertCircle size={16} style={{ color:'#dc2626', flexShrink:0 }} />
                      <p style={{ fontSize:13, color:'#dc2626' }}>{enrollError}</p>
                    </div>
                  )}
                  <p style={{ fontSize:13, color:'#64748b', marginBottom:14, lineHeight:1.7 }}>
                    {course.isFree ? "Bu kurs bepul — hoziroq boshlashingiz mumkin." : "Kursga yozilish uchun so'rov yuboring."}
                  </p>
                  <button onClick={enroll} disabled={enrollStatus === 'loading'} className="btn-primary"
                    style={{ width:'100%', justifyContent:'center', opacity: enrollStatus === 'loading' ? 0.7 : 1 }}>
                    {enrollStatus === 'loading' ? 'Yuborilmoqda...' : <>Kursga yozilish <ArrowRight size={15}/></>}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`@media(max-width:800px){.detail-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}
