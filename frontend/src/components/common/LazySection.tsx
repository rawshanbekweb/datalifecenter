import React, { Suspense, useEffect, useRef, useState } from 'react';

/**
 * Bosh sahifa bo'limini EKRANGA YAQINLASHGANDA yuklaydi.
 *
 * Ilgari to'qqizta bo'limning hammasi sahifa ochilishi bilan yuklanardi:
 * to'qqizta JS chunk va oltitagacha API so'rovi Hero bilan BIR VAQTDA tarmoq
 * uchun kurashardi, holbuki tashrifchi avvaliga faqat Hero'ni ko'radi.
 *
 * IKKITA ishga tushirgich bor va ikkalasi ham zarur:
 *
 *  1. **Kesishuv kuzatuvchisi** (600px zaxira bilan) — bo'lim ko'rinishidan
 *     oldinroq tayyor bo'ladi, foydalanuvchi bo'sh joyni ko'rmaydi.
 *
 *  2. **Sahifa tinchigach ishlaydigan zaxira** — aylantirmaydigan tashrifchi
 *     va QIDIRUV ROBOTLARI uchun. Google ko'rinish oynasini cho'zib render
 *     qiladi, ya'ni birinchi yo'l unga ham yetadi; lekin ijtimoiy tarmoq va
 *     boshqa robotlar bunday qilmaydi, indeksdan bo'lim tushib qolishi esa
 *     tezlikdan qimmatroq. Shu sabab kontent HAR HOLDA DOM'ga tushadi —
 *     kechiktiriladi, tashlab yuborilmaydi.
 *
 * Vaqt o'rniga `requestIdleCallback` ishlatiladi: sekin qurilmada brauzer
 * asosiy ishni tugatgunga qadar kutadi, tez qurilmada esa deyarli darhol
 * yuklaydi. Qo'llab-quvvatlanmasa oddiy taymerga tushadi.
 */

const ROOT_MARGIN = '600px';
const IDLE_TIMEOUT_MS = 3000;

/** Brauzer bo'shaganda chaqiradi; bekor qilish funksiyasini qaytaradi. */
function onIdle(callback: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(callback, { timeout: IDLE_TIMEOUT_MS });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(callback, IDLE_TIMEOUT_MS);
  return () => window.clearTimeout(id);
}

interface LazySectionProps {
  /** Bo'lim langari (#courses kabi) — bo'lim kelmaguncha ham havola ishlashi uchun */
  anchorId?: string;
  /** O'rin egallovchining balandligi: bo'lim kelganda sahifa sakramasligi uchun */
  minHeight?: number;
  children: React.ReactNode;
}

export default function LazySection({
  anchorId,
  minHeight = 280,
  children,
}: LazySectionProps): React.ReactElement {
  const [show, setShow] = useState<boolean>(false);
  const holder = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (show) return;
    const reveal = (): void => setShow(true);

    // Manzilda shu bo'limning langari bo'lsa kutib o'tirmaymiz: brauzer
    // aynan o'sha joyga aylantirmoqchi, bo'lim esa hali o'rnida yo'q edi
    const matchesHash = (): boolean => !!anchorId && window.location.hash === `#${anchorId}`;
    if (matchesHash()) {
      reveal();
      return;
    }

    const onHashChange = (): void => { if (matchesHash()) reveal(); };
    window.addEventListener('hashchange', onHashChange);

    const cancelIdle = onIdle(reveal);
    const cleanup = (): void => {
      cancelIdle();
      window.removeEventListener('hashchange', onHashChange);
    };

    const el = holder.current;
    if (!el || typeof IntersectionObserver === 'undefined') return cleanup;

    const observer = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) reveal(); },
      { rootMargin: ROOT_MARGIN },
    );
    observer.observe(el);

    return () => {
      cleanup();
      observer.disconnect();
    };
  }, [show, anchorId]);

  // Langar id o'rin egallovchida ham turadi — #contact kabi havolalar bo'lim
  // yuklangunga qadar ham to'g'ri joyga olib boradi
  if (!show) {
    return <div ref={holder} id={anchorId} style={{ minHeight }} />;
  }

  return <Suspense fallback={<div id={anchorId} style={{ minHeight }} />}>{children}</Suspense>;
}
