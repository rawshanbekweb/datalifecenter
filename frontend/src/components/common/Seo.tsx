import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { DEFAULT_LOCALE, ENABLED_LOCALES, LOCALE_BCP47 } from '../../i18n/config';
import { useLocale } from '../../hooks/useLocale';
import { SITE_URL } from '../../api/config';

const BRAND = 'DATA LIFE';
const DEFAULT_IMAGE = '/assets/logotype.png';

interface SeoProps {
  /** Sahifa nomi — brend avtomatik qo'shiladi. Bo'sh bo'lsa faqat brend chiqadi. */
  title?: string;
  description?: string;
  /** Nisbiy yo'l ham bo'laveradi — absolyutga o'giriladi (ijtimoiy tarmoqlar nisbiy yo'lni tushunmaydi). */
  image?: string;
  type?: 'website' | 'article';
  /** Login/kabinet kabi indekslanmasligi kerak bo'lgan sahifalar uchun. */
  noIndex?: boolean;
}

function absolute(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Sahifa meta ma'lumotlari. React 19 `<title>`/`<meta>`/`<link>` teglarini
 * komponent ichidan `<head>`ga o'zi ko'chiradi — shuning uchun react-helmet
 * kabi qo'shimcha kutubxona kerak emas.
 *
 * Har sahifada ishlatilishi shart: usiz butun SPA bitta `index.html`dagi
 * sarlavha bilan indekslanadi va Google barcha sahifalarni bir xil deb biladi.
 */
export default function Seo({ title, description, image, type = 'website', noIndex }: SeoProps): React.ReactElement {
  const { pathname, search } = useLocation();
  const { locale, basename } = useLocale();

  // index.html'dagi zaxira teglarni olib tashlaymiz. React <title>ni almashtiradi,
  // lekin <meta>ni FAQAT QO'SHADI — natijada sahifaga xos tavsif bilan umumiy
  // zaxira yonma-yon qolib, qidiruv tizimi birinchisini (zaxirani) olardi.
  // JS ishlamaydigan robot esa baribir zaxira teglarni ko'radi — ular HTML'da qoladi.
  useEffect(() => {
    document.querySelectorAll('head [data-default]').forEach((el) => el.remove());
  }, []);

  const fullTitle = title ? `${title} — ${BRAND}` : `${BRAND} — IT Education Center & Technology Company`;
  const canonical = `${SITE_URL}${basename}${pathname === '/' ? '' : pathname}`;
  const imageUrl = absolute(image || DEFAULT_IMAGE);

  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Har til uchun muqobil manzil — Google qaysi tildagi versiyani kimga
          ko'rsatishni shundan biladi. x-default = prefikssiz manzil, ya'ni
          DEFAULT_LOCALE dagi (hozir qoraqalpoqcha) versiya.
          DIQQAT: bu yerda LOCALE_BCP47 ISHLATILMAYDI — unda kaa uchun 'uz-UZ'
          turadi (Intl'da qoraqalpoqcha yo'qligi uchun ataylab), va o'sha qiymat
          hreflang'ga tushsa ikki xil manzil bitta til deb e'lon qilinib,
          Google ularni ziddiyatli deb rad etardi. Til kodining o'zi (uz, ru,
          kaa, en) to'g'ri va yaroqli hreflang qiymati. */}
      {!noIndex && ENABLED_LOCALES.map((loc) => (
        <link
          key={loc}
          rel="alternate"
          hrefLang={loc}
          href={`${SITE_URL}${loc === DEFAULT_LOCALE ? '' : `/${loc}`}${pathname === '/' ? '' : pathname}`}
        />
      ))}
      {!noIndex && (
        <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}${pathname === '/' ? '' : pathname}`} />
      )}

      <meta property="og:site_name" content={BRAND} />
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={`${canonical}${search}`} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:locale" content={LOCALE_BCP47[locale].replace('-', '_')} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={imageUrl} />
    </>
  );
}
