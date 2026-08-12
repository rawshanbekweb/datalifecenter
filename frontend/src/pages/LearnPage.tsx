import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, PlayCircle, FileText, HelpCircle, ClipboardList, ChevronDown, ChevronLeft, ChevronRight, Clock, CheckCircle, List, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCourseLearn } from '../api/courses';
import { completeLesson, uncompleteLesson } from '../api/progress';
import ComingSoon from '../components/common/ComingSoon';
import { useToast } from '../components/common/Feedback';
import LessonContent from '../components/common/LessonContent';
import LessonVideo from '../components/common/LessonVideo';
import LessonQA from '../components/questions/LessonQA';
import Loading from '../components/common/Loading';

interface LearnLesson {
  id: string;
  title: string;
  contentType: 'VIDEO' | 'TEXT' | 'QUIZ' | 'ASSIGNMENT';
  videoUrl?: string | null;
  content?: string | null;
  durationMinutes?: number | null;
}

interface LearnModule {
  id: string;
  title: string;
  description?: string | null;
  lessons: LearnLesson[];
}

interface LearnCourse {
  id: string;
  slug: string;
  title: string;
  color: string;
  bg: string;
  border: string;
  modules: LearnModule[];
  /** Kursning mentorlari — asosiysi birinchi */
  mentors?: { id: string; name: string; specialty?: string }[];
}

const TYPE_ICONS: Record<LearnLesson['contentType'], React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>> = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardList,
};

