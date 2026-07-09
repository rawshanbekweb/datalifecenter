import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Award, BookOpen, CheckCircle2, Clock, CreditCard, Hourglass, PlayCircle, Settings, TrendingUp, AlertTriangle, Star, MessageSquare, Wallet } from 'lucide-react';
import { downloadCertificate, getMyEnrollments, mockPayEnrollment, submitReceipt } from '../api/enrollments';
import { getMyCourseReview, submitCourseReview } from '../api/reviews';
import { getPaymentConfig, createCheckout, PaymentConfig } from '../api/payments';
import { resolveIcon } from '../utils/iconMap';
import { useAuth } from '../hooks/useAuth';
import UpcomingSessionsPanel from '../components/sessions/UpcomingSessionsPanel';
import FileUpload from '../components/common/FileUpload';
import { PAYMENT_INFO } from '../config/payment';

interface CourseInfo {
  iconKey: string;
  slug: string;
  title: string;
  bg: string;
  border: string;
  color: string;
  isFree?: boolean;
  price?: string | number | null;
  currency?: string;
}

interface Enrollment {
  id: string;
  course: CourseInfo;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: string;
  rejectionReason?: string | null;
  hasReceipt?: boolean;
  enrolledAt: string;
  progress?: { totalLessons: number; completedLessons: number };
}

interface StatusLabel {
  label: string;
  color: string;
  bg: string;
  border: string;
}

