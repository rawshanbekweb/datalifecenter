import { useEffect, useState } from 'react';
import { getSiteSettings } from '../api/siteSettings';

/**
 * Obuna bo'limi ochiqmi? Yagona manba — admin paneldagi "subscription_plan"
 * sozlamasi (`/admin/subscriptions` sahifasidagi katakcha). Backend ham AYNI
 * shu sozlamani tekshiradi (subscriptions.service.ts → assertSubscriptionsEnabled),
 * shuning uchun menyuni yashirish "bezak" emas: yopiq bo'limda API ham 403 beradi.
 *
 * Javob kelguncha `null` qaytadi — chaqiruvchi shu paytda hech narsa
 * ko'rsatmasligi kerak, aks holda yopiq bo'lim bir lahza ko'rinib ketardi
 * (qoidasi [[useHasContent]] bilan bir xil).
 */
let resolved: boolean | null = null;
let pending: Promise<boolean> | null = null;

function fetchEnabled(): Promise<boolean> {
  if (resolved !== null) return Promise.resolve(resolved);
  if (!pending) {
    pending = getSiteSettings()
      .then((settings) => {
        resolved = (settings.subscription_plan as { enabled?: boolean } | undefined)?.enabled === true;
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

export function useSubscriptionsEnabled(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(() => resolved);

  useEffect(() => {
    let cancelled = false;
    fetchEnabled().then((value) => { if (!cancelled) setEnabled(value); });
    return () => { cancelled = true; };
  }, []);

  return enabled;
}
