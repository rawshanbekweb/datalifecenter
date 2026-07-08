import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, PlayCircle, FileText, HelpCircle, ClipboardList, ChevronDown, ChevronRight, Clock, CheckCircle, Trophy } from 'lucide-react';
import { getCourseLearn } from '../api/courses';
import { completeLesson, uncompleteLesson } from '../api/progress';
import ComingSoon from '../components/common/ComingSoon';
import LessonQA from '../components/questions/LessonQA';

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
  mentor?: { name: string; specialty?: string } | null;
}

const TYPE_ICONS: Record<LearnLesson['contentType'], React.ComponentType<{ size?: number | string; style?: React.CSSProperties }>> = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardList,
};

// To'g'ridan-to'g'ri video fayl (mp4/webm) — <video> tegi bilan ochiladi
function isDirectVideo(url: string): boolean {
  return /\.(mp4|webm)(\?|$)/i.test(url) || url.includes('/uploads/videos/');
}

// YouTube/Vimeo havolalarini embed ko'rinishiga o'giradi.
// Pullik kontent uchun tavsiya: YouTube'da "unlisted" video — havolasiz topilmaydi
// va to'g'ridan-to'g'ri yuklab olib bo'lmaydi.
function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) {
      // watch?v=ID, shorts/ID, live/ID, embed/ID — hammasi qo'llab-quvvatlanadi
      const id =
        u.searchParams.get('v') ||
        u.pathname.match(/^\/(?:shorts|live|embed)\/([\w-]{6,})/)?.[1];
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    if (u.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed${u.pathname}`;
    }
    if (u.hostname.includes('vimeo.com') && !u.hostname.includes('player.')) {
      const id = u.pathname.match(/\/(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : url;
    }
    return url;
  } catch {
    return null;
  }
}

export default function LearnPage(): React.ReactElement {
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

  const activeLesson = useMemo((): LearnLesson | null => {
    if (!course) return null;
    for (const mod of course.modules) {
      const found = mod.lessons.find((l) => l.id === activeLessonId);
      if (found) return found;
    }
    return null;
  }, [course, activeLessonId]);

  if (status === 'loading') {
    return <section style={{ padding:'200px 24px 80px', textAlign:'center', color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</section>;
  }
  if (status === 'forbidden') {
    return (
      <section style={{ padding:'200px 24px 120px', textAlign:'center' }}>
        <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:24, fontWeight:800, color:'#0f172a', marginBottom:10 }}>Kirish yopiq</h1>
        <p style={{ fontSize:14, color:'#64748b', marginBottom:24 }}>{errorMsg || "Bu kursni ko'rish uchun avval yozilishingiz kerak."}</p>
        <Link to={`/courses/${slug}`}>
          <button className="btn-primary">Kurs sahifasiga o'tish</button>
        </Link>
      </section>
    );
  }
  if (status === 'not-found' || (status === 'ready' && !course)) {
    return <ComingSoon title="Kurs topilmadi" sub="Siz qidirgan kurs mavjud emas yoki o'chirilgan." />;
  }
  if (status === 'error' || !course) {
    return <ComingSoon title="Xatolik yuz berdi" sub="Kursni yuklab bo'lmadi. Backend ishga tushirilganini tekshiring." />;
  }

  const embedUrl = activeLesson?.videoUrl ? toEmbedUrl(activeLesson.videoUrl) : null;
  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedCount = completedIds.length;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isActiveCompleted = activeLesson ? completedIds.includes(activeLesson.id) : false;

  const toggleComplete = async (): Promise<void> => {
    if (!activeLesson || marking) return;
    setMarking(true);
    try {
      const summary = isActiveCompleted
        ? await uncompleteLesson(activeLesson.id)
        : await completeLesson(activeLesson.id);
      setCompletedIds((prev) =>
        isActiveCompleted ? prev.filter((id) => id !== activeLesson.id) : [...prev, activeLesson.id]
      );
      setCourseCompleted(summary.courseCompleted);
    } catch (err: unknown) {
      alert((err as Error).message || 'Xatolik yuz berdi');
    } finally {
      setMarking(false);
    }
  };

  return (
    <section style={{ padding:'130px 0 104px' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', marginBottom:14 }}>
          <Link to="/student" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:13, color:'#64748b', textDecoration:'none' }}>
            <ArrowLeft size={14}/> Kabinet
          </Link>
          <h1 style={{ fontFamily:'Outfit,sans-serif', fontSize:'clamp(18px,2.4vw,24px)', fontWeight:800, color:'#0f172a', flex:1, minWidth:200 }}>
            {course.title}
          </h1>
          {course.mentor && <span className="tag" style={{ borderColor:course.border, color:course.color, fontWeight:700 }}>Mentor: {course.mentor.name}</span>}
        </div>

        {totalLessons > 0 && hasEnrollment && (
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <div style={{ flex:1, height:8, borderRadius:99, background:'#e2e8f0', overflow:'hidden' }}>
              <div style={{ width:`${progressPct}%`, height:'100%', borderRadius:99, background: courseCompleted ? '#16a34a' : course.color, transition:'width 0.3s' }} />
            </div>
            <span style={{ fontSize:12.5, fontWeight:700, color:'#475569', flexShrink:0 }}>{completedCount}/{totalLessons} dars · {progressPct}%</span>
          </div>
        )}

        {courseCompleted && (
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', borderRadius:14, background:'#f0fdf4', border:'1.5px solid #bbf7d0', marginBottom:20 }}>
            <Trophy size={20} style={{ color:'#16a34a', flexShrink:0 }} />
            <p style={{ fontSize:13.5, color:'#16a34a', fontWeight:700 }}>Tabriklaymiz! Siz bu kursni to'liq yakunladingiz. 🎉</p>
          </div>
        )}

        {course.modules.length === 0 && (
          <div className="card" style={{ padding:40, textAlign:'center' }}>
            <p style={{ color:'#64748b', fontSize:14 }}>Bu kursga hali darslar qo'shilmagan. Tez orada kontent paydo bo'ladi.</p>
          </div>
        )}

        {course.modules.length > 0 && (
          <div className="learn-grid" style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:20, alignItems:'start' }}>
            {/* Dars ro'yxati */}
            <div className="card" style={{ padding:12, position:'sticky', top:100 }}>
              {course.modules.map((mod, mi) => {
                const open = !!openModules[mod.id];
                return (
                  <div key={mod.id}>
                    <button onClick={() => setOpenModules((prev) => ({ ...prev, [mod.id]: !open }))}
                      style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'10px 10px', background:'transparent', border:'none', cursor:'pointer', textAlign:'left' }}>
                      {open ? <ChevronDown size={14} style={{ color:'#94a3b8', flexShrink:0 }}/> : <ChevronRight size={14} style={{ color:'#94a3b8', flexShrink:0 }}/>}
                      <span style={{ fontSize:13, fontWeight:800, color:'#0f172a', flex:1 }}>
                        <span style={{ color:course.color, fontFamily:'JetBrains Mono,monospace', marginRight:6 }}>{String(mi + 1).padStart(2, '0')}</span>
                        {mod.title}
                      </span>
                      <span style={{ fontSize:11, color:'#94a3b8', flexShrink:0 }}>{mod.lessons.length}</span>
                    </button>
                    {open && mod.lessons.map((lesson) => {
                      const TypeIcon = TYPE_ICONS[lesson.contentType] || PlayCircle;
                      const active = lesson.id === activeLessonId;
                      const done = completedIds.includes(lesson.id);
                      return (
                        <button key={lesson.id} onClick={() => setActiveLessonId(lesson.id)}
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
            <div className="card" style={{ padding:24, minHeight:400 }}>
              {!activeLesson && <p style={{ color:'#94a3b8', fontSize:14 }}>Darsni tanlang.</p>}
              {activeLesson && (
                <div>
                  <h2 style={{ fontFamily:'Outfit,sans-serif', fontSize:20, fontWeight:800, color:'#0f172a', marginBottom:6 }}>{activeLesson.title}</h2>
                  <p style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#94a3b8', marginBottom:18 }}>
                    <Clock size={12}/> {activeLesson.durationMinutes ? `${activeLesson.durationMinutes} daqiqa` : 'Davomiylik ko\'rsatilmagan'}
                  </p>

                  {activeLesson.contentType === 'VIDEO' && embedUrl && isDirectVideo(embedUrl) && (
                    <div style={{ borderRadius:14, overflow:'hidden', background:'#0f172a', marginBottom:18 }}>
                      <video src={embedUrl} controls controlsList="nodownload" playsInline
                        style={{ display:'block', width:'100%', maxHeight:480 }} />
                    </div>
                  )}
                  {activeLesson.contentType === 'VIDEO' && embedUrl && !isDirectVideo(embedUrl) && (
                    <div style={{ position:'relative', paddingTop:'56.25%', borderRadius:14, overflow:'hidden', background:'#0f172a', marginBottom:18 }}>
                      <iframe src={embedUrl} title={activeLesson.title} allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }} />
                    </div>
                  )}
                  {activeLesson.contentType === 'VIDEO' && !embedUrl && (
                    <div style={{ padding:'40px 20px', borderRadius:14, background:'#f8fafc', border:'1.5px dashed #cbd5e1', textAlign:'center', marginBottom:18 }}>
                      <PlayCircle size={28} style={{ color:'#94a3b8', margin:'0 auto 10px' }} />
                      <p style={{ fontSize:13, color:'#64748b' }}>Bu dars uchun video hali yuklanmagan.</p>
                    </div>
                  )}

                  {activeLesson.content && (
                    <div style={{ fontSize:14, color:'#334155', lineHeight:1.9, whiteSpace:'pre-wrap' }}>{activeLesson.content}</div>
                  )}
                  {!activeLesson.content && activeLesson.contentType !== 'VIDEO' && (
                    <p style={{ fontSize:13, color:'#94a3b8' }}>Bu dars uchun kontent hali qo'shilmagan.</p>
                  )}

                  {hasEnrollment && (
                    <div style={{ marginTop:24, paddingTop:18, borderTop:'1px solid #f1f5f9', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                      {isActiveCompleted ? (
                        <>
                          <span style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, fontWeight:700, color:'#16a34a' }}>
                            <CheckCircle size={16}/> Dars yakunlangan
                          </span>
                          <button onClick={toggleComplete} disabled={marking} className="btn-outline"
                            style={{ fontSize:12, padding:'8px 14px', opacity: marking ? 0.6 : 1 }}>
                            Belgini olib tashlash
                          </button>
                        </>
                      ) : (
                        <button onClick={toggleComplete} disabled={marking} className="btn-primary"
                          style={{ fontSize:13, opacity: marking ? 0.6 : 1 }}>
                          <CheckCircle size={15}/> {marking ? 'Saqlanmoqda...' : 'Darsni yakunladim'}
                        </button>
                      )}
                    </div>
                  )}

                  {hasEnrollment && <LessonQA lessonId={activeLesson.id} accentColor={course.color} />}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <style>{`@media(max-width:900px){.learn-grid{grid-template-columns:1fr!important}.learn-grid>.card:first-child{position:static!important}}`}</style>
    </section>
  );
}
