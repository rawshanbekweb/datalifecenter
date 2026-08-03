import { useEffect, useState } from 'react';
import { listTeam } from '../api/team';

/**
 * Jamoada nashr qilingan a'zo bor-yo'qligi.
 *
 * Navbar va Footer'dagi "Jamoa" havolasi shu bilan boshqariladi: jadval bo'sh
 * bo'lsa (masalan yangi o'rnatilgan nusxada) mehmon havolani bosib bo'sh
 * sahifaga tushmasin. Bu `Projects.tsx` va Footer ijtimoiy tarmoq
 * ikonkalaridagi bilan bir xil qoida — ma'lumot yo'q joy ko'rsatilmaydi.
 *
 * Javob kelguncha havola KO'RSATILMAYDI. Teskarisi (avval ko'rsatib, keyin
 * olib tashlash) bo'sh sahifaga olib boruvchi havolani bosishga ulgurish
 * imkonini berardi — menyuning kech to'lishi bundan afzal.
 *
 * Navbar va Footer bir sahifada birga turadi, shuning uchun so'rov modul
 * darajasida bir marta yuboriladi va natija shu sessiya davomida eslab
 * qolinadi (`/api/team` serverda ham keshlanadi).
 */
let resolved: boolean | null = null;
let pending: Promise<boolean> | null = null;

function fetchHasTeam(): Promise<boolean> {
  if (resolved !== null) return Promise.resolve(resolved);
  if (!pending) {
    pending = listTeam()
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
}

export function useHasTeam(): boolean {
  const [hasTeam, setHasTeam] = useState<boolean>(() => resolved ?? false);

  useEffect(() => {
    let cancelled = false;
    fetchHasTeam().then((has) => { if (!cancelled) setHasTeam(has); });
    return () => { cancelled = true; };
  }, []);

  return hasTeam;
}
