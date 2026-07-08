import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { listCourseReviews } from '../../api/reviews';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { name: string; avatarUrl?: string | null };
}

interface CourseReviewsProps {
  slug: string;
  rating?: number | string;
  reviewsCount?: number;
  color?: string;
}

type Status = 'loading' | 'ready' | 'error';

export default function CourseReviews({ slug, rating, reviewsCount, color = '#0ea5e9' }: CourseReviewsProps): React.ReactElement | null {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    listCourseReviews(slug)
      .then((data: Review[]) => { if (!cancelled) { setReviews(data); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [slug]);

  if (status !== 'loading' && reviews.length === 0) return null;

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Talabalar sharhi</h2>
        {Number(rating) > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#475569' }}>
            <Star size={14} fill={color} style={{ color }} /> {Number(rating).toFixed(1)}
            {typeof reviewsCount === 'number' && reviewsCount > 0 && ` · ${reviewsCount} ta sharh`}
          </span>
        )}
      </div>

      {status === 'loading' && <p style={{ color: '#94a3b8', fontSize: 13 }}>Yuklanmoqda...</p>}

      {status === 'ready' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reviews.map((r) => (
            <div key={r.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                {r.user.avatarUrl ? (
                  <img src={r.user.avatarUrl} alt={r.user.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f0f9ff', border: '1.5px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, color: '#0ea5e9', fontSize: 13 }}>
                    {r.user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{r.user.name}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(r.createdAt).toLocaleDateString('uz-UZ')}</p>
                </div>
                <div style={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} size={13} fill={idx < r.rating ? '#f59e0b' : 'none'} style={{ color: '#f59e0b' }} />
                  ))}
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.75 }}>{r.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
