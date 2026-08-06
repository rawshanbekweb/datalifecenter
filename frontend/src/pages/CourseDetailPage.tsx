import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Clock, Star, Users, Eye, PlayCircle, Lock, ArrowRight, ArrowLeft, CheckCircle, AlertCircle, CreditCard, MapPin, MessageCircle } from 'lucide-react';
import { getCourseBySlug } from '../api/courses';
import { createEnrollment, getMyEnrollments, mockPayEnrollment } from '../api/enrollments';
import { resolveIcon } from '../utils/iconMap';
import { formatNumber } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
import { useEngagementItem } from '../hooks/useEngagementItem';
import { enrollmentState, type SeatInfo } from '../utils/courseEnrollment';
import { useContentView } from '../hooks/useContentView';
import ComingSoon from '../components/common/ComingSoon';
import LikeButton from '../components/common/LikeButton';
import CourseReviews from '../components/courses/CourseReviews';
import CourseFormatBadge from '../components/courses/CourseFormatBadge';
import CourseRequestModal from '../components/courses/CourseRequestModal';
import Loading from '../components/common/Loading';
import Seo from '../components/common/Seo';
import JsonLd from '../components/common/JsonLd';
import { SITE_URL } from '../api/config';

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
  id: string;
  name: string;
  specialty?: string;
  bio?: string;
  /** Kursning asosiy mentori — ro'yxatda birinchi turadi */
  isLead?: boolean;
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
  /** Onlayn o'qish narxi; offline uchun alohida narx bo'lishi mumkin */
  price: number | string;
  offlinePrice?: number | string | null;
  currency: string;
  isFree: boolean;
  /** Guruhdagi joylar — backend hisoblaydi (courseSeats.service.ts) */
  seats?: { online?: SeatInfo | null; offline?: SeatInfo | null } | null;
  durationMonths: number;
  studentsCount: number;
  views?: number;
  format?: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  /** Offline mashg'ulot manzili */
  location?: string | null;
  modules: CourseModule[];
  /** Kursni olib boradigan mentorlar — asosiysi birinchi */
  mentors?: CourseMentor[];
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
  // Adminga murojaat formasi: qaysi format bilan ochilgani muhim
  const [requestFormat, setRequestFormat] = useState<'ONLINE' | 'OFFLINE' | null>(null);

  const engagement = useEngagementItem('course', course ? String(course.id) : undefined);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    getCourseBySlug(slug!)
      .then((data) => { if (!cancelled) { setCourse(data as CourseDetail); setStatus('ready'); } })
      .catch((err) => { if (!cancelled) setStatus(err.status === 404 ? 'not-found' : 'error'); });
    return () => { cancelled = true; };
  }, [slug]);

  // Ko'rishni alohida so'rov bilan qayd etamiz — dublikat server tomonda
  // qurilma bo'yicha to'siladi, xatosi sahifaga ta'sir qilmaydi
  useContentView('course', course ? String(course.id) : undefined);

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
    return <section style={{ padding:'200px 24px 80px' }}><Loading page /></section>;
  }
  if (status === 'error') {
    return <ComingSoon title={t('common.error')} sub={t('pages.courseDetail.errorSub')} />;
  }
  if (status === 'not-found' || !course) {
    return <ComingSoon title={t('pages.courseDetail.notFoundTitle')} sub={t('pages.courseDetail.notFoundSub')} />;
  }

  const Icon = resolveIcon(course.iconKey);
  const totalLessons = course.modules.reduce((sum: number, m: CourseModule) => sum + m.lessons.length, 0);
  // Faqat offline o'tiladigan kursga sayt orqali yozilib bo'lmaydi;
  // gibrid kursda online yozilish ham, offline uchun murojaat ham mumkin
  // Stats so'rovi kelguncha kurs javobidagi qiymat ko'rsatiladi
  const courseViews = engagement.views ?? course.views ?? 0;
  const isOfflineOnly = course.format === 'OFFLINE';
  const isHybrid = course.format === 'HYBRID';
  // Kurs saytda ko'rinadi, lekin hozircha yangi o'quvchi qabul qilinmaydi.
  // ALLAQACHON yozilganlarga tegmaydi — ular darslarini davom ettiraveradi,
  // shuning uchun bu faqat "hali yozilmagan" holatlarni almashtiradi.
  //
  // Gibrid kursda ikki yo'l MUSTAQIL: onlayn yopiq bo'lsa ham offline
  // guruhga yozilish mumkin, shuning uchun butun kartani "Tez orada" bilan
  // almashtirish faqat IKKALASI ham yopiq bo'lganda to'g'ri bo'ladi.
  const enrollment_ = enrollmentState(course);
  const enrollmentClosed = enrollment_.allClosed;
  const notEnrolledYet = enrollStatus !== 'success' && enrollStatus !== 'already';
  const defaultRequestFormat: 'ONLINE' | 'OFFLINE' = isOfflineOnly || isHybrid ? 'OFFLINE' : 'ONLINE';
  // PULLIK kursga o'quvchi o'zi yozilib qo'ya olmaydi — to'lov markazda qabul
  // qilinadi, shuning uchun yozilish so'rov bo'lib adminga tushadi va joyni
  // admin beradi (backend ham shunday: enrollments.service.ts ENROLLMENT_VIA_REQUEST).
  // Bepul kursda bu to'siq ma'nosiz — joy bo'lsa o'quvchi o'zi boshlayveradi.
  const selfEnrollAllowed = course.isFree === true;
  // offlinePrice qo'yilmagan bo'lsa offline uchun ham onlayn narx amal qiladi
  const onlinePrice = Number(course.price ?? 0);
  const offlinePrice = course.offlinePrice != null ? Number(course.offlinePrice) : onlinePrice;
  const showBothPrices = !course.isFree && isHybrid && offlinePrice !== onlinePrice;

  // Qolgan joy — ochiq turgan yo'lniki (gibridda onlayn birinchi o'rinda).
  // Cheklanmagan guruhda umuman ko'rsatilmaydi.
  const seatsLeft = enrollment_.onlineOpen
    ? enrollment_.onlineSeatsLeft
    : enrollment_.offlineOpen ? enrollment_.offlineSeatsLeft : null;
  const seatsNotice = seatsLeft === null ? null : (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 12px', borderRadius:10, background:'#f0fdf4', border:'1px solid #bbf7d0', marginBottom:12 }}>
      <Users size={14} style={{ color:'#15803d', flexShrink:0 }} />
      <p style={{ fontSize:12.5, color:'#15803d', fontWeight:700 }}>{t('pages.courseDetail.seatsLeft', { n: seatsLeft })}</p>
    </div>
  );

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
      <Seo title={course.title} description={course.subtitle || course.description} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Course',
          name: course.title,
          description: course.subtitle || course.description,
          provider: { '@type': 'Organization', name: 'DATA LIFE', url: SITE_URL },
          // schema.org `instructor` bir nechta bo'lishi mumkin — barcha mentorlar sanaladi
          ...(course.mentors?.length
            ? { instructor: course.mentors.map((m) => ({ '@type': 'Person', name: m.name })) }
            : {}),
          ...(Number(course.rating) > 0 && course.reviewsCount
            ? {
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: Number(course.rating),
                  reviewCount: course.reviewsCount,
                },
              }
            : {}),
        }}
      />
      <div style={{ maxWidth:1000, margin:'0 auto', padding:'0 24px' }}>
        <Link to="/courses" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'#64748b', textDecoration:'none', marginBottom:24 }}>
          <ArrowLeft size={14}/> {t('pages.courseDetail.back')}
        </Link>

        <m.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          className="card" style={{ padding:32, marginBottom:24, background:course.bg, border:`1.5px solid ${course.border}` }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:20, flexWrap:'wrap' }}>
            <div style={{ width:56, height:56, borderRadius:15, display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', border:`1.5px solid ${course.border}`, flexShrink:0 }}>
              <Icon size={26} style={{ color:course.color }} />
            </div>
            <div style={{ flex:1, minWidth:240 }}>
              <h1 style={{ fontFamily:'var(--font-sans)', fontSize:'clamp(24px,3vw,32px)', fontWeight:800, color:'#0f172a', marginBottom:4 }}>{course.title}</h1>
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
            {courseViews > 0 && (
              <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#475569' }}><Eye size={14}/> {courseViews}</span>
            )}
            <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{t(`levels.${course.level}`)}</span>
            <CourseFormatBadge format={course.format} size="md" />
            {course.location && (
              <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#475569' }}>
                <MapPin size={14}/> {course.location}
              </span>
            )}
            <LikeButton liked={engagement.liked} count={engagement.likesCount} onToggle={engagement.toggle} size="md" color={course.color} />
            {/* Onlayn va offline narxlari har xil bo'lishi mumkin. Gibrid kursda
                ikkalasi ham ko'rsatiladi — odam qaysi yo'lni tanlashini narxga
                qarab hal qiladi; bitta formatli kursda faqat o'ziniki. */}
            <span style={{ marginLeft:'auto', fontSize:14, fontWeight:800, color: course.isFree ? '#16a34a' : '#0f172a' }}>
              {course.isFree ? t('common.free') : showBothPrices ? (
                <>
                  <span style={{ color:'#64748b', fontWeight:700, fontSize:12 }}>{t('pages.courseDetail.priceOnline')} </span>
                  {formatNumber(onlinePrice)} {course.currency}
                  <span style={{ color:'#cbd5e1', margin:'0 6px' }}>·</span>
                  <span style={{ color:'#64748b', fontWeight:700, fontSize:12 }}>{t('pages.courseDetail.priceOffline')} </span>
                  {formatNumber(offlinePrice)} {course.currency}
                </>
              ) : `${formatNumber(isOfflineOnly ? offlinePrice : onlinePrice)} ${course.currency}`}
            </span>
          </div>
        </m.div>

        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:24 }} className="detail-grid">
          <div>
            <h2 style={{ fontSize:18, fontWeight:800, color:'#0f172a', marginBottom:16 }}>{t('pages.courseDetail.curriculum', { n: totalLessons })}</h2>
            {course.modules.map((mod, mi) => (
              <div key={mod.id} className="card" style={{ padding:'18px 20px', marginBottom:12 }}>
                <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:10 }}>
                  <span style={{ color:course.color, fontFamily:'var(--font-mono)', marginRight:8 }}>0{mi+1}</span>{mod.title}
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
            {course.mentors && course.mentors.length > 0 && (
              <div className="card" style={{ padding:20, marginBottom:16 }}>
                <p style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>
                  {course.mentors.length > 1 ? t('pages.courseDetail.mentors') : t('pages.courseDetail.mentor')}
                </p>
                {course.mentors.map((mentor, i) => (
                  <div key={mentor.id} style={{
                    // Ajratuvchi chiziq faqat mentorlar ORASIDA — kartaning tepasida emas
                    marginTop: i === 0 ? 0 : 14, paddingTop: i === 0 ? 0 : 14,
                    borderTop: i === 0 ? 'none' : '1px solid #f1f5f9',
                  }}>
                    <p style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:4 }}>{mentor.name}</p>
                    <p style={{ fontSize:12, color:course.color, fontWeight:600, marginBottom:8 }}>{mentor.specialty}</p>
                    <p style={{ fontSize:12, color:'#64748b', lineHeight:1.7 }}>{mentor.bio}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="card" style={{ padding:20 }}>
              {/* Yozilish yopiq: yo'nalish borligi ko'rinib turadi, lekin qabul
                  hozircha yo'q. Aloqa tugmasi ATAYIN qoldirildi — odam qiziqsa
                  admin bilan bog'lanib navbatga yozila oladi. */}
              {enrollmentClosed && notEnrolledYet && (
                <>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px', borderRadius:12, background:'#fffbeb', border:'1.5px solid #fde68a', marginBottom:14 }}>
                    <Clock size={18} style={{ color:'#b45309', flexShrink:0, marginTop:1 }} />
                    <div>
                      <p style={{ fontSize:13, color:'#b45309', fontWeight:700, marginBottom:3 }}>
                        {enrollment_.allFull ? t('pages.courseDetail.seatsFull') : t('pages.courseDetail.enrollmentClosed')}
                      </p>
                      <p style={{ fontSize:12, color:'#a16207', lineHeight:1.6 }}>
                        {enrollment_.allFull ? t('pages.courseDetail.seatsFullInfo') : t('pages.courseDetail.enrollmentClosedInfo')}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setRequestFormat(defaultRequestFormat)}
                    className="btn-primary" style={{ width:'100%', justifyContent:'center' }}>
                    <MessageCircle size={15}/> {t('pages.courseDetail.notifyMe')}
                  </button>
                </>
              )}

              {!enrollmentClosed && !user && (
                <>
                  <p style={{ fontSize:13, color:'#64748b', marginBottom:14, lineHeight:1.7 }}>
                    {isOfflineOnly
                      ? t('pages.courseDetail.offlinePrompt')
                      : selfEnrollAllowed ? t('pages.courseDetail.loginPrompt') : t('pages.courseDetail.requestPrompt')}
                  </p>
                  {seatsNotice}
                  {/* Offline kursda ham, pullik kursda ham yozilish admin orqali —
                      so'rov formasi login talab qilmaydi, shuning uchun mehmonni
                      faqat bepul kursda login sahifasiga yuboramiz */}
                  {!isOfflineOnly && selfEnrollAllowed && (
                    <Link to="/login" state={{ from: `/courses/${slug}` }}>
                      <button className="btn-primary" style={{ width:'100%', justifyContent:'center', marginBottom:10 }}>
                        {t('pages.courseDetail.loginAndEnroll')} <ArrowRight size={15}/>
                      </button>
                    </Link>
                  )}
                  <button onClick={() => setRequestFormat(defaultRequestFormat)}
                    className={isOfflineOnly || !selfEnrollAllowed ? 'btn-primary' : 'btn-outline'} style={{ width:'100%', justifyContent:'center' }}>
                    <MessageCircle size={15}/> {selfEnrollAllowed ? t('pages.courseDetail.contactAdmin') : t('pages.courseDetail.requestEnroll')}
                  </button>
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
              {!enrollmentClosed && user && (enrollStatus === 'idle' || enrollStatus === 'loading' || enrollStatus === 'error') && (
                <>
                  {enrollStatus === 'error' && (
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:12, background:'#fef2f2', border:'1.5px solid #fecaca', marginBottom:14 }}>
                      <AlertCircle size={16} style={{ color:'#dc2626', flexShrink:0 }} />
                      <p style={{ fontSize:13, color:'#dc2626' }}>{enrollError}</p>
                    </div>
                  )}
                  <p style={{ fontSize:13, color:'#64748b', marginBottom:14, lineHeight:1.7 }}>
                    {isOfflineOnly
                      ? t('pages.courseDetail.offlinePrompt')
                      : course.isFree ? t('pages.courseDetail.freePrompt') : t('pages.courseDetail.paidPrompt')}
                  </p>
                  {seatsNotice}
                  {/* Offline guruhga o'zicha yozilib bo'lmaydi — joy va jadval admin bilan kelishiladi */}
                  {!isOfflineOnly && enrollment_.onlineOpen && selfEnrollAllowed && (
                    <button onClick={enroll} disabled={enrollStatus === 'loading'} className="btn-primary"
                      style={{ width:'100%', justifyContent:'center', marginBottom:10, opacity: enrollStatus === 'loading' ? 0.7 : 1 }}>
                      {enrollStatus === 'loading'
                        ? t('common.sending')
                        : <>{isHybrid ? t('pages.courseDetail.enrollOnline') : t('pages.courseDetail.enroll')} <ArrowRight size={15}/></>}
                    </button>
                  )}
                  {/* Pullik kursda "yozilish" = adminga so'rov: to'lov va joy u orqali */}
                  {!isOfflineOnly && enrollment_.onlineOpen && !selfEnrollAllowed && (
                    <button onClick={() => setRequestFormat('ONLINE')} className="btn-primary"
                      style={{ width:'100%', justifyContent:'center', marginBottom:10 }}>
                      {isHybrid ? t('pages.courseDetail.requestOnline') : t('pages.courseDetail.requestEnroll')} <ArrowRight size={15}/>
                    </button>
                  )}
                  {/* Gibrid kursda bitta yo'l yopilgan bo'lsa, qaysi biri
                      ekanini aytamiz — aks holda tugma sababsiz yo'qolgandek
                      ko'rinardi. Ikkinchi yo'l ochiqligicha qolaveradi. */}
                  {!isOfflineOnly && !enrollment_.onlineOpen && (
                    <div style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 12px', borderRadius:10, background:'#fffbeb', border:'1px solid #fde68a', marginBottom:10 }}>
                      <Clock size={15} style={{ color:'#b45309', flexShrink:0 }} />
                      <p style={{ fontSize:12.5, color:'#b45309', fontWeight:600 }}>
                        {enrollment_.onlineFull ? t('pages.courseDetail.onlineFull') : t('pages.courseDetail.onlineClosed')}
                      </p>
                    </div>
                  )}
                  {isHybrid && !enrollment_.offlineOpen && (
                    <div style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 12px', borderRadius:10, background:'#fffbeb', border:'1px solid #fde68a', marginBottom:10 }}>
                      <Clock size={15} style={{ color:'#b45309', flexShrink:0 }} />
                      <p style={{ fontSize:12.5, color:'#b45309', fontWeight:600 }}>
                        {enrollment_.offlineFull ? t('pages.courseDetail.offlineFull') : t('pages.courseDetail.offlineClosed')}
                      </p>
                    </div>
                  )}
                  <button onClick={() => setRequestFormat(defaultRequestFormat)}
                    className={isOfflineOnly || !enrollment_.onlineOpen ? 'btn-primary' : 'btn-outline'} style={{ width:'100%', justifyContent:'center' }}>
                    <MessageCircle size={15}/> {isOfflineOnly || isHybrid ? t('pages.courseDetail.contactOffline') : t('pages.courseDetail.contactAdmin')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {requestFormat && (
        <CourseRequestModal
          courseId={String(course.id)}
          courseTitle={course.title}
          courseFormat={course.format ?? 'ONLINE'}
          initialFormat={requestFormat}
          onClose={() => setRequestFormat(null)}
        />
      )}

      <style>{`@media(max-width:800px){.detail-grid{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
}
