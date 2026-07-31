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
          ko'rsatishni shundan biladi. x-default asosiy (o'zbekcha) versiya. */}
      {!noIndex && ENABLED_LOCALES.map((loc) => (
        <link
          key={loc}
          rel="alternate"
          hrefLang={LOCALE_BCP47[loc]}
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
