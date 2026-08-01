import { useEffect, useState } from 'react';
import { getUnreadMessagesCount } from '../api/messages';
import { subscribeNotifications } from '../api/notifications';
import { useAuth } from './useAuth';

// SSE asosiy kanal; polling faqat zaxira (bildirishnoma qo'ng'irog'i bilan bir xil naqsh)
const POLL_MS = 180000;

/**
 * Yon menyudagi o'qilmagan xabarlar belgisi uchun.
 *
 * Yangi xabar Notification ham yaratadi, ya'ni SSE'dagi 'notify' hodisasi
 * shu hisobni ham yangilash uchun yetarli — alohida jonli kanal kerak emas.
 */
export function useUnreadMessages(): number {
  const { user } = useAuth();
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }
    let cancelled = false;
    const load = (): void => {
      getUnreadMessagesCount()
        .then((res) => { if (!cancelled) setCount(res.unreadCount); })
        .catch(() => {});
    };

    load();
    const unsubscribe = subscribeNotifications(load);
    // Fon tabda so'rov yuborishning ma'nosi yo'q — qaytganda darhol yangilanadi
    const timer = setInterval(() => { if (document.visibilityState === 'visible') load(); }, POLL_MS);
    const onVisible = (): void => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      unsubscribe();
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // Faqat user.id ga bog'lanadi: profil tahriri (yangi obyekt referensi)
    // SSE ulanishini keraksiz uzib-ulab yubormasligi uchun
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return count;
}
