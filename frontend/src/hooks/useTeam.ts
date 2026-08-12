import { useEffect, useState } from 'react';
import { listTeam } from '../api/team';
import { TeamMember } from '../types/team';

/**
 * Ommaviy jamoa ro'yxati.
 *
 * DIQQAT: `apiFetch` javobning `data` maydonini OCHIB qaytaradi, ya'ni bu
 * yerga massivning o'zi keladi — `{ data: [...] }` emas (useMoments dagi bilan
 * bir xil tuzoq).
 *
 * Xato yoki bo'sh bo'lsa bo'sh ro'yxat qaytadi; chaqiruvchi shunda o'zini
 * ko'rsatmaydi, "yuklanmoqda" holati chizilmaydi — bu bezak blok, uning
 * aylanmasi sahifani bezovta qilardi.
 */
export function useTeam(): TeamMember[] {
  const [items, setItems] = useState<TeamMember[]>([]);

  useEffect(() => {
    let cancelled = false;
    listTeam()
      .then((res) => { if (!cancelled) setItems(Array.isArray(res) ? (res as TeamMember[]) : []); })
      .catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
  }, []);

  return items;
}
