import { useTranslation } from 'react-i18next';

/**
 * Admin ro'yxatlaridagi sahifa boshqaruvi.
 *
 * Backend allaqachon `pagination` qaytaradi, lekin ba'zi sahifalar faqat
 * birinchi 50 yozuvni so'rab, qolganini umuman ko'rsatmasdi. Boshqaruv bir
 * nechta sahifada takrorlanganidan keyin shu yerga chiqarildi.
 */
export default function Pagination({ page, totalPages, onChange }: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}): React.ReactElement | null {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginTop:20 }}>
      <button className="btn-outline" style={{ fontSize:12.5, padding:'7px 14px', opacity: page <= 1 ? 0.5 : 1 }}
        disabled={page <= 1} onClick={() => onChange(page - 1)}>{t('admin.common.prev')}</button>
      <span style={{ fontSize:13, color:'#64748b', fontWeight:600 }}>{page} / {totalPages}</span>
      <button className="btn-outline" style={{ fontSize:12.5, padding:'7px 14px', opacity: page >= totalPages ? 0.5 : 1 }}
        disabled={page >= totalPages} onClick={() => onChange(page + 1)}>{t('admin.common.next')}</button>
    </div>
  );
}
