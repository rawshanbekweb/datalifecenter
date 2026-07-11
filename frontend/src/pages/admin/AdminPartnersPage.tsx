import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertCircle, Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { listPartners, createPartner, updatePartner, deletePartner } from '../../api/partners';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import FileUpload from '../../components/common/FileUpload';

interface PartnerFormState {
  id?: string | number;
  name: string;
  logoUrl: string;
  websiteUrl: string;
  category: string;
  featured: boolean;
}

interface Partner {
  id: string | number;
  name: string;
  logoUrl: string;
  websiteUrl?: string | null;
  category: string;
  featured: boolean;
  [key: string]: unknown;
}

type Status = 'loading' | 'ready' | 'error';

const emptyForm: PartnerFormState = { name:'', logoUrl:'/partners/placeholder-logo.svg', websiteUrl:'', category:'', featured:false };

interface PartnerFormProps {
  initial: PartnerFormState;
  onCancel: () => void;
  onSaved: () => void;
}

function PartnerForm({ initial, onCancel, onSaved }: PartnerFormProps): React.ReactElement {
  const { t } = useTranslation();
  const [form, setForm]     = useState<PartnerFormState>(initial);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError]   = useState<string>('');

  const change = (field: keyof PartnerFormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: val }));
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setStatus('loading');
    try {
      if (form.id) {
        await updatePartner(form.id, form);
      } else {
        await createPartner(form);
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || t('common.error'));
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
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>{t('admin.partners.fName')}</label>
          <input className="inp" value={form.name} onChange={change('name')} required />
        </div>
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>{t('admin.form.categoryReq')}</label>
          <input className="inp" value={form.category} onChange={change('category')} required placeholder={t('admin.partners.categoryPlaceholder')} />
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <FileUpload kind="image" label={t('admin.partners.fLogo')} required value={form.logoUrl}
          onChange={(url) => setForm((f: PartnerFormState) => ({ ...f, logoUrl: url }))} />
        <div>
          <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>{t('admin.partners.fWebsite')}</label>
          <input className="inp" value={form.websiteUrl} onChange={change('websiteUrl')} placeholder="https://..." />
        </div>
      </div>
      <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#334155', cursor:'pointer' }}>
        <input type="checkbox" checked={form.featured} onChange={change('featured')} /> {t('admin.form.featuredCheck')}
      </label>
      <div style={{ display:'flex', gap:10, marginTop:6 }}>
        <button type="submit" disabled={status==='loading'} className="btn-primary" style={{ opacity: status==='loading'?0.7:1 }}>
          {status==='loading' ? t('common.saving') : t('common.save')}
        </button>
        <button type="button" onClick={onCancel} className="btn-outline">{t('common.cancel')}</button>
      </div>
    </form>
  );
}

export default function AdminPartnersPage(): React.ReactElement {
  const { t } = useTranslation();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [status, setStatus]     = useState<Status>('loading');
  const [editing, setEditing]   = useState<PartnerFormState | null>(null);

  const load = (): void => {
    setStatus('loading');
    listPartners().then((data) => { setPartners(data as Partner[]); setStatus('ready'); }).catch(() => setStatus('error'));
  };

  useEffect(load, []);

  const startEdit = (p: Partner): void => setEditing({
    id: p.id, name: p.name, logoUrl: p.logoUrl, websiteUrl: p.websiteUrl || '', category: p.category, featured: p.featured,
  });

  const remove = async (id: string | number): Promise<void> => {
    if (!window.confirm(t('admin.partners.confirmDelete'))) return;
    try {
      await deletePartner(id);
      load();
    } catch (err: any) {
      alert(err.message || t('common.error'));
    }
  };

  return (
    <div>
      <AdminPageHeader title={t('admin.partners.title')} sub={t('admin.partners.sub')}
        actions={
          !editing ? (
            <button onClick={() => setEditing({ ...emptyForm })} className="btn-primary" style={{ fontSize:13 }}>
              <Plus size={15}/> {t('admin.partners.newBtn')}
            </button>
          ) : undefined
        } />

      {editing && <PartnerForm initial={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}

      {status === 'loading' && <p style={{ color:'#94a3b8', fontSize:14 }}>{t('common.loading')}</p>}
      {status === 'error' && <p style={{ color:'#dc2626', fontSize:14 }}>{t('common.loadFailed')}</p>}

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
              {p.featured && <span className="tag" style={{ background:'#faf5ff', borderColor:'#e9d5ff', color:'#9333ea' }}>{t('admin.tags.featured')}</span>}
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