export default function LearnPage(): React.ReactElement {
  const { t } = useTranslation();
  const toast = useToast();
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse]           = useState<LearnCourse | null>(null);
  const [status, setStatus]           = useState<'loading' | 'ready' | 'forbidden' | 'not-found' | 'error'>('loading');
  const [errorMsg, setErrorMsg]       = useState<string>('');
  const [activeLessonId, setActiveLessonId] = useState<string>('');
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [hasEnrollment, setHasEnrollment] = useState<boolean>(false);
  const [courseCompleted, setCourseCompleted] = useState<boolean>(false);
  const [marking, setMarking]         = useState<boolean>(false);
  // Telefonda dars ro'yxati yopiq turadi (aks holda kontentgacha butun
  // dasturni aylantirib o'tishga to'g'ri kelardi)
  const [navOpen, setNavOpen]         = useState<boolean>(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    getCourseLearn(slug!)
      .then((data: { course: LearnCourse; enrollment: { status: string } | null; completedLessonIds: string[] }) => {
        if (cancelled) return;
        setCourse(data.course);
        setCompletedIds(data.completedLessonIds || []);
        setHasEnrollment(!!data.enrollment);
        setCourseCompleted(data.enrollment?.status === 'COMPLETED');
        const firstModule = data.course.modules[0];
        if (firstModule) {
          setOpenModules({ [firstModule.id]: true });
          // Birinchi tugallanmagan darsdan davom etamiz
          const firstIncomplete = data.course.modules
            .flatMap((m) => m.lessons)
            .find((l) => !(data.completedLessonIds || []).includes(l.id));
          const startLesson = firstIncomplete || firstModule.lessons[0];
          if (startLesson) {
            setActiveLessonId(startLesson.id);
            const parentModule = data.course.modules.find((m) => m.lessons.some((l) => l.id === startLesson.id));
            if (parentModule) setOpenModules({ [parentModule.id]: true });
          }
        }
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err.message || '');
        if (err.status === 403) setStatus('forbidden');
        else if (err.status === 404) setStatus('not-found');
        else setStatus('error');
      });
    return () => { cancelled = true; };
  }, [slug]);

  // Modullar bo'ylab tekislangan dars ketma-ketligi — "oldingi/keyingi" va
  // "N / M" hisoblagichi shu ro'yxatga tayanadi
  const flatLessons = useMemo(
    (): { lesson: LearnLesson; moduleId: string }[] =>
      course ? course.modules.flatMap((m) => m.lessons.map((lesson) => ({ lesson, moduleId: m.id }))) : [],
    [course]
  );

  const activeIndex = flatLessons.findIndex((x) => x.lesson.id === activeLessonId);
  const activeLesson = activeIndex >= 0 ? flatLessons[activeIndex].lesson : null;

  // Darsni almashtiradi: kerakli modulni ochadi, telefonda ro'yxatni yopib
  // kontentga qaytaradi (aks holda foydalanuvchi ro'yxatda qolib ketardi)
  const goToLesson = (index: number): void => {
    const target = flatLessons[index];
    if (!target) return;
    setActiveLessonId(target.lesson.id);
    setOpenModules((prev) => ({ ...prev, [target.moduleId]: true }));
    setNavOpen(false);
    if (window.innerWidth <= 900) {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const goToLessonId = (id: string): void => goToLesson(flatLessons.findIndex((x) => x.lesson.id === id));

  if (status === 'loading') {
    return <section style={{ padding:'200px 24px 80px' }}><Loading page /></section>;
  }
  if (status === 'forbidden') {
    return (
      <section style={{ padding:'200px 24px 120px', textAlign:'center' }}>
        <h1 style={{ fontFamily:'var(--font-sans)', fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:10 }}>{t('student.learn.forbiddenTitle')}</h1>
        <p style={{ fontSize:14, color:'#64748b', marginBottom:24 }}>{errorMsg || t('student.learn.forbiddenSub')}</p>
        <Link to={`/courses/${slug}`}>
          <button className="btn-primary">{t('student.learn.toCourse')}</button>
        </Link>
      </section>
    );
  }
  if (status === 'not-found' || (status === 'ready' && !course)) {
    return <ComingSoon title={t('pages.courseDetail.notFoundTitle')} sub={t('pages.courseDetail.notFoundSub')} />;
  }
  if (status === 'error' || !course) {
    return <ComingSoon title={t('common.error')} sub={t('pages.courseDetail.errorSub')} />;
  }

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedCount = completedIds.length;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isActiveCompleted = activeLesson ? completedIds.includes(activeLesson.id) : false;

  // Belgi darhol o'zgaradi (optimistik) — tarmoq javobini kutib turish
  // darsdan darsga o'tishni sekinlashtirardi. Xato bo'lsa belgi qaytariladi.
  const setCompleted = async (lessonId: string, completed: boolean, advance: boolean): Promise<void> => {
    if (marking) return;
    setMarking(true);
    setCompletedIds((prev) => (completed ? [...prev, lessonId] : prev.filter((id) => id !== lessonId)));

    const from = flatLessons.findIndex((x) => x.lesson.id === lessonId);
    if (advance && from >= 0 && from < flatLessons.length - 1) {
      goToLesson(from + 1);
    }

    try {
      const summary = completed ? await completeLesson(lessonId) : await uncompleteLesson(lessonId);
      setCourseCompleted(summary.courseCompleted);
    } catch (err: unknown) {
      setCompletedIds((prev) => (completed ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]));
      toast.error((err as Error).message || t('common.error'));
    } finally {
      setMarking(false);
    }
  };

  // Tugmani bosish: yakunlagach o'zi keyingi darsga o'tadi, belgini olib
  // tashlaganda esa joyida qoladi
  const toggleComplete = (): void => {
    if (!activeLesson) return;
    void setCompleted(activeLesson.id, !isActiveCompleted, !isActiveCompleted);
  };

  // Video oxirigacha ko'rildi — darsni o'zi yakunlangan deb belgilaydi, lekin
  // keyingi darsga o'tkazmaydi (video tugashi bilan sahifa sakrashi bezovta qiladi)
  const handleVideoEnded = (): void => {
    if (!activeLesson || !hasEnrollment || isActiveCompleted) return;
    void setCompleted(activeLesson.id, true, false);
  };

  return (
    <section style={{ padding:'130px 0 104px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', marginBottom:14 }}>
          <Link to="/student" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'#64748b', textDecoration:'none' }}>
            <ArrowLeft size={14}/> {t('cabinet.cabinet')}
          </Link>
          <h1 style={{ fontFamily:'var(--font-sans)', fontSize:'clamp(18px,2.4vw,24px)', fontWeight:800, color:'#0f172a', flex:1, minWidth:200 }}>
            {course.title}
          </h1>
          {course.mentors?.map((mentor) => (
            <span key={mentor.id} className="tag" style={{ borderColor:course.border, color:course.color, fontWeight:700 }}>
              {mentor.name}
            </span>
          ))}
        </div>

        {totalLessons > 0 && hasEnrollment && (
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <div style={{ flex:1, height:8, borderRadius:99, background:'#e2e8f0', overflow:'hidden' }}>
              <div style={{ width:`${progressPct}%`, height:'100%', borderRadius:99, background: courseCompleted ? '#16a34a' : course.color, transition:'width 0.3s' }} />
            </div>
            <span style={{ fontSize:12.5, fontWeight:700, color:'#475569', flexShrink:0 }}>{t('student.dashboard.lessonsCount', { done: completedCount, total: totalLessons })} · {progressPct}%</span>
          </div>
        )}

        {courseCompleted && (
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', borderRadius:14, background:'#f0fdf4', border:'1.5px solid #bbf7d0', marginBottom:20 }}>
            <Trophy size={20} style={{ color:'#16a34a', flexShrink:0 }} />
            <p style={{ fontSize:13.5, color:'#16a34a', fontWeight:700 }}>{t('student.learn.congrats')}</p>
          </div>
        )}

        {course.modules.length === 0 && (
          <div className="card" style={{ padding:40, textAlign:'center' }}>
            <p style={{ color:'#64748b', fontSize:14 }}>{t('student.learn.noLessons')}</p>
          </div>
        )}

        {course.modules.length > 0 && (
          <>
          {/* Telefonda ro'yxatni ochadigan tugma — kompyuterda CSS bilan yashiriladi */}
          <button type="button" className="learn-nav-toggle" onClick={() => setNavOpen((v) => !v)}
            style={{ alignItems:'center', gap:8, width:'100%', padding:'11px 14px', marginBottom:12, borderRadius:12, background:'#fff', border:'1.5px solid #e2e8f0', cursor:'pointer', fontSize:13, fontWeight:700, color:'#0f172a' }}>
            <List size={15} style={{ color:course.color, flexShrink:0 }}/>
            <span style={{ flex:1, textAlign:'left' }}>{t('student.learn.lessonsList')}</span>
            {activeIndex >= 0 && (
              <span style={{ fontSize:12, fontWeight:700, color:'#94a3b8' }}>{activeIndex + 1} / {flatLessons.length}</span>
            )}
            {navOpen ? <ChevronDown size={14} style={{ color:'#94a3b8' }}/> : <ChevronRight size={14} style={{ color:'#94a3b8' }}/>}
          </button>

          <div className="learn-grid" style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:20, alignItems:'start' }}>
            {/* Dars ro'yxati — uzun dasturda o'z ichida aylanadi, sahifani cho'zmaydi */}
            <div className="card learn-nav" data-open={navOpen ? 'true' : 'false'}
              style={{ padding:12, position:'sticky', top:100, maxHeight:'calc(100vh - 130px)', overflowY:'auto' }}>
              {course.modules.map((mod, mi) => {
                const open = !!openModules[mod.id];
                return (
                  <div key={mod.id}>
                    <button onClick={() => setOpenModules((prev) => ({ ...prev, [mod.id]: !open }))}
                      style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'10px 10px', background:'transparent', border:'none', cursor:'pointer', textAlign:'left' }}>
                      {open ? <ChevronDown size={14} style={{ color:'#94a3b8', flexShrink:0 }}/> : <ChevronRight size={14} style={{ color:'#94a3b8', flexShrink:0 }}/>}
                      <span style={{ fontSize:13, fontWeight:800, color:'#0f172a', flex:1 }}>
                        <span style={{ color:course.color, fontFamily:'var(--font-mono)', marginRight:6 }}>{String(mi + 1).padStart(2, '0')}</span>
                        {mod.title}
                      </span>
                      <span style={{ fontSize:11, color:'#94a3b8', flexShrink:0 }}>{mod.lessons.length}</span>
                    </button>
                    {open && mod.lessons.map((lesson) => {
                      const TypeIcon = TYPE_ICONS[lesson.contentType] || PlayCircle;
                      const active = lesson.id === activeLessonId;
                      const done = completedIds.includes(lesson.id);
                      return (
                        <button key={lesson.id} onClick={() => goToLessonId(lesson.id)}
                          style={{
                            display:'flex', alignItems:'center', gap:9, width:'100%', padding:'9px 10px 9px 30px',
                            borderRadius:10, border:'none', cursor:'pointer', textAlign:'left',
                            background: active ? course.bg : 'transparent',
                          }}>
                          {done
                            ? <CheckCircle size={14} style={{ color:'#16a34a' }} />
                            : <TypeIcon size={14} style={{ color: active ? course.color : '#94a3b8' }} />}
                          <span style={{ flex:1, fontSize:12.5, fontWeight: active ? 700 : 500, color: active ? '#0f172a' : done ? '#94a3b8' : '#64748b', textDecoration: done ? 'line-through' : 'none' }}>{lesson.title}</span>
                          {lesson.durationMinutes ? <span style={{ fontSize:10.5, color:'#94a3b8', flexShrink:0 }}>{lesson.durationMinutes}'</span> : null}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Dars kontenti */}
            <div className="card" ref={contentRef} style={{ padding:24, minHeight:400, scrollMarginTop:100 }}>
              {!activeLesson && <p style={{ color:'#94a3b8', fontSize:14 }}>{t('student.learn.selectLesson')}</p>}
              {activeLesson && (
                <div>
                  <h2 style={{ fontFamily:'var(--font-sans)', fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:6 }}>{activeLesson.title}</h2>
                  <p style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#94a3b8', marginBottom:18 }}>
                    <Clock size={12}/> {activeLesson.durationMinutes ? t('pages.blogDetail.readMinutes', { n: activeLesson.durationMinutes }) : t('student.learn.noDuration')}
                  </p>

                  {activeLesson.contentType === 'VIDEO' && activeLesson.videoUrl && (
                    <LessonVideo url={activeLesson.videoUrl} title={activeLesson.title} onEnded={handleVideoEnded} />
                  )}
                  {activeLesson.contentType === 'VIDEO' && !activeLesson.videoUrl && (
                    <div style={{ padding:'40px 20px', borderRadius:14, background:'#f8fafc', border:'1.5px dashed #cbd5e1', textAlign:'center', marginBottom:18 }}>
                      <PlayCircle size={28} style={{ color:'#94a3b8', margin:'0 auto 10px' }} />
                      <p style={{ fontSize:13, color:'#64748b' }}>{t('student.learn.noVideo')}</p>
                    </div>
                  )}

                  {activeLesson.content && (
                    <LessonContent text={activeLesson.content} />
                  )}
                  {!activeLesson.content && activeLesson.contentType !== 'VIDEO' && (
                    <p style={{ fontSize:13, color:'#94a3b8' }}>{t('student.learn.noContent')}</p>
                  )}

                  {hasEnrollment && (
                    <div style={{ marginTop:24, paddingTop:18, borderTop:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                      {isActiveCompleted ? (
                        <>
                          <span style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, fontWeight:700, color:'#16a34a' }}>
                            <CheckCircle size={16}/> {t('student.learn.lessonDone')}
                          </span>
                          <button onClick={toggleComplete} disabled={marking} className="btn-outline"
                            style={{ fontSize:12, padding:'8px 14px', opacity: marking ? 0.6 : 1 }}>
                            {t('student.learn.unmark')}
                          </button>
                        </>
                      ) : (
                        <button onClick={toggleComplete} disabled={marking} className="btn-primary"
                          style={{ fontSize:13, opacity: marking ? 0.6 : 1 }}>
                          <CheckCircle size={15}/> {marking ? t('common.saving') : t('student.learn.markDone')}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Oldingi/keyingi — ilgari har safar yon ro'yxatdan qidirishga to'g'ri kelardi */}
                  {flatLessons.length > 1 && (
                    <div style={{ marginTop:16, display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                      <button type="button" className="btn-outline" disabled={activeIndex <= 0}
                        onClick={() => goToLesson(activeIndex - 1)}
                        style={{ fontSize:12.5, padding:'9px 14px', opacity: activeIndex <= 0 ? 0.45 : 1 }}>
                        <ChevronLeft size={14}/> {t('student.learn.prev')}
                      </button>
                      <span style={{ fontSize:12, color:'#94a3b8', fontFamily:'var(--font-mono)' }}>
                        {activeIndex + 1} / {flatLessons.length}
                      </span>
                      <button type="button" className="btn-outline" disabled={activeIndex < 0 || activeIndex >= flatLessons.length - 1}
                        onClick={() => goToLesson(activeIndex + 1)}
                        style={{ marginLeft:'auto', fontSize:12.5, padding:'9px 14px', opacity: activeIndex >= flatLessons.length - 1 ? 0.45 : 1 }}>
                        {t('student.learn.next')} <ChevronRight size={14}/>
                      </button>
                    </div>
                  )}

                  {hasEnrollment && <LessonQA lessonId={activeLesson.id} accentColor={course.color} />}
                </div>
              )}
            </div>
          </div>
          </>
        )}
      </div>
      <style>{`
        .learn-nav-toggle{display:none}
        @media(max-width:900px){
          .learn-grid{grid-template-columns:1fr!important}
          .learn-nav{position:static!important;max-height:none!important;overflow:visible!important}
          .learn-nav[data-open="false"]{display:none}
          .learn-nav-toggle{display:flex}
        }
      `}</style>
    </section>
  );
}
