import { useEffect, useRef } from 'react';
import { sendHeartbeat } from '../api/authSessions';
import { useAuth } from './useAuth';

/**
 * "Men shu yerdaman" signali — server seansning oxirgi faolligini bilishi uchun.
 *
 * NEGA KERAK: harakatsizlik chegarasi server tomonda `lastSeenAt` bo'yicha
 * hisoblanadi, u esa faqat API so'rovlarida yangilanadi. Uzun darsni O'QIB
 * o'tirgan foydalanuvchi bironta so'rov yubormaydi va o'rtada chiqib ketardi.
 *
 * NEGA shunchaki taymer emas:
 *   1. FAQAT haqiqiy harakatdan keyin yuboriladi — ochiq qolgan, lekin
 *      tegilmayotgan tab seansni abadiy tirik ushlab tursa, harakatsizlik
 *      chegarasining ma'nosi qolmaydi.
 *   2. FAQAT tab ko'rinib turganda — fondagi tab foydalanuvchi emas.
 *   3. 5 daqiqada bir martadan ko'p emas: server chegarasi eng qisqasi
 *      60 daqiqa, undan tez-tez xabar berishning keragi yo'q.
 */

const THROTTLE_MS = 5 * 60 * 1000;

// Foydalanuvchi bor ekanini bildiradigan hodisalar. `scroll` ATAYIN yo'q:
// u telefonda inersiya bilan o'zi ham ishlab turadi.
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'touchstart', 'click'] as const;

export function useIdleHeartbeat(): void {
  const { user } = useAuth();
  const lastSentRef = useRef<number>(Date.now());
  const activeSinceLastSendRef = useRef<boolean>(false);

  useEffect(() => {
    if (!user) return;

    const markActivity = (): void => {
      activeSinceLastSendRef.current = true;
    };

    const maybeSend = (): void => {
      if (document.visibilityState !== 'visible') return;
      if (!activeSinceLastSendRef.current) return;
      if (Date.now() - lastSentRef.current < THROTTLE_MS) return;

      lastSentRef.current = Date.now();
      activeSinceLastSendRef.current = false;
      // Xato bo'lsa jim o'tamiz: seans yopilgan bo'lsa `apiFetch` allaqachon
      // tokenni tozalab, chiqarish oqimini boshlab yuborgan bo'ladi.
      void sendHeartbeat().catch(() => undefined);
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, markActivity, { passive: true });
    }
    // Tabga qaytilganda darhol tekshiramiz — foydalanuvchi qaytgani ham faollik
    const onVisible = (): void => {
      if (document.visibilityState === 'visible') {
        markActivity();
        maybeSend();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    const timer = window.setInterval(maybeSend, 60_000);

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, markActivity);
      }
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, [user]);
}
