import { useEffect, useState } from 'react';
import { listMoments } from '../api/moments';
import { MomentItem } from '../components/home/MomentsStory';

/**
 * Bosh sahifadagi "DATA LIFE'da bir kun" galereyasi uchun suratlar.
 *
 * Xato bo'lsa bo'sh ro'yxat qaytaradi — Hero shunda galereyani umuman
 * ko'rsatmaydi va bir ustunli ko'rinishga o'tadi, ya'ni sayt buzuq
 * ko'rinmaydi.
 */
export function useMoments(): MomentItem[] {
  const [items, setItems] = useState<MomentItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    listMoments()
      .then((res) => { if (!cancelled) setItems(Array.isArray(res?.data) ? res.data : []); })
      .catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
  }, []);

  return items;
}
