import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Sahifa ichidagi yuklanish indikatori.
 *
 * Ilgari hamma joyda oddiy `<p>{t('common.loading')}</p>` turardi — kirish
 * splash'i chiroyli bo'lgani bilan, foydalanuvchi kunning ko'p qismida aynan
 * shu quruq matnni ko'rardi. Bu komponent o'sha 45+ joyni almashtiradi.
 *
 * Uslub (`.dl-load*`) index.css'da — 45+ nusxa har biri o'z <style> blogini
 * chiqarmasligi uchun.
 */

interface LoadingProps {
  /** Bo'lim o'rtasiga tekislash (bosh sahifa seksiyalari, karta ichi) */
  center?: boolean;
  /**
   * Sahifa markazidagi katta holat: aylana kattaroq, matn ostida, tik
   * joylashadi. Butun sahifa yuklanayotganda ishlatiladi.
   */
  page?: boolean;
  /** Matnni yashirish (juda tor joylarda) */
  hideLabel?: boolean;
  /** Standart "Yuklanmoqda..." o'rniga boshqa matn */
  label?: string;
}

export default function Loading({
  center, page, hideLabel, label,
}: LoadingProps = {}): React.ReactElement {
  const { t } = useTranslation();

  const className = [
    'dl-load',
    page ? 'dl-load--page' : '',
    center && !page ? 'dl-load--center' : '',
  ].filter(Boolean).join(' ');

  return (
    // Skrinrider yuklanish tugaganda avtomatik xabar berishi uchun
    <div className={className} role="status" aria-live="polite">
      <span className="dl-load__spin" aria-hidden="true" />
      {!hideLabel && <span>{label ?? t('common.loading')}</span>}
    </div>
  );
}
