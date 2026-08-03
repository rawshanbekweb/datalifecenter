import { useEffect, useState } from 'react';
import { listMoments } from '../api/moments';
import { MomentItem } from '../components/home/MomentsStory';

/**
 * Bosh sahifadagi "DATA LIFE'da bir kun" galereyasi uchun suratlar.
 *
 * DIQQAT: `apiFetch` javobning `data` maydonini OCHIB qaytaradi, ya'ni bu
 * yerga massivning o'zi keladi — `{ data: [...] }` emas. Ilgari shu yerda
 * `res.data` qidirilgani uchun ro'yxat har doim bo'sh qolib, saytda surat
 * yuklangan bo'lsa ham galereya "bo'sh" ko'rinardi.
 *
 * Xato bo'lsa bo'sh ro'yxat qaytadi — MomentsStory shunda kadr "izi"ni
 * chizadi, ya'ni sayt buzuq ko'rinmaydi.
 */
export function useMoments(): MomentItem[] {
  const [items, setItems] = useState<MomentItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    listMoments()
      .then((res) => { if (!cancelled) setItems(Array.isArray(res) ? (res as MomentItem[]) : []); })
      .catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
  }, []);

  return items;
}
