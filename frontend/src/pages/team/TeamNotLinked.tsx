import { AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Hisob jamoa profiliga bog'lanmagan holat — jamoa kabinetining hamma sahifasida bir xil
export default function TeamNotLinked({ message }: { message?: string }): React.ReactElement {
  const { t } = useTranslation();
  return (
    <div className="card" style={{ padding: 32, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <AlertCircle size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
      <div>
        <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{t('team.notLinked.title')}</p>
        <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.7 }}>
          {message || t('team.notLinked.message')}
        </p>
      </div>
    </div>
  );
}
