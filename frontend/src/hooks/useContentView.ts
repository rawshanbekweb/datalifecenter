import { useCallback, useContext, useEffect, useRef } from 'react';
import { EngagementTarget, registerView } from '../api/engagement';
import { EngagementContext } from '../context/engagement-context';

/**
 * Kontent ochilganda ko'rishni qayd etadi va yangi hisobni darhol ekranga
 * chiqaradi.
 *
 * NEGA ALOHIDA SO'ROV: kontentning O'ZI (GET /blog/:slug) keshlanadi —
 * agar ko'rish o'sha so'rovda hisoblanganda edi, keshdan berilgan javob
 * hisobni umuman oshirmasdi.
 *
 * Dublikat ikki qavatda to'siladi: bu yerda `sent` (React StrictMode dev
 * rejimida effektni ikki marta chaqiradi) va serverda qurilma bo'yicha
 * 24 soatlik oyna.
 */
export function useContentView(target: EngagementTarget, id: string | undefined): void {
  const ctx = useContext(EngagementContext);
  const applyViews = ctx?.applyViews;
  const sent = useRef<string | null>(null);

  // Bog'liqlikda `ctx` emas, barqaror `applyViews` turadi — `ctx` obyekti har
  // hisoblagich yangilanishida almashadi (useEngagementItem'dagi izohga qarang)
  useEffect(() => {
    if (!id || sent.current === id) return;
    sent.current = id;

    registerView(target, id)
      .then((res) => applyViews?.(target, id, res.views))
      // Hisoblagich bezak: tarmoq xatosi sahifani buzmasligi kerak
      .catch(() => undefined);
  }, [applyViews, target, id]);
}

/**
 * Ko'rishni sahifa ochilganda emas, ANIQ HARAKATDA qayd etish uchun
 * (masalan loyihaning o'z saytiga o'tish — loyihaning alohida sahifasi yo'q).
 */
export function useViewRegistrar(): (target: EngagementTarget, id: string) => void {
  const ctx = useContext(EngagementContext);
  const applyViews = ctx?.applyViews;

  return useCallback(
    (target: EngagementTarget, id: string) => {
      registerView(target, id)
        .then((res) => applyViews?.(target, id, res.views))
        .catch(() => undefined);
    },
    [applyViews],
  );
}
