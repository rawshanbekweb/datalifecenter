import React, { useEffect, useState } from 'react';
import { Trash2, Star, EyeOff } from 'lucide-react';
import { listReviewsAdmin, updateReviewAdmin, deleteReviewAdmin } from '../../api/reviews';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

interface Review {
  id: string;
  rating: number;
  comment: string;
  published: boolean;
  createdAt: string;
  course: { id: string; title: string; slug: string };
  user: { id: string; name: string; email: string };
}

type Status = 'loading' | 'ready' | 'error';

export default function AdminCourseReviewsPage(): React.ReactElement {
  const [items, setItems]   = useState<Review[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  const load = (): void => {
    setStatus('loading');
    listReviewsAdmin()
      .then((res: { items: Review[] }) => { setItems(res.items); setStatus('ready'); })
      .catch(() => setStatus('error'));
  };

  useEffect(load, []);

  const togglePublished = async (r: Review): Promise<void> => {
    try {
      await updateReviewAdmin(r.id, { published: !r.published });
      load();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    }
  };

  const remove = async (id: string): Promise<void> => {
    if (!window.confirm("Sharhni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await deleteReviewAdmin(id);
      load();
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    }
  };

  return (
    <div>
      <AdminPageHeader title="Kurs sharhlari" sub="Talabalar tomonidan qoldirilgan kurs sharhlarini boshqarish" />

      {status === 'loading' && <p style={{ color: '#94a3b8', fontSize: 14 }}>Yuklanmoqda...</p>}
      {status === 'error' && <p style={{ color: '#dc2626', fontSize: 14 }}>Ma'lumotlarni yuklab bo'lmadi.</p>}

      {status === 'ready' && items.length === 0 && (
        <div className="card" style={{ padding: 36, textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: 14 }}>Sharhlar topilmadi.</p>
        </div>
      )}

      {status === 'ready' && items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((r) => (
            <div key={r.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{r.user.name}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>{r.user.email}</p>
                </div>
                <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{r.course.title}</p>
                  <p style={{ fontSize: 11.5, color: '#94a3b8' }}>{new Date(r.createdAt).toLocaleDateString('uz-UZ')}</p>
                </div>
                <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} size={13} fill={idx < r.rating ? '#f59e0b' : 'none'} style={{ color: '#f59e0b' }} />
                  ))}
                </div>
                {!r.published && (
                  <span className="tag" style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <EyeOff size={11} /> Yashirilgan
                  </span>
                )}
                <button onClick={() => togglePublished(r)} className="btn-outline" style={{ fontSize: 12, padding: '8px 12px', flexShrink: 0 }}>
                  {r.published ? 'Yashirish' : "Ko'rsatish"}
                </button>
                <button onClick={() => remove(r.id)}
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #fecaca', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', flexShrink: 0 }}>
                  <Trash2 size={14} />
                </button>
              </div>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7 }}>{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
