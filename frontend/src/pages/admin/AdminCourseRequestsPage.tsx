import { useCallback, useEffect, useState } from 'react';
import { Inbox, Send, CornerDownRight, Phone, Mail, Trash2, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  CourseRequest,
  CourseRequestStatus,
  deleteCourseRequest,
  deleteCourseRequests,
  listCourseRequestsAdmin,
  updateCourseRequest,
} from '../../api/courseRequests';
import { formatDate } from '../../utils/format';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import CourseFormatBadge from '../../components/courses/CourseFormatBadge';
import BulkActionBar from '../../components/admin/BulkActionBar';
import { useBulkSelection } from '../../components/admin/useBulkSelection';
import { useConfirm, useToast } from '../../components/common/Feedback';
import Loading from '../../components/common/Loading';

const STATUS_META: Record<CourseRequestStatus, { labelKey: string; color: string; bg: string; border: string }> = {
  NEW:       { labelKey: 'admin.courseRequests.status.NEW',       color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  CONTACTED: { labelKey: 'admin.courseRequests.status.CONTACTED', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
  ENROLLED:  { labelKey: 'admin.courseRequests.status.ENROLLED',  color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  REJECTED:  { labelKey: 'admin.courseRequests.status.REJECTED',  color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
};

const FILTERS: (CourseRequestStatus | 'ALL')[] = ['ALL', 'NEW', 'CONTACTED', 'ENROLLED', 'REJECTED'];

/**
 * Kursga qiziqqanlarning murojaatlari (ayniqsa offline guruhlar uchun).
 *
 * Javob yozilganda u hisobi bor o'quvchiga administratsiya yozishmasiga
 * xabar bo'lib boradi — ya'ni bu yerda yozilgan matn javobsiz qolmaydi.
 */
export default function AdminCourseRequestsPage(): React.ReactElement {
  const { t } = useTranslation();
  const toast = useToast();
  const [requests, setRequests] = useState<CourseRequest[]>([]);
  const [status, setStatus]     = useState<'loading' | 'ready' | 'error'>('loading');
  const [filter, setFilter]     = useState<CourseRequestStatus | 'ALL'>('ALL');
  const [drafts, setDrafts]     = useState<Record<string, string>>({});
  const [busyId, setBusyId]     = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState<boolean>(false);

  const confirm = useConfirm();
  const selection = useBulkSelection(requests.map((r) => r.id));

  const load = useCallback((): void => {
    setStatus('loading');
    listCourseRequestsAdmin({ status: filter === 'ALL' ? undefined : filter })
      .then((page) => { setRequests(page.items); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, [filter]);

  useEffect(load, [load]);

  const removeOne = async (id: string): Promise<void> => {
    const ok = await confirm(t('admin.bulk.confirmDeleteOne'), { confirmLabel: t('admin.bulk.deleteOne'), danger: true });
    if (!ok) return;
    setBusyId(id);
    try {
      await deleteCourseRequest(id);
      toast.success(t('admin.bulk.deletedOne'));
      selection.clear();
      load();
    } catch {
      toast.error(t('admin.bulk.deleteFailed'));
    } finally {
      setBusyId(null);
    }
  };

  const removeSelected = async (): Promise<void> => {
    const ids = selection.selectedIds;
    const ok = await confirm(t('admin.bulk.confirmDelete', { n: ids.length }), { confirmLabel: t('admin.bulk.deleteSelected'), danger: true });
    if (!ok) return;
    setBulkBusy(true);
    try {
      const res = await deleteCourseRequests(ids);
      toast.success(t('admin.bulk.deleted', { n: res.deleted }));
      selection.clear();
      load();
    } catch {
      toast.error(t('admin.bulk.deleteFailed'));
    } finally {
      setBulkBusy(false);
    }
  };

  const apply = (updated: CourseRequest): void =>
    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

  const patch = async (id: string, data: { status?: CourseRequestStatus; reply?: string }): Promise<void> => {
    if (busyId) return;
    setBusyId(id);
    try {
      apply(await updateCourseRequest(id, data));
      if (data.reply) setDrafts((prev) => ({ ...prev, [id]: '' }));
    } catch (err: unknown) {
      toast.error((err as Error).message || t('common.error'));
    } finally {
      setBusyId(null);
    }
  };

  const newCount = requests.filter((r) => r.status === 'NEW').length;

  return (
    <div>
      <AdminPageHeader title={t('admin.courseRequests.title')}
        sub={newCount > 0 ? t('admin.courseRequests.subWaiting', { n: newCount }) : t('admin.courseRequests.sub')} />

      <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:16 }}>
        {FILTERS.map((value) => {
          const active = filter === value;
          return (
            <button key={value} onClick={() => setFilter(value)}
              style={{
                fontSize:12, fontWeight:700, padding:'6px 13px', borderRadius:20, cursor:'pointer',
                background: active ? '#0f172a' : '#fff', color: active ? '#fff' : '#475569',
                border: `1px solid ${active ? '#0f172a' : '#e2e8f0'}`,
              }}>
              {value === 'ALL' ? t('admin.common.all') : t(STATUS_META[value].labelKey)}
            </button>
          );
        })}
      </div>

      {status === 'loading' && <Loading />}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>{t('common.loadFailed')}</p>}

      {status === 'ready' && requests.length === 0 && (
        <div className="card" style={{ padding:40, textAlign:'center' }}>
          <Inbox size={28} style={{ color:'#cbd5e1', marginBottom:12 }} />
          <p style={{ color:'#64748b', fontSize:14 }}>{t('admin.courseRequests.empty')}</p>
        </div>
      )}

      {status === 'ready' && requests.length > 0 && (
        <>
        <BulkActionBar
          count={selection.count}
          allSelected={selection.allVisibleSelected}
          onToggleAll={selection.toggleAllVisible}
          onDelete={removeSelected}
          onClear={selection.clear}
          busy={bulkBusy}
        />
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {requests.map((r) => {
            const meta = STATUS_META[r.status];
            return (
              <div key={r.id} className="card"
                style={{ padding:18, borderColor: selection.isSelected(r.id) ? '#7dd3fc' : undefined }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:10 }}>
                  <input type="checkbox" checked={selection.isSelected(r.id)} onChange={() => selection.toggle(r.id)}
                    style={{ width:16, height:16, cursor:'pointer', accentColor:'#0ea5e9', flexShrink:0 }} />
                  <div style={{ flex:1, minWidth:200 }}>
                    <p style={{ fontSize:13.5, fontWeight:800, color:'#0f172a' }}>{r.course.title}</p>
                    <p style={{ fontSize:11.5, color:'#94a3b8' }}>{formatDate(r.createdAt)}</p>
                  </div>
                  <CourseFormatBadge format={r.format} />
                  <span className="tag" style={{ background:meta.bg, borderColor:meta.border, color:meta.color, fontWeight:700, flexShrink:0 }}>
                    {t(meta.labelKey)}
                  </span>
                  <button onClick={() => removeOne(r.id)} disabled={busyId === r.id || bulkBusy} title={t('admin.bulk.deleteOne')}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', width:30, height:30, borderRadius:8,
                      background:'#fff', border:'1.5px solid #fecaca', color:'#dc2626', cursor:'pointer', flexShrink:0 }}>
                    <Trash2 size={14}/>
                  </button>
                </div>

                <div style={{ display:'flex', flexWrap:'wrap', gap:'6px 18px', fontSize:12.5, color:'#475569', marginBottom:10 }}>
                  <span style={{ display:'flex', alignItems:'center', gap:5 }}><UserIcon size={13}/> {r.name}</span>
                  <a href={`tel:${r.phone}`} style={{ display:'flex', alignItems:'center', gap:5, color:'#0284c7', textDecoration:'none', fontWeight:600 }}>
                    <Phone size={13}/> {r.phone}
                  </a>
                  {r.email && (
                    <a href={`mailto:${r.email}`} style={{ display:'flex', alignItems:'center', gap:5, color:'#0284c7', textDecoration:'none' }}>
                      <Mail size={13}/> {r.email}
                    </a>
                  )}
                  {/* Hisobi bo'lmagan mehmon — javob yozishmaga tushmaydi, telefon qilish kerak */}
                  {!r.userId && (
                    <span style={{ fontSize:11.5, color:'#c2410c', fontWeight:700 }}>{t('admin.courseRequests.guest')}</span>
                  )}
                </div>

                {r.note && (
                  <p style={{ fontSize:13, color:'#334155', lineHeight:1.7, marginBottom:10, padding:'10px 12px', borderRadius:10, background:'#f8fafc', border:'1px solid #f1f5f9' }}>
                    {r.note}
                  </p>
                )}

                {r.reply && (
                  <div style={{ display:'flex', gap:8, marginBottom:10, padding:'10px 12px', borderRadius:10, background:'#f0fdf4', border:'1px solid #bbf7d0' }}>
                    <CornerDownRight size={14} style={{ color:'#16a34a', flexShrink:0, marginTop:2 }}/>
                    <div>
                      <p style={{ fontSize:11.5, fontWeight:800, color:'#16a34a', marginBottom:3 }}>{t('admin.courseRequests.yourReply')}</p>
                      <p style={{ fontSize:13, color:'#334155', lineHeight:1.7 }}>{r.reply}</p>
                    </div>
                  </div>
                )}

                <div style={{ display:'flex', gap:8, marginBottom:10 }}>
                  <input className="inp" value={drafts[r.id] || ''} style={{ flex:1, fontSize:13 }}
                    placeholder={r.userId ? t('admin.courseRequests.replyPlaceholder') : t('admin.courseRequests.replyNotePlaceholder')}
                    onChange={(e) => setDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))} />
                  <button onClick={() => void patch(r.id, { reply: (drafts[r.id] || '').trim() })}
                    disabled={!(drafts[r.id] || '').trim() || busyId === r.id}
                    className="btn-primary"
                    style={{ fontSize:12.5, padding:'9px 16px', flexShrink:0, opacity: !(drafts[r.id] || '').trim() || busyId === r.id ? 0.6 : 1 }}>
                    <Send size={13}/> {busyId === r.id ? '...' : t('admin.courseRequests.sendReply')}
                  </button>
                </div>

                <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                  {(['CONTACTED', 'ENROLLED', 'REJECTED'] as CourseRequestStatus[])
                    .filter((next) => next !== r.status)
                    .map((next) => (
                      <button key={next} onClick={() => void patch(r.id, { status: next })} disabled={busyId === r.id}
                        className="btn-outline" style={{ fontSize:11.5, padding:'5px 12px' }}>
                        {t(STATUS_META[next].labelKey)}
                      </button>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}
