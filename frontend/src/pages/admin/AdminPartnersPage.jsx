import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertCircle, Building2 } from 'lucide-react';
import { listPartners, createPartner, updatePartner, deletePartner } from '../../api/partners';

const emptyForm = { name:'', logoUrl:'/partners/placeholder-logo.svg', websiteUrl:'', category:'', featured:false };

function PartnerForm({ initial, onCancel, onSaved }) {
  const [form, setForm]     = useState(initial);
  const [status, setStatus] = useState('idle');
  const [error, setError]   = useState('');

  const change = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      if (form.id) {
        await updatePartner(form.id, form);
      } else {
        await createPartner(form);
      }
      onSaved();
    } catch (err) {
      setError(err.message || 'Xatolik yuz berdi');
      setStatus('error');
    }
  };

  return (
    <form onSubmit={submit} className="card" style={{ padding:24, marginBottom:20, display:'flex', flexDirection:'column', gap:12 }}>
      {status === 'error' && (
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:12, background:'#fef2f2', border:'1.5px solid #fecaca' }}>
          <AlertCircle size={15} style={{ color:'#dc2626' }} />
          <p style={{ fontSize:13, color:'#dc2626' }}>{error}</p>
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Nomi *</label>
          <input className="inp" value={form.name} onChange={change('name')} required />
        </div>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Kategoriya *</label>
          <input className="inp" value={form.category} onChange={change('category')} required placeholder="hiring / tech / education" />
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Logotip URL *</label>
          <input className="inp" value={form.logoUrl} onChange={change('logoUrl')} required />
        </div>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Veb-sayt</label>
          <input className="inp" value={form.websiteUrl} onChange={change('websiteUrl')} placeholder="https://..." />
        </div>
      </div>
      <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#334155', cursor:'pointer' }}>
        <input type="checkbox" checked={form.featured} onChange={change('featured')} /> Tavsiya etilgan (birinchi ko'rsatiladi)
      </label>
      <div style={{ display:'flex', gap:10, marginTop:6 }}>
        <button type="submit" disabled={status==='loading'} className="btn-primary" style={{ opacity: status==='loading'?0.7:1 }}>
          {status==='loading' ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline">Bekor qilish</button>
      </div>
    </form>
  );
}

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState([]);
  const [status, setStatus]     = useState('loading');
  const [editing, setEditing]   = useState(null);

  const load = () => {
    setStatus('loading');
    listPartners().then((data) => { setPartners(data); setStatus('ready'); }).catch(() => setStatus('error'));
  };

  useEffect(load, []);

  const startEdit = (p) => setEditing({
    id: p.id, name: p.name, logoUrl: p.logoUrl, websiteUrl: p.websiteUrl || '', category: p.category, featured: p.featured,
  });

  const remove = async (id) => {
    if (!window.confirm("Hamkorni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await deletePartner(id);
      load();
    } catch (err) {
      alert(err.message || 'Xatolik yuz berdi');
    }
  };

  return (
    <div>
      {!editing && (
        <button onClick={() => setEditing({ ...emptyForm })} className="btn-primary" style={{ marginBottom:20 }}>
          <Plus size={15}/> Yangi hamkor
        </button>
      )}

      {editing && <PartnerForm initial={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>Ma'lumotlarni yuklab bo'lmadi.</p>}

      {status === 'ready' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {partners.map((p) => (
            <div key={p.id} className="card" style={{ padding:16, display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:40, height:40, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f9ff', border:'1.5px solid #bae6fd', flexShrink:0 }}>
                <Building2 size={18} style={{ color:'#0ea5e9' }} />
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{p.name}</p>
                <p style={{ fontSize:12, color:'#94a3b8' }}>{p.category}</p>
              </div>
              {p.featured && <span className="tag" style={{ background:'#faf5ff', borderColor:'#e9d5ff', color:'#9333ea' }}>Tavsiya</span>}
              <button onClick={() => startEdit(p)} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#475569' }}>
                <Pencil size={14}/>
              </button>
              <button onClick={() => remove(p.id)} style={{ width:32, height:32, borderRadius:8, border:'1px solid #fecaca', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#dc2626' }}>
                <Trash2 size={14}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
