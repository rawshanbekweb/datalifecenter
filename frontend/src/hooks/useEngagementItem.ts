import { useContext, useEffect } from 'react';
import { EngagementTarget } from '../api/engagement';
import { EngagementContext, EngagementEntry, entryKey } from '../context/engagement-context';

export interface EngagementItem extends EngagementEntry {
  /** Yoqtirishni almashtiradi */
  toggle: () => void;
}

const EMPTY: EngagementEntry = { likesCount: 0, views: null, liked: false };

/** Kontentning o'z javobidan kelgan boshlang'ich raqamlar */
export interface EngagementFallback {
  likesCount?: number | null;
  views?: number | null;
}

/**
 * Bitta kontent elementining hisoblagichlarini beradi va uni providerning
 * paketli so'roviga ro'yxatdan o'tkazadi.
 *
 * Provider bo'lmasa (masalan alohida test muhitida) nol qiymatlar qaytadi
 * va bosish hech narsa qilmaydi — komponent baribir yiqilmaydi.
 *
 * `fallback` — kontent ro'yxatining O'ZI qaytargan raqamlar (`likesCount`,
 * `views`). Ular paketli so'rov javobi kelgunga qadar ko'rsatiladi: busiz
 * karta avval "0 yoqtirish" bo'lib chiqib, keyin haqiqiy raqamga sakrardi,
 * so'rov muvaffaqiyatsiz bo'lsa esa noldaligicha qolardi.
 */
export function useEngagementItem(
  target: EngagementTarget,
  id: string | undefined,
  fallback?: EngagementFallback,
): EngagementItem {
  const ctx = useContext(EngagementContext);
  const register = ctx?.register;

  // DIQQAT: bog'liqlikda `ctx` EMAS, aynan `register` turishi shart.
  // `ctx` obyekti hisoblagichlar har yangilanganda yangi identifikatorga ega
  // bo'ladi — u bog'liqlikda tursa cheksiz halqa hosil bo'lardi:
  //   entries yangilandi → ctx yangi → effekt qayta ishladi → register()
  //   → scheduleRefresh() → yangi so'rov → entries yangilandi → ...
  // `register` esa useCallback bilan barqaror, shuning uchun effekt faqat
  // element haqiqatan almashganda qayta ishlaydi.
  useEffect(() => {
    if (!register || !id) return;
    return register(target, id);
  }, [register, target, id]);

  const loaded = id ? ctx?.entries[entryKey(target, id)] : undefined;
  // Server javobi kelgan bo'lsa u ustun turadi (yoqtirish holati faqat unda bor)
  const entry: EngagementEntry = loaded ?? {
    likesCount: fallback?.likesCount ?? EMPTY.likesCount,
    views: fallback?.views ?? EMPTY.views,
    liked: EMPTY.liked,
  };

  return {
    ...entry,
    toggle: () => { if (ctx && id) ctx.toggle(target, id); },
  };
}
