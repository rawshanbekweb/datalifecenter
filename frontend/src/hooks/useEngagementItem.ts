import { useContext, useEffect } from 'react';
import { EngagementTarget } from '../api/engagement';
import { EngagementContext, EngagementEntry, entryKey } from '../context/engagement-context';

export interface EngagementItem extends EngagementEntry {
  /** Yoqtirishni almashtiradi */
  toggle: () => void;
}

const EMPTY: EngagementEntry = { likesCount: 0, views: null, liked: false };

/**
 * Bitta kontent elementining hisoblagichlarini beradi va uni providerning
 * paketli so'roviga ro'yxatdan o'tkazadi.
 *
 * Provider bo'lmasa (masalan alohida test muhitida) nol qiymatlar qaytadi
 * va bosish hech narsa qilmaydi — komponent baribir yiqilmaydi.
 */
export function useEngagementItem(target: EngagementTarget, id: string | undefined): EngagementItem {
  const ctx = useContext(EngagementContext);

  useEffect(() => {
    if (!ctx || !id) return;
    return ctx.register(target, id);
  }, [ctx, target, id]);

  const entry = (id && ctx?.entries[entryKey(target, id)]) || EMPTY;

  return {
    ...entry,
    toggle: () => { if (ctx && id) ctx.toggle(target, id); },
  };
}
