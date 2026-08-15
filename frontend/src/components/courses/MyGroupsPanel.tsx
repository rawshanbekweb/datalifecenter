import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Clock, MapPin, UserSquare2 } from 'lucide-react';
import { MyCourseGroup, listMyCourseGroups } from '../../api/courseGroups';
import { formatDate, formatDateTime } from '../../utils/format';
import { formatSchedule, nextLessonAt } from '../../utils/groupSchedule';
import CourseFormatBadge from './CourseFormatBadge';

/**
 * O'quvchining guruhlari va jadvali.
 *
 * "Qabul qilindingiz" dan keyingi eng muhim savolga javob beradi: keyingi
 * dars qachon va qayerda. Guruhga biriktirilmagan o'quvchida panel umuman
 * chizilmaydi — bo'sh quti ma'lumot bermaydi.
 */
export default function MyGroupsPanel(): React.ReactElement | null {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<MyCourseGroup[]>([]);

  useEffect(() => {
    let cancelled = false;
    listMyCourseGroups()
      .then((rows) => { if (!cancelled) setGroups(rows); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (groups.length === 0) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>{t('student.groups.title')}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {groups.map((g) => {
          const next = nextLessonAt(g);
          const notStarted = new Date(g.startsAt).getTime() > Date.now();
          return (
            <div key={g.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>{g.name}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>{g.course.title}</p>
                </div>
                <CourseFormatBadge format={g.format} />
              </div>

              {/* Keyingi dars — kartaning asosiy ma'lumoti. Guruh hali
                  boshlanmagan bo'lsa boshlanish sanasi ko'rsatiladi. */}
              {next && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 13px', borderRadius: 10, background: '#f0f9ff', border: '1px solid #bae6fd', marginBottom: 10 }}>
                  <Clock size={14} style={{ color: '#0284c7', flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: '#0c4a6e', fontWeight: 700 }}>
                    {t('student.groups.nextLesson')}: {formatDateTime(next, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', fontSize: 12.5, color: '#475569' }}>
                {g.weekdays.length > 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600 }}>
                    <CalendarDays size={13} /> {formatSchedule(g, t)}
                  </span>
                )}
                {notStarted && (
                  <span style={{ color: '#d97706', fontWeight: 700 }}>
                    {t('student.groups.startsAt')}: {formatDate(g.startsAt)}
                  </span>
                )}
                {g.room && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><MapPin size={13} /> {g.room}</span>
                )}
                {g.mentor && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><UserSquare2 size={13} /> {g.mentor.name}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
