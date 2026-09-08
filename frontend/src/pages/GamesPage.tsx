import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SectionHeader from '../components/common/SectionHeader';
import GameCard, { GameCardData } from '../components/games/GameCard';
import { listGames } from '../api/games';
import Loading from '../components/common/Loading';
import Seo from '../components/common/Seo';

type Game = GameCardData;

type Status = 'loading' | 'ready' | 'error';

export default function GamesPage(): React.ReactElement {
  const { t } = useTranslation();
  const [games, setGames]   = useState<Game[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let cancelled = false;
    listGames()
      .then((data: Game[]) => { if (!cancelled) { setGames(data); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="section-light" style={{ padding: '160px 0 104px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <Seo title={t('seo.games.title')} description={t('seo.games.description')} />
        <SectionHeader pill={t('pages.games.pill')} title={t('pages.games.title')} accent={t('pages.games.accent')} sub={t('pages.games.sub')} />

        {status === 'loading' && <Loading center />}
        {status === 'error' && <p style={{ textAlign: 'center', color: '#dc2626', fontSize: 14 }}>{t('pages.games.loadError')}</p>}
        {status === 'ready' && games.length === 0 && (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>{t('pages.games.empty')}</p>
        )}
        {status === 'ready' && games.length > 0 && (
          // Flex + markazlashtirish ATAYIN, grid emas: o'yinlar soni o'sib boradi va
          // toq sonda (masalan bitta) grid'ning bo'sh qatori yarim ekranni yalang'och
          // qoldirardi. Har karta o'z eniga ega, kam bo'lsa markazda, ko'p bo'lsa
          // qatorga tizilib ketadi.
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24 }}>
            {games.map((g, i) => (
              <div key={g.id} style={{ flex: '1 1 380px', maxWidth: 460, display: 'flex' }}>
                <GameCard game={g} index={i} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
