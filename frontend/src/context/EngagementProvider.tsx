import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  EngagementTarget,
  getEngagementStats,
  toggleLike as apiToggleLike,
} from '../api/engagement';
import { EngagementContext, EngagementEntry, entryKey } from './engagement-context';

/**
 * Yoqtirish/ko'rish hisoblagichlarini butun ilova bo'ylab boshqaradi.
 *
 * Har bir yurak tugmasi o'zi so'rov yuborsa bitta blog sahifasi o'nlab
 * so'rovga aylanardi. Shu sabab tugmalar faqat ekranda paydo bo'lganini
 * RO'YXATDAN O'TKAZADI, provider esa ularni kontent turi bo'yicha guruhlab
 * bitta paketli so'rov yuboradi.
 *
 * NEGA SSE EMAS, DAVRIY SO'ROV:
 * Loyihada SSE bor, lekin u login talab qiladi va har ochiq ulanish serverda
 * doimiy resurs egallaydi. Hisoblagichlar esa MEHMONLARGA ham ko'rinadi —
 * ya'ni har bir tashrif buyuruvchiga doimiy ulanish kerak bo'lardi. Bepul
 * Render rejasidagi bitta instansda yuzlab shunday ulanish ochilish kuni
 * uchun qurilgan yuklama himoyasini yo'qqa chiqarardi. Davriy paketli so'rov
 * esa server keshidan o'qiladi va deyarli tekin.
 */

/**
 * Ochiq sahifada hisoblagichlarni qayta so'rash oralig'i.
 *
 * 30 soniya ATAYIN tanlangan. Bu so'rov qurilmaga bog'liq javob qaytaradi
 * (kim nimani yoqtirgani), shuning uchun uni server keshiga solib bo'lmaydi.
 * Ochilish marosimidek holatda bitta Wi-Fi ortidagi 300 mehmon 20 soniyalik
 * oraliqda daqiqasiga ~900 so'rov hosil qilardi — o'qish limitiga (3000/min)
 * keraksiz yaqinlashish. 30 soniyada hisoblagich baribir "jonli" ko'rinadi,
 * chunki foydalanuvchining O'Z bosishi darhol aks etadi (optimistik).
 */
const REFRESH_MS = 30_000;
// Ro'yxatga olishni yig'ish oynasi: bitta renderdagi o'nlab karta
// bitta so'rovga birlashsin
const BATCH_DELAY_MS = 60;

const TARGETS: EngagementTarget[] = ['blog', 'project', 'course', 'testimonial'];

export default function EngagementProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [entries, setEntries] = useState<Record<string, EngagementEntry>>({});

  // Ekranda turgan elementlar — refcount bilan, chunki bitta id bir vaqtda
  // bir necha joyda ko'rinishi mumkin (masalan bosh sahifada va ro'yxatda)
  const counts = useRef<Map<string, Map<string, number>>>(new Map());
  // Ro'yxat o'zgarganda qayta yuklashni ishga tushiradigan hisoblagich
  const [revision, setRevision] = useState(0);
  const batchTimer = useRef<number | null>(null);
  // Optimistik yangilanish server javobi bilan bekor bo'lmasligi uchun
  const pending = useRef<Set<string>>(new Set());

  const scheduleRefresh = useCallback(() => {
    if (batchTimer.current !== null) window.clearTimeout(batchTimer.current);
    batchTimer.current = window.setTimeout(() => {
      batchTimer.current = null;
      setRevision((r) => r + 1);
    }, BATCH_DELAY_MS);
  }, []);

  const register = useCallback((target: EngagementTarget, id: string) => {
    let perTarget = counts.current.get(target);
    if (!perTarget) {
      perTarget = new Map();
      counts.current.set(target, perTarget);
    }
    perTarget.set(id, (perTarget.get(id) ?? 0) + 1);
    scheduleRefresh();

    return () => {
      const map = counts.current.get(target);
      if (!map) return;
      const next = (map.get(id) ?? 1) - 1;
      if (next <= 0) map.delete(id);
      else map.set(id, next);
    };
  }, [scheduleRefresh]);

  // Ro'yxat o'zgarganda yoki davriy ravishda hisoblagichlarni yangilaydi
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const load = (): void => {
      // Ko'rinmayotgan tabda so'rov yuborishning ma'nosi yo'q
      if (document.visibilityState === 'hidden') return;

      for (const target of TARGETS) {
        const ids = [...(counts.current.get(target)?.keys() ?? [])];
        if (ids.length === 0) continue;

        getEngagementStats(target, ids, controller.signal)
          .then((list) => {
            if (cancelled) return;
            setEntries((prev) => {
              let changed = false;
              const next = { ...prev };
              for (const s of list) {
                const key = entryKey(target, s.contentId);
                // Ayni damda serverga yuborilgan bosish bor — eski javob
                // uni bekor qilib qo'ymasin
                if (pending.current.has(key)) continue;
                const old = prev[key];
                if (old && old.likesCount === s.likesCount && old.views === s.views && old.liked === s.liked) {
                  continue;
                }
                next[key] = { likesCount: s.likesCount, views: s.views, liked: s.liked };
                changed = true;
              }
              // Raqamlar o'zgarmagan bo'lsa AYNAN o'sha obyektni qaytaramiz:
              // yangi identifikator butun daraxtni (o'nlab kartani) 30 soniyada
              // bir marta bekorga qayta render qilardi
              return changed ? next : prev;
            });
          })
          // Hisoblagich bezak: tarmoq xatosi sahifani buzmasligi kerak
          .catch(() => {});
      }
    };

    load();
    const timer = window.setInterval(load, REFRESH_MS);
    // Tabga qaytilganda darhol yangilanadi
    document.addEventListener('visibilitychange', load);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', load);
    };
  }, [revision]);

  const toggle = useCallback((target: EngagementTarget, id: string) => {
    const key = entryKey(target, id);

    // Optimistik: bosilishi bilan yurak to'ladi
    const flip = (): void => setEntries((prev) => {
      const current = prev[key] ?? { likesCount: 0, views: null, liked: false };
      return {
        ...prev,
        [key]: {
          ...current,
          liked: !current.liked,
          likesCount: Math.max(0, current.likesCount + (current.liked ? -1 : 1)),
        },
      };
    });

    flip();
    pending.current.add(key);

    apiToggleLike(target, id)
      .then((res) => {
        setEntries((prev) => ({
          ...prev,
          [key]: { ...(prev[key] ?? { views: null }), liked: res.liked, likesCount: res.likesCount },
        }));
      })
      // Server rad etdi (limit, tarmoq) — optimistik o'zgarish qaytariladi
      .catch(flip)
      .finally(() => pending.current.delete(key));
  }, []);

  /**
   * Ko'rish serverda qayd etilgach hisobni darhol qo'yadi.
   *
   * Ilgari bu qiymat faqat keyingi davriy so'rovda (30 soniyagacha)
   * yangilanardi — foydalanuvchi maqolani ochib, o'z ko'rishi hisobga
   * qo'shilmaganday ko'rinardi. Server qaytargan raqam eng ishonchli
   * manba, shuning uchun uni darhol qo'llaymiz.
   */
  const applyViews = useCallback((target: EngagementTarget, id: string, views: number) => {
    const key = entryKey(target, id);
    setEntries((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? { likesCount: 0, liked: false }), views },
    }));
  }, []);

  const value = useMemo(
    () => ({ entries, register, toggle, applyViews }),
    [entries, register, toggle, applyViews],
  );

  return <EngagementContext.Provider value={value}>{children}</EngagementContext.Provider>;
}
