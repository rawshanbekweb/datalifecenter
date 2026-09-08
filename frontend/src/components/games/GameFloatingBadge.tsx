import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Gamepad2, Download } from 'lucide-react';
import { listGames } from '../../api/games';
import { Z } from '../../utils/zLayers';

interface GamePreview {
  id: string;
  title: string;
  logoUrl?: string | null;
}

// Joriy sessiyada yopilgan bo'lsa qayta ko'rsatilmaydi — reklama-uslubidagi
// elementni har sahifa yangilanishida qayta chiqarish bezovta qiladi.
const DISMISS_KEY = 'dl_game_badge_dismissed';

/**
 * Bosh sahifaning chap-pastki chetida suziб turadigan kichik reklama-tugma —
 * "O'yinlar" header'da alohida band sifatida emas, aynan shu ko'rinishda
 * bo'lishi so'ralgan. Faqat kamida bitta nashr etilgan o'yin bo'lsa chiqadi,
 * bosilsa /games'ga olib boradi.
 *
 * ATAYIN faqat HomePage'da mount qilinadi (MainLayout'da emas) — boshqa
 * sahifalarda ko'rinmasligi kerak.
 */
export default function GameFloatingBadge(): React.ReactElement | null {
  const { t } = useTranslation();
  const [game, setGame] = useState<GamePreview | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  });

  useEffect(() => {
    let cancelled = false;
    listGames()
      .then((data: GamePreview[]) => { if (!cancelled && data.length > 0) setGame(data[0]); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const dismiss = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* xotira yo'q — jimgina o'tamiz */ }
  };

  return (
    <AnimatePresence>
      {game && !dismissed && (
        <m.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 260, damping: 22 }}
          style={{ position: 'fixed', bottom: 24, left: 24, zIndex: Z.floating }}>
          <Link to="/games" style={{ textDecoration: 'none' }}>
            <m.div whileHover={{ y: -3 }} className="card"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px 9px 9px', borderRadius: 50, boxShadow: '0 10px 30px rgba(15,23,42,0.18)' }}>
              {game.logoUrl ? (
                <img src={game.logoUrl} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Gamepad2 size={18} style={{ color: '#0ea5e9' }} />
                </div>
              )}
              <div>
                <p style={{ fontSize: 10.5, fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'var(--font-mono)' }}>
                  {t('pages.games.pill')}
                </p>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Download size={12} /> {game.title}
                </p>
              </div>
            </m.div>
          </Link>
          <button onClick={dismiss} aria-label={t('common.close')}
            style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', border: '1.5px solid #e2e8f0', background: '#fff', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            <X size={11} />
          </button>
        </m.div>
      )}
    </AnimatePresence>
  );
}
