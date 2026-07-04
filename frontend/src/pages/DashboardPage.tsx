import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, CreditCard } from 'lucide-react';
import { getMyEnrollments, mockPayEnrollment } from '../api/enrollments';
import { resolveIcon } from '../utils/iconMap';
import { useAuth } from '../hooks/useAuth';

interface CourseInfo {
  iconKey: string;
  slug: string;
  title: string;
  bg: string;
  border: string;
  color: string;
}

interface Enrollment {
  id: string;
  course: CourseInfo;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: string;
  enrolledAt: string;
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
}

function EnrollmentRow({ enrollment, onPaid }: EnrollmentRowProps): React.ReactElement {
  const [payStatus, setPayStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const Icon = resolveIcon(enrollment.course.iconKey);
  const s = STATUS_LABELS[enrollment.status];

  const simulatePayment = async () => {
    setPayStatus('loading');
    try {
      const paid = await mockPayEnrollment(enrollment.id);
      onPaid(paid);
    } catch {
      setPayStatus('error');
    }
  };

  return (
    <motion.div whileHover={{ x: 4 }} className="card"
      style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, background: enrollment.course.bg, border: `1.5px solid ${enrollment.course.border}` }}>
      <Link to={`/courses/${enrollment.course.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0, textDecoration: 'none' }}>
        <div style={{ width: 48, height: 48, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: `1.5px solid ${enrollment.course.border}`, flexShrink: 0 }}>
          <Icon size={22} style={{ color: enrollment.course.color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 3 }}>{enrollment.course.title}</p>
          <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#94a3b8' }}>
            <Clock size={12} /> Yozilgan sana: {new Date(enrollment.enrolledAt).toLocaleDateString('uz-UZ')}
          </p>
        </div>
      </Link>
      {import.meta.env.DEV && enrollment.paymentStatus === 'UNPAID' && (
        <button onClick={simulatePayment} disabled={payStatus === 'loading'} className="btn-outline"
          style={{ fontSize: 12, padding: '8px 14px', opacity: payStatus === 'loading' ? 0.7 : 1 }}>
          <CreditCard size={13} /> {payStatus === 'loading' ? '...' : "[DEV] To'lash"}
        </button>
      )}
      <span className="tag" style={{ background: s.bg, borderColor: s.border, color: s.color, fontWeight: 700, flexShrink: 0 }}>{s.label}</span>
    </motion.div>
  );
}

export default function DashboardPage(): React.ReactElement {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [status, setStatus]           = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    getMyEnrollments()
      .then((data: Enrollment[]) => { if (!cancelled) { setEnrollments(data); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="section-light" style={{ padding: '160px 0 104px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36 }}>
          <span className="pill">Shaxsiy kabinet</span>
          <h1 className="h-section" style={{ marginBottom: 6 }}>Xush kelibsiz, <span className="accent">{user?.name?.split(' ')[0]}</span></h1>
          <p className="sub" style={{ textAlign: 'left' }}>Kurslaringiz va o'quv jarayoningiz shu yerda</p>
        </motion.div>

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
              <EnrollmentRow key={e.id} enrollment={e}
                onPaid={(paid) => setEnrollments((prev) => prev.map((x) => x.id === paid.id ? paid : x))} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
