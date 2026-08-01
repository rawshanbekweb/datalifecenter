import { useEffect, useRef, useState } from 'react';
import { Upload, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getUploadConfig, uploadFile } from '../../api/uploads';

/**
 * Bulut xotira holati bir marta so'raladi va butun panel bo'ylab
 * bo'lishiladi — har bir yuklash maydoni alohida so'rov yubormasin
 * (bitta formada 3-4 ta maydon bo'lishi mumkin).
 */
let cloudStoragePromise: Promise<boolean> | null = null;

function checkCloudStorage(): Promise<boolean> {
  if (!cloudStoragePromise) {
    cloudStoragePromise = getUploadConfig()
      .then((cfg) => cfg.cloudStorage)
      // Holatni bilib bo'lmadi — ogohlantirishni ko'rsatmaymiz (noto'g'ri
      // signal bermaslik uchun), yuklashning o'zi baribir ishlaydi
      .catch(() => true);
  }
  return cloudStoragePromise;
}

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  kind: 'image' | 'video';
  label?: string;
  required?: boolean;
  placeholder?: string;
}

const ACCEPT: Record<FileUploadProps['kind'], string> = {
  image: 'image/jpeg,image/png,image/webp,image/gif',
  video: 'video/mp4,video/webm',
};

// URL kiritish + kompyuterdan yuklash birlashtirilgan maydon.
// Yuklangandan keyin URL avtomatik to'ldiriladi.
export default function FileUpload({ value, onChange, kind, label, required, placeholder }: FileUploadProps): React.ReactElement {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError]       = useState<string>('');
  const [done, setDone]         = useState<boolean>(false);
  const [ephemeral, setEphemeral] = useState<boolean>(false);

  // Bulut xotira o'chiq bo'lsa yuklash "ishlaydi", lekin fayl keyingi
  // deployda yo'qoladi va sayt bo'ylab singan rasmlar qoladi — admin
  // buni yuklashdan OLDIN bilishi kerak
  useEffect(() => {
    let cancelled = false;
    void checkCloudStorage().then((enabled) => { if (!cancelled) setEphemeral(!enabled); });
    return () => { cancelled = true; };
  }, []);

  const pick = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    setError('');
    setDone(false);
    setProgress(0);
    try {
      const result = await uploadFile(file, kind, setProgress);
      onChange(result.url);
      setDone(true);
    } catch (err: unknown) {
      setError((err as Error).message || t('upload.error'));
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const uploading = progress !== null;

  return (
    <div>
      {label && <label style={{ fontSize:12, color:'#475569', fontWeight:600, display:'block', marginBottom:5 }}>{label}</label>}
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        {kind === 'image' && value && (
          <img src={value} alt="" style={{ width:38, height:38, borderRadius:9, objectFit:'cover', border:'1.5px solid #e2e8f0', flexShrink:0 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        )}
        <input className="inp" value={value} required={required} disabled={uploading}
          onChange={(e) => { onChange(e.target.value); setDone(false); }}
          placeholder={placeholder || (kind === 'image' ? t('upload.imagePlaceholder') : t('upload.videoPlaceholder'))}
          style={{ flex:1, minWidth:0 }} />
        <button type="button" className="btn-outline" disabled={uploading}
          onClick={() => inputRef.current?.click()}
          style={{ fontSize:12, padding:'9px 13px', flexShrink:0, whiteSpace:'nowrap', opacity: uploading ? 0.6 : 1 }}>
          {done ? <CheckCircle2 size={13} style={{ color:'#16a34a' }} /> : <Upload size={13} />}
          {uploading ? `${progress}%` : t('upload.button')}
        </button>
        <input ref={inputRef} type="file" accept={ACCEPT[kind]} style={{ display:'none' }}
          onChange={(e) => pick(e.target.files?.[0])} />
      </div>
      {uploading && (
        <div style={{ marginTop:6, height:4, borderRadius:4, background:'#f1f5f9', overflow:'hidden' }}>
          <div style={{ width:`${progress}%`, height:'100%', borderRadius:4, background:'#0ea5e9', transition:'width 0.2s' }} />
        </div>
      )}
      {error && <p style={{ fontSize:12, color:'#dc2626', marginTop:5 }}>{error}</p>}
      {ephemeral && (
        <div style={{ display:'flex', alignItems:'flex-start', gap:7, marginTop:6, padding:'7px 10px', borderRadius:9, background:'#fffbeb', border:'1px solid #fde68a' }}>
          <AlertTriangle size={13} style={{ color:'#d97706', flexShrink:0, marginTop:1 }} />
          <p style={{ fontSize:11.5, color:'#92400e', lineHeight:1.6 }}>{t('upload.ephemeralWarning')}</p>
        </div>
      )}
    </div>
  );
}
