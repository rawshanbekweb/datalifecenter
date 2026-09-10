import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle, X, AlertCircle, Monitor, MapPin, LogIn, MailWarning } from 'lucide-react';
import { createCourseRequest, type CourseRequestFormat } from '../../api/courseRequests';
import { useAuth } from '../../hooks/useAuth';
import { Z } from '../../utils/zLayers';

/**
 * "Ma'lumot olish / bog'lanish" formasi.
 *
 * Login TALAB QILINADI va email tasdiqlangan bo'lishi kerak (2026-08-14) —
 * server ham shuni tekshiradi. So'rov o'quvchi hisobiga bog'lanadi: guruh,
 * to'lov va kurs boshlanishi haqidagi xabarlar o'sha hisobga (va uning
 * pochtasiga) boradi, adminning javobi esa yozishmasiga tushadi.
 *
 * Shuning uchun modal formani ko'rsatishdan oldin ikkita to'siqni tekshiradi
 * va serverdan 401/403 kutib o'tirmaydi: mehmon kirish sahifasiga, emaili
 * tasdiqlanmagan odam esa profilidagi "qayta yuborish" tugmasiga yo'naltiriladi.
 */

interface Props {
  courseId: string;
  courseTitle: string;
  /** Kurs formati: HYBRID bo'lsa foydalanuvchi tanlaydi, aks holda qat'iy */
  courseFormat: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  /** Boshlang'ich tanlov (masalan "offline uchun bog'lanish" tugmasidan) */
  initialFormat?: CourseRequestFormat;
  onClose: () => void;
}

