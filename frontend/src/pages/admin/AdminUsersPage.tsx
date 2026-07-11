import { useCallback, useEffect, useState } from 'react';
import { Search, Ban, LockOpen, KeyRound, Trash2, Copy, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listUsers, updateUserRole, setUserBlocked, deleteUser, resetUserPassword, AdminUser } from '../../api/users';
import { formatDate } from '../../utils/format';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { useAuth } from '../../hooks/useAuth';

const ROLE_META: Record<string, { labelKey: string; color: string; bg: string; border: string }> = {
  STUDENT: { labelKey: 'admin.roles.STUDENT', color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
  MENTOR:  { labelKey: 'admin.roles.MENTOR',  color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff' },
  ADMIN:   { labelKey: 'admin.roles.ADMIN',   color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
};

const ROLE_FILTERS: { value: string; labelKey: string }[] = [
  { value: '',        labelKey: 'admin.common.all' },
  { value: 'STUDENT', labelKey: 'admin.users.filterStudents' },
  { value: 'MENTOR',  labelKey: 'admin.users.filterMentors' },
  { value: 'ADMIN',   labelKey: 'admin.users.filterAdmins' },
];

export default function AdminUsersPage(): React.ReactElement {
  const { t } = useTranslation();
  const { user: me } = useAuth();
  const [items, setItems]   = useState<AdminUser[]>([]);
  const [total, setTotal]   = useState<number>(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [query, setQuery]   = useState<string>('');
  const [busyId, setBusyId] = useState<string>('');

  const load = useCallback((): void => {
    setStatus('loading');
    listUsers({ role: filter || undefined, search: query || undefined, limit: 50 })
      .then((res) => { setItems(res.items); setTotal(res.pagination.total); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, [filter, query]);

  useEffect(load, [load]);

  const [resetInfo, setResetInfo] = useState<{ name: string; email: string; password: string } | null>(null);

  const runAction = async (id: string, action: () => Promise<void>): Promise<void> => {
    setBusyId(id);
    try {
      await action();
    } catch (err: unknown) {
      alert((err as Error).message || t('common.error'));
    } finally {
      setBusyId('');
    }
  };

  const changeRole = (id: string, role: string): Promise<void> =>
    runAction(id, async () => {
      const updated = await updateUserRole(id, role);
      setItems((prev) => prev.map((u) => (u.id === id ? updated : u)));
    });

  const toggleBlock = (u: AdminUser): Promise<void> | void => {
    if (!u.isBlocked && !window.confirm(t('admin.users.confirmBlock', { name: u.name }))) return;
    return runAction(u.id, async () => {
      const updated = await setUserBlocked(u.id, !u.isBlocked);
      setItems((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
    });
  };

  const removeUser = (u: AdminUser): Promise<void> | void => {
    if (!window.confirm(t('admin.users.confirmDelete', { name: u.name, email: u.email }))) return;
    return runAction(u.id, async () => {
      await deleteUser(u.id);
      setItems((prev) => prev.filter((x) => x.id !== u.id));
      setTotal((t) => t - 1);
    });
  };

  const resetPassword = (u: AdminUser): Promise<void> | void => {
    if (!window.confirm(t('admin.users.confirmReset', { name: u.name }))) return;
    return runAction(u.id, async () => {
      const { tempPassword } = await resetUserPassword(u.id);
      setResetInfo({ name: u.name, email: u.email, password: tempPassword });
    });
  };

  return (
    <div>
      <AdminPageHeader title={t('admin.users.title')} sub={t('admin.users.subTotal', { n: total })} />

      {resetInfo && (
        <div className="card" style={{ padding:16, marginBottom:18, background:'#f0fdf4', border:'1.5px solid #bbf7d0', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div style={{ flex:'1 1 260px' }}>
            <p style={{ fontSize:13, fontWeight:800, color:'#166534' }}>{t('admin.users.resetCreated', { name: resetInfo.name })}</p>
            <p style={{ fontSize:12, color:'#15803d' }}>{t('admin.users.resetHint', { email: resetInfo.email })}</p>
          </div>
          <code style={{ fontFamily:'JetBrains Mono,monospace', fontSize:15, fontWeight:700, color:'#0f172a', background:'#fff', border:'1.5px solid #bbf7d0', borderRadius:8, padding:'8px 14px' }}>
            {resetInfo.password}
          </code>
          <button onClick={() => navigator.clipboard.writeText(resetInfo.password)} className="btn-outline" style={{ fontSize:12, padding:'8px 12px' }}>
            <Copy size={13} /> {t('admin.users.copy')}
          </button>
          <button onClick={() => setResetInfo(null)} title={t('admin.users.closeTitle')}
            style={{ background:'transparent', border:'none', cursor:'pointer', color:'#64748b', display:'flex' }}>
            <X size={16} />
          </button>
        </div>
      )}

      <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:18 }}>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {ROLE_FILTERS.map((f) => (
            <button key={f.value} onClick={() => setFilter(f.value)}
              style={{
                padding:'8px 14px', borderRadius:10, fontSize:12.5, fontWeight:700, cursor:'pointer',
                border: filter === f.value ? '1.5px solid #0ea5e9' : '1.5px solid #e2e8f0',
                background: filter === f.value ? '#f0f9ff' : '#fff',
                color: filter === f.value ? '#0ea5e9' : '#64748b',
              }}>
              {t(f.labelKey)}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setQuery(search); }}
          style={{ display:'flex', gap:8, marginLeft:'auto' }}>
          <div style={{ position:'relative' }}>
            <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
            <input className="inp" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder={t('admin.users.searchPlaceholder')} style={{ paddingLeft:34, width:220 }} />
          </div>
          <button type="submit" className="btn-outline" style={{ fontSize:13 }}>{t('admin.common.search')}</button>
        </form>
      </div>

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>{t('common.loading')}</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>{t('common.loadFailed')}</p>}

      {status === 'ready' && items.length === 0 && (
        <div className="card" style={{ padding:36, textAlign:'center' }}>
          <p style={{ color:'#64748b', fontSize:14 }}>{t('admin.users.empty')}</p>
        </div>
      )}

      {status === 'ready' && items.length > 0 && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {items.map((u) => {
            const r = ROLE_META[u.role] || ROLE_META.STUDENT;
            const isSelf = me?.id === u.id;
            const busy = busyId === u.id;
            return (
              <div key={u.id} className="card" style={{ padding:16, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', opacity: u.isBlocked ? 0.75 : 1 }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:r.bg, border:`1.5px solid ${r.border}`, color:r.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, flexShrink:0 }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:'1 1 200px', minWidth:0 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>
                    {u.name}{isSelf ? t('admin.users.self') : ''}
                    {u.isBlocked && <span className="tag" style={{ marginLeft:8, background:'#fef2f2', borderColor:'#fecaca', color:'#dc2626', fontWeight:700, fontSize:10.5 }}>{t('admin.users.blocked')}</span>}
                  </p>
                  <p style={{ fontSize:12, color:'#94a3b8' }}>{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
                </div>
                <p style={{ fontSize:12, color:'#64748b', flexShrink:0 }}>{t('admin.users.courseCount', { n: u._count.enrollments })}</p>
                <p style={{ fontSize:11.5, color:'#94a3b8', flexShrink:0 }}>{formatDate(u.createdAt)}</p>
                <span className="tag" style={{ background:r.bg, borderColor:r.border, color:r.color, fontWeight:700, flexShrink:0 }}>{t(r.labelKey)}</span>
                <select className="inp" value={u.role} disabled={busy || !!isSelf}
                  onChange={(e) => changeRole(u.id, e.target.value)}
                  style={{ width:130, fontSize:12.5, padding:'8px 10px', flexShrink:0, opacity: busy ? 0.6 : 1 }}>
                  <option value="STUDENT">{t('admin.roles.STUDENT')}</option>
                  <option value="MENTOR">{t('admin.roles.MENTOR')}</option>
                  <option value="ADMIN">{t('admin.roles.ADMIN')}</option>
                </select>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <button onClick={() => resetPassword(u)} disabled={busy} title={t('admin.users.resetTitle')}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, borderRadius:9, background:'#fffbeb', border:'1.5px solid #fde68a', color:'#d97706', cursor:'pointer', opacity: busy ? 0.5 : 1 }}>
                    <KeyRound size={14} />
                  </button>
                  <button onClick={() => toggleBlock(u)} disabled={busy || !!isSelf} title={u.isBlocked ? t('admin.users.unblockTitle') : t('admin.users.blockTitle')}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, borderRadius:9,
                      background: u.isBlocked ? '#f0fdf4' : '#fef2f2', border: u.isBlocked ? '1.5px solid #bbf7d0' : '1.5px solid #fecaca',
                      color: u.isBlocked ? '#16a34a' : '#dc2626', cursor:'pointer', opacity: busy || isSelf ? 0.5 : 1 }}>
                    {u.isBlocked ? <LockOpen size={14} /> : <Ban size={14} />}
                  </button>
                  <button onClick={() => removeUser(u)} disabled={busy || !!isSelf} title={t('admin.users.deleteTitle')}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, borderRadius:9, background:'#fef2f2', border:'1.5px solid #fecaca', color:'#dc2626', cursor:'pointer', opacity: busy || isSelf ? 0.5 : 1 }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
