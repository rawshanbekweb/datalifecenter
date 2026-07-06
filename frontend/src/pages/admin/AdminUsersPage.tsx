import { useCallback, useEffect, useState } from 'react';
import { Search, Ban, LockOpen, KeyRound, Trash2, Copy, X } from 'lucide-react';
import { listUsers, updateUserRole, setUserBlocked, deleteUser, resetUserPassword, AdminUser } from '../../api/users';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { useAuth } from '../../hooks/useAuth';

const ROLE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  STUDENT: { label: 'Talaba', color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
  MENTOR:  { label: 'Mentor', color: '#9333ea', bg: '#faf5ff', border: '#e9d5ff' },
  ADMIN:   { label: 'Admin',  color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
};

const ROLE_FILTERS: { value: string; label: string }[] = [
  { value: '',        label: 'Barchasi' },
  { value: 'STUDENT', label: 'Talabalar' },
  { value: 'MENTOR',  label: 'Mentorlar' },
  { value: 'ADMIN',   label: 'Adminlar' },
];

export default function AdminUsersPage(): React.ReactElement {
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
      alert((err as Error).message || 'Xatolik yuz berdi');
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
    if (!u.isBlocked && !window.confirm(`${u.name} bloklansinmi? U tizimga kira olmaydi.`)) return;
    return runAction(u.id, async () => {
      const updated = await setUserBlocked(u.id, !u.isBlocked);
      setItems((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
    });
  };

  const removeUser = (u: AdminUser): Promise<void> | void => {
    if (!window.confirm(`${u.name} (${u.email}) butunlay o'chirilsinmi? Uning barcha yozilishlari ham o'chadi. Bu amalni qaytarib bo'lmaydi.`)) return;
    return runAction(u.id, async () => {
      await deleteUser(u.id);
      setItems((prev) => prev.filter((x) => x.id !== u.id));
      setTotal((t) => t - 1);
    });
  };

  const resetPassword = (u: AdminUser): Promise<void> | void => {
    if (!window.confirm(`${u.name} uchun yangi vaqtinchalik parol yaratilsinmi? Eski paroli ishlamay qoladi.`)) return;
    return runAction(u.id, async () => {
      const { tempPassword } = await resetUserPassword(u.id);
      setResetInfo({ name: u.name, email: u.email, password: tempPassword });
    });
  };

  return (
    <div>
      <AdminPageHeader title="Foydalanuvchilar" sub={`Jami: ${total} ta foydalanuvchi`} />

      {resetInfo && (
        <div className="card" style={{ padding:16, marginBottom:18, background:'#f0fdf4', border:'1.5px solid #bbf7d0', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <div style={{ flex:'1 1 260px' }}>
            <p style={{ fontSize:13, fontWeight:800, color:'#166534' }}>{resetInfo.name} uchun yangi parol yaratildi</p>
            <p style={{ fontSize:12, color:'#15803d' }}>Bu parolni foydalanuvchiga ({resetInfo.email}) yetkazing — u faqat hozir ko'rinadi.</p>
          </div>
          <code style={{ fontFamily:'JetBrains Mono,monospace', fontSize:15, fontWeight:700, color:'#0f172a', background:'#fff', border:'1.5px solid #bbf7d0', borderRadius:8, padding:'8px 14px' }}>
            {resetInfo.password}
          </code>
          <button onClick={() => navigator.clipboard.writeText(resetInfo.password)} className="btn-outline" style={{ fontSize:12, padding:'8px 12px' }}>
            <Copy size={13} /> Nusxalash
          </button>
          <button onClick={() => setResetInfo(null)} title="Yopish"
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
              {f.label}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setQuery(search); }}
          style={{ display:'flex', gap:8, marginLeft:'auto' }}>
          <div style={{ position:'relative' }}>
            <Search size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} />
            <input className="inp" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Ism yoki email..." style={{ paddingLeft:34, width:220 }} />
          </div>
          <button type="submit" className="btn-outline" style={{ fontSize:13 }}>Qidirish</button>
        </form>
      </div>

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>Ma'lumotlarni yuklab bo'lmadi.</p>}

      {status === 'ready' && items.length === 0 && (
        <div className="card" style={{ padding:36, textAlign:'center' }}>
          <p style={{ color:'#64748b', fontSize:14 }}>Foydalanuvchilar topilmadi.</p>
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
                    {u.name}{isSelf ? ' (siz)' : ''}
                    {u.isBlocked && <span className="tag" style={{ marginLeft:8, background:'#fef2f2', borderColor:'#fecaca', color:'#dc2626', fontWeight:700, fontSize:10.5 }}>Bloklangan</span>}
                  </p>
                  <p style={{ fontSize:12, color:'#94a3b8' }}>{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
                </div>
                <p style={{ fontSize:12, color:'#64748b', flexShrink:0 }}>{u._count.enrollments} ta kurs</p>
                <p style={{ fontSize:11.5, color:'#94a3b8', flexShrink:0 }}>{new Date(u.createdAt).toLocaleDateString('uz-UZ')}</p>
                <span className="tag" style={{ background:r.bg, borderColor:r.border, color:r.color, fontWeight:700, flexShrink:0 }}>{r.label}</span>
                <select className="inp" value={u.role} disabled={busy || !!isSelf}
                  onChange={(e) => changeRole(u.id, e.target.value)}
                  style={{ width:130, fontSize:12.5, padding:'8px 10px', flexShrink:0, opacity: busy ? 0.6 : 1 }}>
                  <option value="STUDENT">Talaba</option>
                  <option value="MENTOR">Mentor</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <button onClick={() => resetPassword(u)} disabled={busy} title="Parolni tiklash"
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, borderRadius:9, background:'#fffbeb', border:'1.5px solid #fde68a', color:'#d97706', cursor:'pointer', opacity: busy ? 0.5 : 1 }}>
                    <KeyRound size={14} />
                  </button>
                  <button onClick={() => toggleBlock(u)} disabled={busy || !!isSelf} title={u.isBlocked ? 'Blokdan chiqarish' : 'Bloklash'}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, borderRadius:9,
                      background: u.isBlocked ? '#f0fdf4' : '#fef2f2', border: u.isBlocked ? '1.5px solid #bbf7d0' : '1.5px solid #fecaca',
                      color: u.isBlocked ? '#16a34a' : '#dc2626', cursor:'pointer', opacity: busy || isSelf ? 0.5 : 1 }}>
                    {u.isBlocked ? <LockOpen size={14} /> : <Ban size={14} />}
                  </button>
                  <button onClick={() => removeUser(u)} disabled={busy || !!isSelf} title="O'chirish"
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
