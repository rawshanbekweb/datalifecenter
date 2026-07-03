import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { listMentors, createMentor, updateMentor, deleteMentor } from '../../api/mentors';

const emptyForm = { name:'', bio:'', specialty:'', photoUrl:'', linkedinUrl:'', githubUrl:'', telegramUrl:'', featured:false };

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

function MentorForm({ initial, onCancel, onSaved }) {
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
        await updateMentor(form.id, form);
      } else {
        await createMentor(form);
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
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Ism Familiya *</label>
          <input className="inp" value={form.name} onChange={change('name')} required />
        </div>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Soha *</label>
          <input className="inp" value={form.specialty} onChange={change('specialty')} required placeholder="Frontend & React" />
        </div>
      </div>
      <div>
        <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Bio *</label>
        <textarea className="inp" rows={3} value={form.bio} onChange={change('bio')} required style={{ resize:'none' }} />
      </div>
      <div>
        <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Rasm URL</label>
        <input className="inp" value={form.photoUrl} onChange={change('photoUrl')} placeholder="https://..." />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>LinkedIn</label>
          <input className="inp" value={form.linkedinUrl} onChange={change('linkedinUrl')} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>GitHub</label>
          <input className="inp" value={form.githubUrl} onChange={change('githubUrl')} />
        </div>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Telegram</label>
          <input className="inp" value={form.telegramUrl} onChange={change('telegramUrl')} />
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

export default function AdminMentorsPage() {
  const [mentors, setMentors] = useState([]);
  const [status, setStatus]   = useState('loading');
  const [editing, setEditing] = useState(null);

  const load = () => {
    setStatus('loading');
    listMentors().then((data) => { setMentors(data); setStatus('ready'); }).catch(() => setStatus('error'));
  };

  useEffect(load, []);

  const startEdit = (m) => setEditing({
    id: m.id, name: m.name, bio: m.bio, specialty: m.specialty,
    photoUrl: m.photoUrl || '', linkedinUrl: m.linkedinUrl || '', githubUrl: m.githubUrl || '', telegramUrl: m.telegramUrl || '',
    featured: m.featured,
  });

  const remove = async (id) => {
    if (!window.confirm("Mentorni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await deleteMentor(id);
      load();
    } catch (err) {
      alert(err.message || 'Xatolik yuz berdi');
    }
  };

  return (
    <div>
      {!editing && (
        <button onClick={() => setEditing({ ...emptyForm })} className="btn-primary" style={{ marginBottom:20 }}>
          <Plus size={15}/> Yangi mentor
        </button>
      )}

      {editing && <MentorForm initial={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>Ma'lumotlarni yuklab bo'lmadi.</p>}

      {status === 'ready' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {mentors.map((m) => (
            <div key={m.id} className="card" style={{ padding:16, display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:40, height:40, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f9ff', border:'1.5px solid #bae6fd', flexShrink:0, fontSize:13, fontWeight:800, color:'#0ea5e9' }}>
                {initials(m.name)}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{m.name}</p>
                <p style={{ fontSize:12, color:'#94a3b8' }}>{m.specialty} · {m.courses?.length || 0} kurs</p>
              </div>
              {m.featured && <span className="tag" style={{ background:'#faf5ff', borderColor:'#e9d5ff', color:'#9333ea' }}>Tavsiya</span>}
              <button onClick={() => startEdit(m)} style={{ width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#475569' }}>
                <Pencil size={14}/>
              </button>
              <button onClick={() => remove(m.id)} style={{ width:32, height:32, borderRadius:8, border:'1px solid #fecaca', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#dc2626' }}>
                <Trash2 size={14}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