export default function CourseRequestModal({
  courseId,
  courseTitle,
  courseFormat,
  initialFormat,
  onClose,
}: Props): React.ReactElement {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();

  // Maydon eski javobda bo'lmasa to'sib qo'ymaymiz — server baribir tekshiradi
  const emailVerified = user?.emailVerified !== false;

  const [format, setFormat] = useState<CourseRequestFormat>(
    initialFormat ?? (courseFormat === 'OFFLINE' ? 'OFFLINE' : 'ONLINE'),
  );
  // Hisobdagi ma'lumot oldindan to'ldiriladi — ro'yxatdan o'tishda bir marta
  // yozilgan narsani qayta yozdirmaymiz. Tahrirlash ochiq: odam boshqa raqamda
  // yoki boshqa ism bilan bog'lanishni so'rashi mumkin.
  const [name, setName]   = useState<string>(user?.name ?? '');
  const [phone, setPhone] = useState<string>((user?.phone as string | null) ?? '');
  const [email, setEmail] = useState<string>(user?.email ?? '');
  const [note, setNote]   = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string>('');

  // Escape bilan yopish — modal uchun odatiy kutilma
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setStatus('loading');
    try {
      await createCourseRequest({
        courseId,
        format,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        note: note.trim() || undefined,
      });
      setStatus('done');
    } catch (err: unknown) {
      setError((err as Error).message || t('common.error'));
      setStatus('error');
    }
  };

  return (
    <div onClick={onClose}
      style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', zIndex:Z.modal, display:'flex', alignItems:'center', justifyContent:'center', padding:20, overflowY:'auto' }}>
      <div onClick={(e) => e.stopPropagation()} className="card"
        style={{ width:'100%', maxWidth:460, padding:24, maxHeight:'90vh', overflowY:'auto' }}>

        <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:16 }}>
          <div style={{ flex:1 }}>
            <h3 style={{ fontSize:17, fontWeight:800, color:'#0f172a' }}>{t('courseRequest.title')}</h3>
            <p style={{ fontSize:12.5, color:'#64748b', marginTop:3 }}>{courseTitle}</p>
          </div>
          <button onClick={onClose}
            style={{ width:30, height:30, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', color:'#475569', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <X size={15} />
          </button>
        </div>

        {!user ? (
          <div style={{ textAlign:'center', padding:'12px 0 4px' }}>
            <LogIn size={34} style={{ color:'#0ea5e9', marginBottom:12 }} />
            <p style={{ fontSize:14.5, fontWeight:700, color:'#0f172a', marginBottom:6 }}>{t('courseRequest.authTitle')}</p>
            <p style={{ fontSize:13, color:'#64748b', lineHeight:1.7 }}>{t('courseRequest.authSub')}</p>
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <Link to="/login" state={{ from: location.pathname }} style={{ flex:1, textDecoration:'none' }}>
                <button className="btn-primary" style={{ width:'100%', justifyContent:'center' }}>{t('nav.login')}</button>
              </Link>
              {/* Ro'yxatdan o'tish sahifasi `from` ni o'qimaydi: yangi hisob
                  baribir avval emailni tasdiqlashi kerak */}
              <Link to="/register" style={{ flex:1, textDecoration:'none' }}>
                <button className="btn-outline" style={{ width:'100%', justifyContent:'center' }}>{t('auth.login.registerLink')}</button>
              </Link>
            </div>
          </div>
        ) : !emailVerified ? (
          <div style={{ textAlign:'center', padding:'12px 0 4px' }}>
            <MailWarning size={34} style={{ color:'#d97706', marginBottom:12 }} />
            <p style={{ fontSize:14.5, fontWeight:700, color:'#0f172a', marginBottom:6 }}>{t('courseRequest.verifyTitle')}</p>
            <p style={{ fontSize:13, color:'#64748b', lineHeight:1.7 }}>{t('courseRequest.verifySub')}</p>
            {/* Profilda tasdiqlash xatini qayta yuborish tugmasi turadi */}
            <Link to="/profile" style={{ textDecoration:'none' }}>
              <button className="btn-primary" style={{ marginTop:16, width:'100%', justifyContent:'center' }}>
                {t('courseRequest.verifyAction')}
              </button>
            </Link>
          </div>
        ) : status === 'done' ? (
          <div style={{ textAlign:'center', padding:'12px 0 4px' }}>
            <CheckCircle size={34} style={{ color:'#16a34a', marginBottom:12 }} />
            <p style={{ fontSize:14.5, fontWeight:700, color:'#0f172a', marginBottom:6 }}>{t('courseRequest.doneTitle')}</p>
            <p style={{ fontSize:13, color:'#64748b', lineHeight:1.7 }}>{t('courseRequest.doneSubUser')}</p>
            <button onClick={onClose} className="btn-primary" style={{ marginTop:16, width:'100%', justifyContent:'center' }}>
              {t('common.close')}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {status === 'error' && (
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 13px', borderRadius:11, background:'#fef2f2', border:'1.5px solid #fecaca' }}>
                <AlertCircle size={15} style={{ color:'#dc2626', flexShrink:0 }} />
                <p style={{ fontSize:12.5, color:'#dc2626' }}>{error}</p>
              </div>
            )}

            {/* Format tanlovi faqat kurs ikkala shaklda o'tganda ma'noli */}
            {courseFormat === 'HYBRID' && (
              <div>
                <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:6 }}>{t('courseRequest.formatLabel')}</label>
                <div style={{ display:'flex', gap:8 }}>
                  {([
                    { value:'ONLINE' as const,  icon: Monitor },
                    { value:'OFFLINE' as const, icon: MapPin },
                  ]).map((option) => {
                    const Icon = option.icon;
                    const active = format === option.value;
                    return (
                      <button key={option.value} type="button" onClick={() => setFormat(option.value)}
                        style={{
                          flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                          padding:'9px 12px', borderRadius:11, fontSize:12.5, fontWeight:700, cursor:'pointer',
                          background: active ? '#0f172a' : '#fff', color: active ? '#fff' : '#475569',
                          border: `1.5px solid ${active ? '#0f172a' : '#e2e8f0'}`,
                        }}>
                        <Icon size={14} /> {t(`courseFormat.${option.value}`)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>{t('courseRequest.nameLabel')}</label>
              <input className="inp" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={120} />
            </div>

            <div>
              <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>{t('courseRequest.phoneLabel')}</label>
              <input className="inp" value={phone} onChange={(e) => setPhone(e.target.value)} required
                placeholder="+998 90 123 45 67" inputMode="tel" maxLength={25} />
            </div>

            <div>
              <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>{t('courseRequest.emailLabel')}</label>
              <input className="inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} />
            </div>

            <div>
              <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>{t('courseRequest.noteLabel')}</label>
              <textarea className="inp" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={2000}
                placeholder={t('courseRequest.notePlaceholder')} style={{ resize:'vertical' }} />
            </div>

            <button type="submit" disabled={status === 'loading'} className="btn-primary"
              style={{ width:'100%', justifyContent:'center', opacity: status === 'loading' ? 0.7 : 1 }}>
              {status === 'loading' ? t('common.sending') : t('courseRequest.submit')}
            </button>
            <p style={{ fontSize:11.5, color:'#94a3b8', textAlign:'center', lineHeight:1.6 }}>{t('courseRequest.privacyHint')}</p>
          </form>
        )}
      </div>
    </div>
  );
}
