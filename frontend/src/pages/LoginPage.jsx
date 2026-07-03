import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm]     = useState({ email:'', password:'' });
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setStatus('loading');
    try {
      await login(form);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setErrorMsg(err.message || "Kirishda xatolik yuz berdi");
      setStatus('error');
    }
  };

  return (
    <section style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'140px 24px 60px' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} style={{ width:'100%', maxWidth:420 }}>
        <div className="card" style={{ padding:32, boxShadow:'0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
            <div className="icon-box"><LogIn size={18} style={{ color:'#0ea5e9' }} /></div>
            <div>
              <p style={{ fontWeight:800, color:'#0f172a', fontSize:16 }}>Tizimga kirish</p>
              <p style={{ fontSize:12, color:'#94a3b8' }}>DATA LIFE hisobingizga kiring</p>
            </div>
          </div>

          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {status === 'error' && (
              <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:12, background:'#fef2f2', border:'1.5px solid #fecaca' }}>
                <AlertCircle size={16} style={{ color:'#dc2626', flexShrink:0 }} />
                <p style={{ fontSize:13, color:'#dc2626' }}>{errorMsg}</p>
              </motion.div>
            )}
            <div>
              <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Email</label>
              <input className="inp" type="email" name="email" value={form.email} onChange={change} required placeholder="you@example.com" />
            </div>
            <div>
              <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>Parol</label>
              <input className="inp" type="password" name="password" value={form.password} onChange={change} required placeholder="••••••••" />
            </div>
            <button type="submit" disabled={status==='loading'} className="btn-primary"
              style={{ justifyContent:'center', opacity:status==='loading'?0.7:1, marginTop:6 }}>
              {status==='loading' ? <><Loader size={15} style={{ animation:'spin 1s linear infinite' }}/> Kirilmoqda...</> : 'Kirish'}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:13, color:'#64748b', marginTop:20 }}>
            Hisobingiz yo'qmi? <Link to="/register" style={{ color:'#0ea5e9', fontWeight:700, textDecoration:'none' }}>Ro'yxatdan o'ting</Link>
          </p>
        </div>
      </motion.div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </section>
  );
}
