import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CornerDownRight } from 'lucide-react';
import { CourseRequest, CourseRequestStatus, listMyCourseRequests } from '../../api/courseRequests';
import { formatDate } from '../../utils/format';
import CourseFormatBadge from './CourseFormatBadge';

const STATUS_STYLE: Record<CourseRequestStatus, { color: string; bg: string; border: string }> = {
  NEW:       { color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  CONTACTED: { color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  ENROLLED:  { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  REJECTED:  { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

/**
 * O'quvchining kurs bo'yicha murojaatlari va ularning holati.
 *
 * So'rov yuborgan odam "yuborildi va nima bo'ldi?" degan savolsiz
 * qolmasligi kerak — adminning javobi yozishmaga tushadi, holat esa
 * shu yerda ko'rinadi. Murojaat bo'lmasa panel umuman chizilmaydi.
 */
export default function MyCourseRequestsPanel(): React.ReactElement | null {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<CourseRequest[]>([]);

  useEffect(() => {
    let cancelled = false;
    listMyCourseRequests()
      .then((list) => { if (!cancelled) setRequests(list); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (requests.length === 0) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>{t('courseRequest.myTitle')}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {requests.map((r) => {
          const style = STATUS_STYLE[r.status];
          return (
            <div key={r.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{r.course.title}</p>
                  <p style={{ fontSize: 11.5, color: '#94a3b8' }}>{formatDate(r.createdAt)}</p>
                </div>
                <CourseFormatBadge format={r.format} />
                <span className="tag" style={{ background: style.bg, borderColor: style.border, color: style.color, fontWeight: 700 }}>
                  {t(`courseRequest.status.${r.status}`)}
                </span>
              </div>

              {r.reply && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10, padding: '10px 12px', borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <CornerDownRight size={14} style={{ color: '#0284c7', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <p style={{ fontSize: 11.5, fontWeight: 800, color: '#0284c7', marginBottom: 3 }}>{t('courseRequest.replyLabel')}</p>
                    <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.7 }}>{r.reply}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
