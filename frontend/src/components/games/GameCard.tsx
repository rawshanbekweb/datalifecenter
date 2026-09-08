import React, { useState } from 'react';
import { m } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Gamepad2, Download, Smartphone, Sparkles } from 'lucide-react';
import { API_URL } from '../../api/config';

export interface GameCardData {
  id: string;
  title: string;
  description: string;
  logoUrl?: string | null;
  apkUrl: string;
  version: string;
  apkSizeBytes?: number | null;
  downloadsCount?: number;
  featured?: boolean;
  [key: string]: unknown;
}

/**
 * Bosishni fon rejimida hisoblaydi — javobni kutmaydi, muvaffaqiyatsiz
 * bo'lsa ham yuklab olishning o'ziga xalaqit bermaydi. ATAYIN POST orqali:
 * GET so'rov (masalan `<a href>`ning o'zi) brauzer/xavfsizlik dasturi
 * tomonidan so'ralmasdan yuborilishi mumkin va hisobni soxta oshiradi.
 */
function countDownload(id: string): void {
  fetch(`${API_URL}/games/${id}/download`, { method: 'POST', keepalive: true }).catch(() => {});
}

interface GameCardProps {
  game: GameCardData;
  index?: number;
}

export default function GameCard({ game, index = 0 }: GameCardProps): React.ReactElement {
  const { t } = useTranslation();
  // Logotip yuklanmasa zaxira ikonka ko'rsatiladi (PartnerCard'dagi bilan bir xil qoida)
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = Boolean(game.logoUrl) && !logoFailed;
  const sizeMb = game.apkSizeBytes ? Math.round((game.apkSizeBytes / (1024 * 1024)) * 10) / 10 : null;
  const downloads = game.downloadsCount ?? 0;

  return (
    <m.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.45, delay: (index % 4) * 0.08 }} whileHover={{ y: -6 }} className="card"
      style={{ position: 'relative', overflow: 'hidden', padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Nozik bezak — kartaning "reklama" hissini kuchaytiradi, matnga xalaqit bermaydi */}
      <div aria-hidden style={{
        position: 'absolute', top: -50, right: -50, width: 160, height: 160, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(14,165,233,0.14), transparent 70%)', pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', position: 'relative' }}>
        {showLogo ? (
          <img src={game.logoUrl!} alt={game.title} onError={() => setLogoFailed(true)}
            style={{ width: 64, height: 64, borderRadius: 18, objectFit: 'cover', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 14px rgba(15,23,42,0.08)', flexShrink: 0 }} />
        ) : (
          <div style={{ display: 'flex', width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', background: '#f0f9ff', border: '1.5px solid #bae6fd', flexShrink: 0 }}>
            <Gamepad2 size={28} style={{ color: '#0ea5e9' }} />
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{game.title}</h3>
            {game.featured && (
              <span className="tag" style={{ background: '#faf5ff', borderColor: '#e9d5ff', color: '#9333ea', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Sparkles size={10} /> {t('pages.games.featuredTag')}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            <span className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Smartphone size={11} /> Android
            </span>
            <span className="tag">{t('pages.games.version')} {game.version}</span>
            {sizeMb && <span className="tag">{sizeMb} MB</span>}
          </div>
        </div>
      </div>

      <p style={{
        fontSize: 13.5, color: '#64748b', lineHeight: 1.75, whiteSpace: 'pre-line',
        display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>{game.description}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
        {downloads > 0 && (
          <span style={{ fontSize: 12, color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <Download size={12} /> {t('pages.games.downloads', { n: downloads })}
          </span>
        )}
        {/* target="_blank" ATAYIN qo'yilmagan: fayl (APK) render qilinmaydigan
            tur bo'lgani uchun brauzer joriy sahifada turgan holda yuklashni
            boshlaydi — yangi bo'sh tab ochib qolmaydi. */}
        <a href={game.apkUrl} onClick={() => countDownload(game.id)} style={{ display: 'block' }}>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px 18px' }}>
            <Download size={16} /> {t('pages.games.downloadBtn')}
          </button>
        </a>
      </div>
    </m.div>
  );
}
