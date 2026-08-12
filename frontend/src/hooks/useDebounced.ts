import { useEffect, useState } from 'react';

/**
 * Qiymatni foydalanuvchi TINCHIGACH ushlab turadi.
 *
 * Qidiruv maydonlari uchun: har bosilgan harfda serverga so'rov yuborish
 * o'rniga yozish tugashini kutamiz. "Rashidov" so'zi bitta so'rovga aylanadi,
 * sakkiztaga emas.
 *
 * 350ms — qo'lda yozish tezligidan sal sekinroq, ya'ni so'z o'rtasida so'rov
 * ketmaydi, lekin yozib bo'lgach kutib o'tirilmaydi.
 */
export function useDebounced<T>(value: T, delayMs = 350): T {
  const [settled, setSettled] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return settled;
}
