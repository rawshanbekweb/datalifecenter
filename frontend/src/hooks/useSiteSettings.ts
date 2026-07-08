import { useEffect, useState } from 'react';
import { getSiteSettings } from '../api/siteSettings';

// Bosh sahifa bo'limlari uchun bitta umumiy so'rov — har bir komponent
// alohida chaqirmasligi uchun HomePage darajasida bir marta ishlatiladi.
// Xato/bo'sh bo'lsa komponentlar o'zining hardcoded fallback qiymatidan foydalanadi.
export function useSiteSettings(): Record<string, any> {
  const [settings, setSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    getSiteSettings()
      .then(setSettings)
      .catch(() => setSettings({}));
  }, []);

  return settings;
}
