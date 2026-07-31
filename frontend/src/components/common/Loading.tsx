import React from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Sahifa ichidagi yuklanish indikatori.
 *
 * Ilgari hamma joyda oddiy `<p>{t('common.loading')}</p>` turardi — kirish
 * splash'i chiroyli bo'lgani bilan, foydalanuvchi kunning ko'p qismida aynan
 * shu quruq matnni ko'rardi. Bu komponent o'sha 40+ joyni almashtiradi.
 *
 * Uslub (`.dl-load*`) index.css'da — 40+ nusxa har biri o'z <style> blogini
 * chiqarmasligi uchun. Ko'rinish splash bilan bir oilada: bir xil ranglar
 * va zarracha motivi.
 */

interface LoadingProps {
  /** Bo'lim o'rtasiga tekislash (bosh sahifa seksiyalari, sahifa markazi) */
  center?: boolean;
  /** Yuqori/pastdan bo'sh joy — sahifa markazidagi holatlar uchun */
  padded?: boolean;
  /** Nuqtalarga qo'shimcha "oqim" chizig'i — kengroq joylarda ko'rkam */
  bar?: boolean;
  /** Matnni yashirish (tor joylarda, masalan modal ichida) */
  hideLabel?: boolean;
  /** Standart "Yuklanmoqda..." o'rniga boshqa matn */
  label?: string;
}

export default function Loading({
  center, padded, bar, hideLabel, label,
}: LoadingProps = {}): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div
      className={`dl-load${center ? ' dl-load--center' : ''}${padded ? ' dl-load--pad' : ''}`}
      // Skrinrider yuklanish tugaganda avtomatik xabar berishi uchun
      role="status"
      aria-live="polite"
    >
      <span className="dl-load__dots" aria-hidden="true">
        <span className="dl-load__dot" />
        <span className="dl-load__dot" />
        <span className="dl-load__dot" />
      </span>
      {bar && (
        <span className="dl-load__track" aria-hidden="true">
          <span className="dl-load__sweep" />
        </span>
      )}
      {!hideLabel && <span>{label ?? t('common.loading')}</span>}
    </div>
  );
}