const STATUS_LABELS: Record<string, StatusLabel> = {
  PENDING:   { label: 'Kutilmoqda',     color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  ACTIVE:    { label: 'Faol',           color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  COMPLETED: { label: 'Yakunlangan',    color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
  CANCELLED: { label: 'Bekor qilingan', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

interface EnrollmentRowProps {
  enrollment: Enrollment;
  onPaid: (paid: Enrollment) => void;
  paymentConfig: PaymentConfig;
}

function EnrollmentRow({ enrollment, onPaid, paymentConfig }: EnrollmentRowProps): React.ReactElement {
  const [payStatus, setPayStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [payOpen, setPayOpen]     = useState<boolean>(false);
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [receiptState, setReceiptState] = useState<'idle' | 'sending' | 'error'>('idle');
  const [certState, setCertState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [gatewayLoading, setGatewayLoading] = useState<'click' | 'payme' | ''>('');
  const [gatewayError, setGatewayError] = useState<string>('');
  const Icon = resolveIcon(enrollment.course.iconKey);
  const s = STATUS_LABELS[enrollment.status];

  const paymentRejected = enrollment.paymentStatus === 'REJECTED';
  const awaitingPayment = enrollment.status === 'PENDING' && (enrollment.paymentStatus === 'UNPAID' || paymentRejected);
  const receiptSent     = enrollment.paymentStatus === 'PENDING';

  const simulatePayment = async () => {
    setPayStatus('loading');
    try {
      const paid = await mockPayEnrollment(enrollment.id);
      onPaid(paid);
    } catch {
      setPayStatus('error');
    }
  };

  const payWithGateway = async (provider: 'click' | 'payme') => {
    setGatewayLoading(provider);
    setGatewayError('');
    try {
      const { url } = await createCheckout({ kind: 'enrollment', enrollmentId: enrollment.id }, provider);
      window.location.href = url;
    } catch (err: unknown) {
      setGatewayError((err as Error).message || 'Xatolik yuz berdi');
      setGatewayLoading('');
    }
  };

  const sendReceipt = async () => {
    if (!receiptUrl.trim()) return;
    setReceiptState('sending');
    try {
      const updated = await submitReceipt(enrollment.id, receiptUrl.trim());
      setPayOpen(false);
      onPaid(updated);
    } catch {
      setReceiptState('error');
    }
  };

  const [reviewOpen, setReviewOpen]   = useState<boolean>(false);
  const [myReview, setMyReview]       = useState<{ rating: number; comment: string } | null>(null);
  const [reviewForm, setReviewForm]   = useState<{ rating: number; comment: string }>({ rating: 5, comment: '' });
  const [reviewState, setReviewState] = useState<'idle' | 'saving' | 'error'>('idle');

  useEffect(() => {
    if (enrollment.status !== 'COMPLETED') return;
    let cancelled = false;
    getMyCourseReview(enrollment.course.slug)
      .then((review: { rating: number; comment: string } | null) => {
        if (cancelled || !review) return;
        setMyReview(review);
        setReviewForm({ rating: review.rating, comment: review.comment });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [enrollment.status, enrollment.course.slug]);

  const saveReview = async () => {
    if (!reviewForm.comment.trim()) return;
    setReviewState('saving');
    try {
      const saved = await submitCourseReview(enrollment.course.slug, reviewForm);
      setMyReview(saved);
      setReviewOpen(false);
      setReviewState('idle');
    } catch {
      setReviewState('error');
    }
  };

  const getCertificate = async () => {
    setCertState('loading');
    try {
      await downloadCertificate(enrollment.id);
      setCertState('idle');
    } catch {
      setCertState('error');
    }
  };

  return (
    <motion.div whileHover={{ x: 4 }} className="card"
      style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14, background: enrollment.course.bg, border: `1.5px solid ${enrollment.course.border}` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <Link to={`/courses/${enrollment.course.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0, textDecoration: 'none' }}>
        <div style={{ width: 48, height: 48, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: `1.5px solid ${enrollment.course.border}`, flexShrink: 0 }}>
          <Icon size={22} style={{ color: enrollment.course.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 3 }}>{enrollment.course.title}</p>
          <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#94a3b8' }}>
            <Clock size={12} /> Yozilgan sana: {new Date(enrollment.enrolledAt).toLocaleDateString('uz-UZ')}
          </p>
          {enrollment.progress && enrollment.progress.totalLessons > 0 && (enrollment.status === 'ACTIVE' || enrollment.status === 'COMPLETED') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
              <div style={{ flex: 1, maxWidth: 220, height: 6, borderRadius: 99, background: '#fff', border: `1px solid ${enrollment.course.border}`, overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.round((enrollment.progress.completedLessons / enrollment.progress.totalLessons) * 100)}%`,
                  height: '100%', borderRadius: 99,
                  background: enrollment.status === 'COMPLETED' ? '#16a34a' : enrollment.course.color,
                }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', flexShrink: 0 }}>
                {enrollment.progress.completedLessons}/{enrollment.progress.totalLessons} dars
              </span>
            </div>
          )}
        </div>
      </Link>
      {(enrollment.status === 'ACTIVE' || enrollment.status === 'COMPLETED') && (
        <Link to={`/learn/${enrollment.course.slug}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
          <button className="btn-primary" style={{ fontSize: 12, padding: '8px 14px' }}>
            <PlayCircle size={13} /> Davom etish
          </button>
        </Link>
      )}
      {enrollment.status === 'COMPLETED' && (
        <button onClick={getCertificate} disabled={certState === 'loading'} className="btn-outline"
          style={{ fontSize: 12, padding: '8px 14px', flexShrink: 0, opacity: certState === 'loading' ? 0.7 : 1 }}>
          <Award size={13} /> {certState === 'loading' ? 'Tayyorlanmoqda...' : 'Sertifikat'}
        </button>
      )}
      {enrollment.status === 'COMPLETED' && (
        <button onClick={() => setReviewOpen((v) => !v)} className="btn-outline"
          style={{ fontSize: 12, padding: '8px 14px', flexShrink: 0 }}>
          <MessageSquare size={13} /> {myReview ? 'Sharhni tahrirlash' : 'Sharh qoldirish'}
        </button>
      )}
      {awaitingPayment && (
        <button onClick={() => setPayOpen((v) => !v)} className="btn-primary"
          style={{ fontSize: 12, padding: '8px 14px', flexShrink: 0 }}>
          <CreditCard size={13} /> {paymentRejected ? 'Qayta yuborish' : "To'lov qilish"}
        </button>
      )}
      {import.meta.env.DEV && enrollment.paymentStatus === 'UNPAID' && (
        <button onClick={simulatePayment} disabled={payStatus === 'loading'} className="btn-outline"
          style={{ fontSize: 12, padding: '8px 14px', opacity: payStatus === 'loading' ? 0.7 : 1 }}>
          <CreditCard size={13} /> {payStatus === 'loading' ? '...' : "[DEV] To'lash"}
        </button>
      )}
      <span className="tag" style={{ background: s.bg, borderColor: s.border, color: s.color, fontWeight: 700, flexShrink: 0 }}>{s.label}</span>
    </div>

    {certState === 'error' && (
      <p style={{ fontSize: 12, color: '#dc2626' }}>Sertifikatni yuklab bo'lmadi. Qayta urinib ko'ring.</p>
    )}

    {receiptSent && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a' }}>
        <Hourglass size={14} style={{ color: '#d97706', flexShrink: 0 }} />
        <p style={{ fontSize: 12.5, fontWeight: 600, color: '#92400e' }}>
          Chek yuborildi — administrator tasdiqlashi bilan kurs ochiladi.
        </p>
      </div>
    )}

    {paymentRejected && (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}>
        <AlertTriangle size={14} style={{ color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
        <p style={{ fontSize: 12.5, fontWeight: 600, color: '#991b1b' }}>
          To'lov rad etildi{enrollment.rejectionReason ? `: ${enrollment.rejectionReason}` : ''}. Iltimos, to'g'ri chekni qayta yuklang.
        </p>
      </div>
    )}

    {awaitingPayment && payOpen && (
      <div style={{ padding: 16, borderRadius: 12, background: '#fff', border: `1px solid ${enrollment.course.border}` }}>
        <p style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
          To'lov summasi:{' '}
          <span style={{ color: enrollment.course.color }}>
            {enrollment.course.price ? `${Number(enrollment.course.price).toLocaleString('uz-UZ')} ${enrollment.course.currency || 'UZS'}` : '—'}
          </span>
        </p>
        <p style={{ fontSize: 12.5, color: '#475569', marginBottom: 2 }}>
          Karta raqami: <b style={{ color: '#0f172a', letterSpacing: 0.5 }}>{PAYMENT_INFO.cardNumber}</b> ({PAYMENT_INFO.cardOwner})
        </p>
        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>{PAYMENT_INFO.note}</p>

        {(paymentConfig.click || paymentConfig.payme) && (
          <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Onlayn to'lash (tezroq):</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {paymentConfig.click && (
                <button onClick={() => payWithGateway('click')} disabled={gatewayLoading !== ''} className="btn-primary"
                  style={{ fontSize: 12.5, padding: '9px 16px', opacity: gatewayLoading !== '' ? 0.6 : 1 }}>
                  <Wallet size={14} /> {gatewayLoading === 'click' ? "Yo'naltirilmoqda..." : "Click orqali to'lash"}
                </button>
              )}
              {paymentConfig.payme && (
                <button onClick={() => payWithGateway('payme')} disabled={gatewayLoading !== ''} className="btn-primary"
                  style={{ fontSize: 12.5, padding: '9px 16px', opacity: gatewayLoading !== '' ? 0.6 : 1 }}>
                  <Wallet size={14} /> {gatewayLoading === 'payme' ? "Yo'naltirilmoqda..." : "Payme orqali to'lash"}
                </button>
              )}
            </div>
            {gatewayError && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>{gatewayError}</p>}
            <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 10 }}>...yoki qo'lda o'tkazib, chekni pastda yuklang:</p>
          </div>
        )}

        <FileUpload value={receiptUrl} onChange={setReceiptUrl} kind="image" label="To'lov cheki (rasm)" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
          <button onClick={sendReceipt} disabled={!receiptUrl.trim() || receiptState === 'sending'} className="btn-primary"
            style={{ fontSize: 12.5, padding: '9px 16px', opacity: !receiptUrl.trim() || receiptState === 'sending' ? 0.6 : 1 }}>
            {receiptState === 'sending' ? 'Yuborilmoqda...' : 'Chekni yuborish'}
          </button>
          {receiptState === 'error' && (
            <span style={{ fontSize: 12, color: '#dc2626' }}>Yuborishda xatolik. Qayta urinib ko'ring.</span>
          )}
        </div>
      </div>
    )}

    {enrollment.status === 'COMPLETED' && reviewOpen && (
      <div style={{ padding: 16, borderRadius: 12, background: '#fff', border: `1px solid ${enrollment.course.border}` }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Reyting</p>
        <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setReviewForm((f) => ({ ...f, rating: n }))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
              <Star size={22} fill={n <= reviewForm.rating ? '#f59e0b' : 'none'} style={{ color: '#f59e0b' }} />
            </button>
          ))}
        </div>
        <textarea className="inp" rows={3} value={reviewForm.comment}
          onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
          placeholder="Kurs haqida fikringizni yozing..." style={{ resize: 'none', marginBottom: 12 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={saveReview} disabled={!reviewForm.comment.trim() || reviewState === 'saving'} className="btn-primary"
            style={{ fontSize: 12.5, padding: '9px 16px', opacity: !reviewForm.comment.trim() || reviewState === 'saving' ? 0.6 : 1 }}>
            {reviewState === 'saving' ? 'Saqlanmoqda...' : 'Sharhni saqlash'}
          </button>
          {reviewState === 'error' && (
            <span style={{ fontSize: 12, color: '#dc2626' }}>Saqlashda xatolik. Qayta urinib ko'ring.</span>
          )}
        </div>
      </div>
    )}
    </motion.div>
  );
}

export default function DashboardPage(): React.ReactElement {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [status, setStatus]           = useState<'loading' | 'ready' | 'error'>('loading');
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({ click: false, payme: false });
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    getMyEnrollments()
      .then((data: Enrollment[]) => { if (!cancelled) { setEnrollments(data); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    getPaymentConfig()
      .then((cfg) => { if (!cancelled) setPaymentConfig(cfg); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Click/Payme'dan qaytgach — webhook so'rov bilan bir vaqtda kelmasligi mumkin,
  // shuning uchun ro'yxatni bir necha soniyadan keyin qayta yuklaymiz.
  useEffect(() => {
    if (searchParams.get('payment') !== 'return') return;
    setSearchParams((prev) => { prev.delete('payment'); return prev; }, { replace: true });
    const timer = setTimeout(() => {
      getMyEnrollments().then((data: Enrollment[]) => setEnrollments(data)).catch(() => {});
    }, 2500);
    return () => clearTimeout(timer);
  }, [searchParams, setSearchParams]);

  return (
    <div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <h1 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                Xush kelibsiz, <span className="accent">{user?.name?.split(' ')[0]}</span>
              </h1>
              <p style={{ fontSize: 13.5, color: '#64748b' }}>Kurslaringiz va o'quv jarayoningiz shu yerda</p>
            </div>
            <Link to="/student/profile" style={{ textDecoration: 'none' }}>
              <button className="btn-outline" style={{ fontSize: 13 }}>
                <Settings size={14} /> Profil sozlamalari
              </button>
            </Link>
          </div>
        </motion.div>

        <UpcomingSessionsPanel />

        {status === 'ready' && enrollments.length > 0 && (() => {
          const active = enrollments.filter((e) => e.status === 'ACTIVE').length;
          const completed = enrollments.filter((e) => e.status === 'COMPLETED').length;
          const withProgress = enrollments.filter((e) => e.progress && e.progress.totalLessons > 0);
          const doneLessons = withProgress.reduce((sum, e) => sum + (e.progress?.completedLessons ?? 0), 0);
          const totalLessons = withProgress.reduce((sum, e) => sum + (e.progress?.totalLessons ?? 0), 0);
          const overallPct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
          const cards = [
            { label: 'Faol kurslar',        value: String(active),                       icon: BookOpen,     color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
            { label: 'Yakunlangan kurslar', value: String(completed),                    icon: CheckCircle2, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
            { label: 'Tugatilgan darslar',  value: `${doneLessons}/${totalLessons}`,     icon: PlayCircle,   color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff' },
            { label: 'Umumiy progress',     value: `${overallPct}%`,                     icon: TrendingUp,   color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          ];
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 28 }}>
              {cards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="card" style={{ padding: 20, background: card.bg, border: `1.5px solid ${card.border}` }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fff', border: `1.5px solid ${card.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <Icon size={16} style={{ color: card.color }} />
                    </div>
                    <p style={{ fontFamily: 'Outfit,sans-serif', fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{card.value}</p>
                    <p style={{ fontSize: 12.5, fontWeight: 700, color: '#475569', marginTop: 5 }}>{card.label}</p>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {status === 'loading' && <p style={{ color: '#94a3b8', fontSize: 14 }}>Yuklanmoqda...</p>}
        {status === 'error' && <p style={{ color: '#dc2626', fontSize: 14 }}>Ma'lumotlarni yuklab bo'lmadi. Backend ishga tushirilganini tekshiring.</p>}

        {status === 'ready' && enrollments.length === 0 && (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>Siz hali hech qanday kursga yozilmagansiz.</p>
            <Link to="/courses">
              <button className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Kurslarni ko'rish <ArrowRight size={15} />
              </button>
            </Link>
          </div>
        )}

        {status === 'ready' && enrollments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {enrollments.map((e) => (
              <EnrollmentRow key={e.id} enrollment={e} paymentConfig={paymentConfig}
                onPaid={(paid) => setEnrollments((prev) => prev.map((x) => x.id === paid.id ? { ...x, ...paid, progress: paid.progress ?? x.progress } : x))} />
            ))}
          </div>
        )}
    </div>
  );
}
