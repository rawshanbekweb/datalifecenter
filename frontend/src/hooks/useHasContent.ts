import { useEffect, useState } from 'react';

/**
 * "Bu bo'limda ko'rsatadigan narsa bormi?" degan hook'larni yasaydigan fabrika.
 *
 * Navbar va Footer'dagi havolalar shu bilan boshqariladi: jadval bo'sh bo'lsa
 * mehmon havolani bosib BO'SH sahifaga tushmasin. Bu `Projects.tsx` va Footer
 * ijtimoiy tarmoq ikonkalaridagi bilan bir xil qoida — ma'lumot yo'q joy
 * ko'rsatilmaydi. Ma'lumot qo'shilishi bilan havola o'zi qaytadi, kod
 * o'zgartirish shart emas.
 *
 * Javob kelguncha havola KO'RSATILMAYDI. Teskarisi (avval ko'rsatib, keyin
 * olib tashlash) bo'sh sahifaga olib boruvchi havolani bosishga ulgurish
 * imkonini berardi — menyuning kech to'lishi bundan afzal.
 *
 * Navbar va Footer bir sahifada birga turadi, shuning uchun so'rov modul
 * darajasida bir marta yuboriladi va natija shu sessiya davomida eslab
 * qolinadi (ro'yxat endpointlari serverda ham keshlanadi).
 */
export function createHasContentHook(fetchList: () => Promise<unknown>): () => boolean {
  let resolved: boolean | null = null;
  let pending: Promise<boolean> | null = null;

  const fetchHas = (): Promise<boolean> => {
    if (resolved !== null) return Promise.resolve(resolved);
    if (!pending) {
      pending = fetchList()
        .then((data: unknown) => {
          resolved = Array.isArray(data) && data.length > 0;
          return resolved;
        })
        .catch(() => {
          // Tarmoq xatosi — javob eslab qolinmaydi, keyingi chaqiruv qayta urinadi
          pending = null;
          return false;
        });
    }
    return pending;
  };

  return function useHasContent(): boolean {
    const [has, setHas] = useState<boolean>(() => resolved ?? false);

    useEffect(() => {
      let cancelled = false;
      fetchHas().then((value) => { if (!cancelled) setHas(value); });
      return () => { cancelled = true; };
    }, []);

    return has;
  };
}
