import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { getServerState, subscribeServerState, type ServerState } from '../../api/serverStatus';
import { Z } from '../../utils/zLayers';

/**
 * Server (bepul Render rejasida) uxlab qolgan bo'lsa birinchi so'rov yarim
 * daqiqagacha cho'ziladi. Bunday paytda sayt jim turgani foydalanuvchiga
 * "buzilgan" bo'lib ko'rinadi — shu bannеr nima bo'layotganini aytadi.
 * So'rov 4 soniyadan oshgandagina chiqadi, ya'ni normal holatda ko'rinmaydi.
 */
export default function ServerWakeBanner(): React.ReactElement | null {
  const { t } = useTranslation();
  const [state, setState] = useState<ServerState>(getServerState);

  useEffect(() => subscribeServerState(setState), []);

  if (state !== 'waking') return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed', left: '50%', bottom: 20, transform: 'translateX(-50%)', zIndex: Z.banner,
        display: 'flex', alignItems: 'center', gap: 10, maxWidth: 'calc(100vw - 32px)',
        padding: '10px 16px', borderRadius: 999,
        background: 'rgba(15,23,42,0.92)', color: '#fff',
        fontSize: 13, fontWeight: 600, boxShadow: '0 8px 30px rgba(15,23,42,0.25)',
      }}
    >
      <Loader2 size={15} style={{ flexShrink: 0, animation: 'dl-spin 1s linear infinite' }} />
      <span>{t('common.serverWaking')}</span>
      <style>{'@keyframes dl-spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}
