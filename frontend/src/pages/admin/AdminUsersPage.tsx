import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { listUsers, updateUserRole, AdminUser } from '../../api/users';
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

  const changeRole = async (id: string, role: string): Promise<void> => {
    setBusyId(id);
    try {
      const updated = await updateUserRole(id, role);
      setItems((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch (err: unknown) {
      alert((err as Error).message || 'Xatolik yuz berdi');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div>
      <AdminPageHeader title="Foydalanuvchilar" sub={`Jami: ${total} ta foydalanuvchi`} />

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
            return (
              <div key={u.id} className="card" style={{ padding:16, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:r.bg, border:`1.5px solid ${r.border}`, color:r.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800, flexShrink:0 }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex:'1 1 200px', minWidth:0 }}>
                  <p style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{u.name}{isSelf ? ' (siz)' : ''}</p>
                  <p style={{ fontSize:12, color:'#94a3b8' }}>{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
                </div>
                <p style={{ fontSize:12, color:'#64748b', flexShrink:0 }}>{u._count.enrollments} ta kurs</p>
                <p style={{ fontSize:11.5, color:'#94a3b8', flexShrink:0 }}>{new Date(u.createdAt).toLocaleDateString('uz-UZ')}</p>
                <span className="tag" style={{ background:r.bg, borderColor:r.border, color:r.color, fontWeight:700, flexShrink:0 }}>{r.label}</span>
                <select className="inp" value={u.role} disabled={busyId === u.id || !!isSelf}
                  onChange={(e) => changeRole(u.id, e.target.value)}
                  style={{ width:130, fontSize:12.5, padding:'8px 10px', flexShrink:0, opacity: busyId === u.id ? 0.6 : 1 }}>
                  <option value="STUDENT">Talaba</option>
                  <option value="MENTOR">Mentor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
