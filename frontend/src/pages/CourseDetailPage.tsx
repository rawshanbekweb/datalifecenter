import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Clock, Star, Users, PlayCircle, Lock, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { getCourseBySlug } from '../api/courses';
import { createEnrollment, getMyEnrollments, mockPayEnrollment } from '../api/enrollments';
import { resolveIcon } from '../utils/iconMap';
import { formatNumber } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
import ComingSoon from '../components/common/ComingSoon';
import CourseReviews from '../components/courses/CourseReviews';

interface Lesson {
  id: string | number;
  title: string;
  isFreePreview?: boolean;
  durationMinutes?: number | null;
}

interface CourseModule {
  id: string | number;
  title: string;
  lessons: Lesson[];
}

interface CourseMentor {
  name: string;
  specialty?: string;
  bio?: string;
}

type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

interface CourseDetail {
  id: string | number;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  iconKey: string;
  color: string;
  bg: string;
  border: string;
  rating?: number | string;
  reviewsCount?: number;
  level: CourseLevel;
  price: number | string;
  currency: string;
  isFree: boolean;
  durationMonths: number;
  studentsCount: number;
  modules: CourseModule[];
  mentor?: CourseMentor | null;
  [key: string]: unknown;
}

interface Enrollment {
  id: string | number;
  paymentStatus: string;
  status?: string;
  [key: string]: unknown;
}

type LoadStatus = 'loading' | 'ready' | 'not-found' | 'error';
type EnrollStatus = 'idle' | 'loading' | 'success' | 'already' | 'error';
type PayStatus = 'idle' | 'loading' | 'success' | 'error';

