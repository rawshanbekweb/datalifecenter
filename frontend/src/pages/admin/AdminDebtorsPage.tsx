import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Wallet, CheckCircle2 } from 'lucide-react';
import { Debtor, DebtorsResponse, listDebtors } from '../../api/enrollments';
import { listCoursesAdmin } from '../../api/courses';
import { formatDate, formatMoney } from '../../utils/format';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import CourseFormatBadge from '../../components/courses/CourseFormatBadge';
import EnrollmentPaymentsPanel from '../../components/payments/EnrollmentPaymentsPanel';
import { useDebounced } from '../../hooks/useDebounced';
import Loading from '../../components/common/Loading';

interface CourseOption { id: string; title: { uz: string } }

/**
 * Qarzdorlar — pulini to'liq to'lamagan faol o'quvchilar.
 *
 * NEGA ALOHIDA SAHIFA: yozilishlar ro'yxati sahifalanadi va boshqa
 * maqsadga xizmat qiladi; qarzni kuzatish esa TO'LIQ ro'yxatni va jami
 * summani talab qiladi — "bugun kimni chaqirish kerak" degan savolga
 * bitta ekranda javob berishi kerak.
 */
export default function AdminDebtorsPage(): React.ReactElement {
  const { t } = useTranslation();
  const [data, setData] = useState<DebtorsResponse | null>(null);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [courseId, setCourseId] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const query = useDebounced(search);
  const [openId, setOpenId] = useState<string>('');

  const load = useCallback((): void => {
    setStatus('loading');
    listDebtors({ courseId: courseId || undefined, search: query || undefined })
      .then((res) => { setData(res); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, [courseId, query]);

  useEffect(load, [load]);

  useEffect(() => {
    listCoursesAdmin().then((rows: CourseOption[]) => setCourses(rows)).catch(() => {});
  }, []);

  const rowCurrency = (row: Debtor): string => row.course.currency;

  return (
    <div>
      <AdminPageHeader title={t('admin.debtors.title')} sub={t('admin.debtors.sub')} />

      {/* Jami qarz — sahifaning asosiy raqami */}
      {data && data.count > 0 && (
        <div className="card" style={{ padding:'16px 20px', marginBottom:18, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', background:'#fef2f2', border:'1.5px solid #fecaca' }}>
          <Wallet size={20} style={{ color:'#dc2626' }} />
          <div>
            <p style={{ fontSize:12, color:'#7f1d1d', fontWeight:600 }}>{t('admin.debtors.totalDebt')}</p>
            <p style={{ fontSize:22, fontWeight:800, color:'#dc2626', lineHeight:1.2 }}>
              {formatMoney(data.totalDebt, data.items[0] ? rowCurrency(data.items[0]) : '')}
            </p>
          </div>
          <p style={{ marginLeft:'auto', fontSize:13, color:'#7f1d1d', fontWeight:700 }}>
            {t('admin.debtors.count', { n: data.count })}
          </p>
        </div>
      )}

      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:18 }}>
        <select className="inp" value={courseId} onChange={(e) => setCourseId(e.target.value)}
          style={{ cursor:'pointer', maxWidth:240 }}>
          <option value="">{t('admin.courseGroups.allCourses')}</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title.uz}</option>)}
        </select>
        <div style={{ position:'relative', marginLeft:'auto' }}>
          <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
          <input className="inp" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.enrollments.searchPlaceholder')} style={{ paddingLeft:34, width:220 }} />
        </div>
      </div>

      {status === 'loading' && <Loading />}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>{t('common.loadFailed')}</p>}

      {status === 'ready' && data && data.count === 0 && (
        <div className="card" style={{ padding:40, textAlign:'center' }}>
          <CheckCircle2 size={28} style={{ color:'#86efac', marginBottom:12 }} />
          <p style={{ color:'#64748b', fontSize:14 }}>{t('admin.debtors.empty')}</p>
        </div>
      )}

      {status === 'ready' && data && data.count > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {data.items.map((row) => (
            <React.Fragment key={row.id}>
              <div className="card admin-row">
                <div style={{ flex:'1 1 200px', minWidth:0 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{row.user.name}</p>
                  <p style={{ fontSize:12, color:'#94a3b8' }}>{row.user.email}</p>
                </div>
                <div style={{ flex:'1 1 200px', minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <p style={{ fontSize:13, fontWeight:700, color:'#334155' }}>{row.course.title}</p>
                    {row.group && <span className="tag" style={{ fontWeight:700 }}>{row.group.name}</span>}
                    {row.format === 'OFFLINE' && <CourseFormatBadge format="OFFLINE" />}
                  </div>
                  <p style={{ fontSize:12, color:'#64748b' }}>
                    {formatMoney(row.amountPaid ?? 0)}/{formatMoney(row.agreed, rowCurrency(row))}
                  </p>
                </div>
                <p style={{ fontSize:11.5, color:'#94a3b8', flexShrink:0 }}>{formatDate(row.enrolledAt)}</p>
                <span className="tag" style={{ background:'#fef2f2', borderColor:'#fecaca', color:'#dc2626', fontWeight:800, flexShrink:0 }}>
                  {formatMoney(row.debt, rowCurrency(row))}
                </span>
                <button onClick={() => setOpenId((prev) => (prev === row.id ? '' : row.id))}
                  className="btn-outline" style={{ fontSize:12, padding:'8px 12px', flexShrink:0 }}>
                  <Wallet size={13}/> {t('admin.enrollments.payments')}
                </button>
              </div>

              {openId === row.id && (
                <div className="card" style={{ padding:16 }}>
                  <EnrollmentPaymentsPanel enrollmentId={row.id} canEdit onChanged={load} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
