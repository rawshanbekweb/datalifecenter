import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, X } from 'lucide-react';

interface BulkActionBarProps {
  count: number;
  allSelected: boolean;
  onToggleAll: () => void;
  onDelete: () => void;
  onClear: () => void;
  busy?: boolean;
}

/**
 * Ro'yxat tepasidagi belgilash paneli.
 *
 * Doim ko'rinib turadi (hech narsa belgilanmaganda ham) — "sahifadagi
 * hammasini belgilash" katagi aynan shu yerda va u yashirin bo'lsa
 * foydalanuvchi ommaviy o'chirish borligini umuman bilmasdi.
 *
 * O'chirish tugmasi belgilangandagina faollashadi; tasdiqlash oynasi
 * chaqiruvchi sahifada (u nima o'chayotganini nomi bilan aytadi).
 */
export default function BulkActionBar({
  count, allSelected, onToggleAll, onDelete, onClear, busy = false,
}: BulkActionBarProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      padding: '10px 14px', marginBottom: 14, borderRadius: 12,
      background: count > 0 ? '#f0f9ff' : '#f8fafc',
      border: `1.5px solid ${count > 0 ? '#bae6fd' : '#e2e8f0'}`,
      transition: 'background 0.2s, border-color 0.2s',
    }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#334155', fontWeight: 600, cursor: 'pointer' }}>
        <input type="checkbox" checked={allSelected} onChange={onToggleAll}
          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#0ea5e9' }} />
        {t('admin.bulk.selectAllOnPage')}
      </label>

      {count > 0 && (
        <>
          <span style={{ fontSize: 13, color: '#0369a1', fontWeight: 700 }}>
            {t('admin.bulk.selectedCount', { n: count })}
          </span>
          <button onClick={onDelete} disabled={busy}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto',
              padding: '7px 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 700,
              background: '#fef2f2', border: '1.5px solid #fecaca', color: '#dc2626',
              cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
            }}>
            <Trash2 size={14} /> {t('admin.bulk.deleteSelected')}
          </button>
          <button onClick={onClear} disabled={busy} title={t('admin.bulk.clear')}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 8,
              background: '#fff', border: '1.5px solid #e2e8f0', color: '#64748b',
              cursor: busy ? 'default' : 'pointer',
            }}>
            <X size={15} />
          </button>
        </>
      )}
    </div>
  );
}