export default function CourseDetailPage(): React.ReactElement {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [enrollStatus, setEnrollStatus] = useState<EnrollStatus>('idle');
  const [enrollError, setEnrollError]   = useState<string>('');
  const [enrollment, setEnrollment]     = useState<Enrollment | null>(null);
  const [payStatus, setPayStatus]       = useState<PayStatus>('idle');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    getCourseBySlug(slug!)
      .then((data) => { if (!cancelled) { setCourse(data as CourseDetail); setStatus('ready'); } })
      .catch((err) => { if (!cancelled) setStatus(err.status === 404 ? 'not-found' : 'error'); });
    return () => { cancelled = true; };
  }, [slug]);

  // Foydalanuvchi bu kursga yozilganmi — sahifa ochilganda aniqlaymiz
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getMyEnrollments()
      .then((list: Enrollment[]) => {
        if (cancelled) return;
        const found = list.find((e) => (e.course as { slug?: string } | undefined)?.slug === slug);
        if (found) {
          setEnrollment(found);
          setEnrollStatus(found.status === 'PENDING' ? 'success' : 'already');
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user, slug]);

  if (status === 'loading') {
    return <section style={{ padding:'200px 24px 80px', textAlign:'center', color:'#94a3b8', fontSize:14 }}>{t('common.loading')}</section>;
  }
  if (status === 'error') {
    return <ComingSoon title={t('common.error')} sub={t('pages.courseDetail.errorSub')} />;
  }
  if (status === 'not-found' || !course) {
    return <ComingSoon title={t('pages.courseDetail.notFoundTitle')} sub={t('pages.courseDetail.notFoundSub')} />;
  }

  const Icon = resolveIcon(course.iconKey);
  const totalLessons = course.modules.reduce((sum: number, m: CourseModule) => sum + m.lessons.length, 0);

  const enroll = async (): Promise<void> => {
    setEnrollStatus('loading');
    try {
      const created = await createEnrollment(course.id);
      setEnrollment(created as Enrollment);
      setEnrollStatus('success');
    } catch (err: any) {
      if (err.code === 'ALREADY_ENROLLED') {
        setEnrollStatus('already');
      } else {
        setEnrollError(err.message || t('common.error'));
        setEnrollStatus('error');
      }
    }
  };

  const simulatePayment = async (): Promise<void> => {
    setPayStatus('loading');
    try {
      const paid = await mockPayEnrollment(enrollment!.id);
      setEnrollment(paid as Enrollment);
      setPayStatus('success');
    } catch {
      setPayStatus('error');
    }
  };

  return (
    <section style={{ padding:'160px 0 104px' }}>
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'0 24px' }}>
        <Link to="/courses" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'#64748b', textDecoration:'none', marginBottom:24 }}>
          <ArrowLeft size={14}/> {t('pages.courseDetail.back')}
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
            <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#475569' }}><Clock size={14}/> {t('pages.courseDetail.months', { n: course.durationMonths })}</span>
            {Number(course.rating) > 0 && (
              <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#475569' }}><Star size={14} fill={course.color} style={{ color:course.color }}/> {course.rating}</span>
            )}
            {course.studentsCount > 0 && (
              <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#475569' }}><Users size={14}/> {t('pages.courseDetail.students', { n: course.studentsCount })}</span>
            )}
            <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{t(`levels.${course.level}`)}</span>
            <span style={{ marginLeft:'auto', fontSize:14, fontWeight:800, color: course.isFree ? '#16a34a' : '#0f172a' }}>
              {course.isFree ? t('common.free') : `${formatNumber(Number(course.price))} ${course.currency}`}
            </span>
          </div>
        </motion.div>

        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:24 }} className="detail-grid">
          <div>
            <h2 style={{ fontSize:18, fontWeight:800, color:'#0f172a', marginBottom:16 }}>{t('pages.courseDetail.curriculum', { n: totalLessons })}</h2>
            {course.modules.map((mod, mi) => (
              <div key={mod.id} className="card" style={{ padding:'18px 20px', marginBottom:12 }}>
                <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:10 }}>
                  <span style={{ color:course.color, fontFamily:'JetBrains Mono,monospace', marginRight:8 }}>0{mi+1}</span>{mod.title}
                </p>
                {mod.lessons.map((lesson) => (
                  <div key={lesson.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', fontSize:13, color:'#64748b' }}>
                    {lesson.isFreePreview ? <PlayCircle size={15} style={{ color:course.color }}/> : <Lock size={13} style={{ color:'#cbd5e1' }}/>}
                    <span style={{ flex:1 }}>{lesson.title}</span>
                    {lesson.isFreePreview && <span className="tag" style={{ borderColor:course.border, color:course.color }}>{t('common.free')}</span>}
                    {lesson.durationMinutes && <span style={{ fontSize:11, color:'#94a3b8' }}>{t('pages.courseDetail.minutesShort', { n: lesson.durationMinutes })}</span>}
                  </div>
                ))}
              </div>
            ))}

            <CourseReviews slug={course.slug} rating={course.rating} reviewsCount={course.reviewsCount} color={course.color} />
          </div>

          <div>
            {course.mentor && (
              <div className="card" style={{ padding:20, marginBottom:16 }}>
                <p style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>{t('pages.courseDetail.mentor')}</p>
                <p style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:4 }}>{course.mentor.name}</p>
                <p style={{ fontSize:12, color:course.color, fontWeight:600, marginBottom:8 }}>{course.mentor.specialty}</p>
                <p style={{ fontSize:12, color:'#64748b', lineHeight:1.7 }}>{course.mentor.bio}</p>
              </div>
            )}
            <div className="card" style={{ padding:20 }}>
              {!user && (
                <>
                  <p style={{ fontSize:13, color:'#64748b', marginBottom:14, lineHeight:1.7 }}>
                    {t('pages.courseDetail.loginPrompt')}
                  </p>
                  <Link to="/login" state={{ from: `/courses/${slug}` }}>
                    <button className="btn-primary" style={{ width:'100%', justifyContent:'center' }}>
                      {t('pages.courseDetail.loginAndEnroll')} <ArrowRight size={15}/>
                    </button>
                  </Link>
                </>
              )}

              {user && enrollStatus === 'success' && enrollment && enrollment.paymentStatus !== 'UNPAID' && (
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:12, background:'#f0fdf4', border:'1.5px solid #bbf7d0', marginBottom:14 }}>
                    <CheckCircle size={18} style={{ color:'#16a34a', flexShrink:0 }} />
                    <p style={{ fontSize:13, color:'#16a34a', fontWeight:600 }}>{t('pages.courseDetail.enrolledSuccess')}</p>
                  </div>
                  <Link to={`/learn/${slug}`}>
                    <button className="btn-primary" style={{ width:'100%', justifyContent:'center' }}>
                      <PlayCircle size={15}/> {t('pages.courseDetail.startLessons')}
                    </button>
                  </Link>
                </div>
              )}
              {user && enrollStatus === 'success' && enrollment && enrollment.paymentStatus === 'UNPAID' && (
                <div>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px', borderRadius:12, background:'#fffbeb', border:'1.5px solid #fde68a', marginBottom:14 }}>
                    <CreditCard size={18} style={{ color:'#d97706', flexShrink:0, marginTop:1 }} />
                    <p style={{ fontSize:13, color:'#d97706', fontWeight:600, lineHeight:1.6 }}>
                      {t('pages.courseDetail.pendingInfo')}
                    </p>
                  </div>
                  <Link to="/student">
                    <button className="btn-primary" style={{ width:'100%', justifyContent:'center', marginBottom:14 }}>
                      <CreditCard size={15}/> {t('pages.courseDetail.goPay')}
                    </button>
                  </Link>
                  {import.meta.env.DEV && payStatus !== 'success' && (
                    <button onClick={simulatePayment} disabled={payStatus === 'loading'} className="btn-outline"
                      style={{ width:'100%', justifyContent:'center', opacity: payStatus === 'loading' ? 0.7 : 1 }}>
                      {payStatus === 'loading' ? 'Simulyatsiya qilinmoqda...' : "[DEV] To'lovni simulyatsiya qilish"}
                    </button>
                  )}
                  {import.meta.env.DEV && payStatus === 'success' && (
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:12, background:'#f0fdf4', border:'1.5px solid #bbf7d0', marginBottom:14 }}>
                        <CheckCircle size={18} style={{ color:'#16a34a', flexShrink:0 }} />
                        <p style={{ fontSize:13, color:'#16a34a', fontWeight:600 }}>To'lov tasdiqlandi (dev simulyatsiya) — kurs faollashtirildi!</p>
                      </div>
                      <Link to={`/learn/${slug}`}>
                        <button className="btn-primary" style={{ width:'100%', justifyContent:'center' }}>
                          <PlayCircle size={15}/> {t('pages.courseDetail.startLessons')}
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
              {user && enrollStatus === 'already' && (
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:12, background:'#f0f9ff', border:'1.5px solid #bae6fd', marginBottom:14 }}>
                    <CheckCircle size={18} style={{ color:'#0ea5e9', flexShrink:0 }} />
                    <p style={{ fontSize:13, color:'#0ea5e9', fontWeight:600 }}>{t('pages.courseDetail.alreadyEnrolled')}</p>
                  </div>
                  <Link to={`/learn/${slug}`}>
                    <button className="btn-primary" style={{ width:'100%', justifyContent:'center' }}>
                      <PlayCircle size={15}/> {t('pages.courseDetail.continueLessons')}
                    </button>
                  </Link>
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
                    {course.isFree ? t('pages.courseDetail.freePrompt') : t('pages.courseDetail.paidPrompt')}
                  </p>
                  <button onClick={enroll} disabled={enrollStatus === 'loading'} className="btn-primary"
                    style={{ width:'100%', justifyContent:'center', opacity: enrollStatus === 'loading' ? 0.7 : 1 }}>
                    {enrollStatus === 'loading' ? t('common.sending') : <>{t('pages.courseDetail.enroll')} <ArrowRight size={15}/></>}
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
