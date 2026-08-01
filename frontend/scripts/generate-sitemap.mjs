// sitemap.xml ni qurish paytida yasaydi: statik sahifalar + API'dagi kurs va
// maqolalar, to'rt til uchun.
//
// NEGA QURISH PAYTIDA: sayt SPA — serverda sahifa ro'yxati yo'q. Qo'lda
// yozilgan sitemap esa birinchi yangi kursdayoq eskiradi.
//
// API'ga ulanib bo'lmasa (masalan Render uxlab qolgan) qurish TO'XTAMAYDI —
// faqat statik sahifalar bilan sitemap yoziladi. Deploy sitemap tufayli
// yiqilishi mumkin emas.
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'public', 'sitemap.xml');

const SITE = (process.env.VITE_SITE_URL || 'https://datalife.uz').replace(/\/$/, '');
// VITE_API_URL odatda ".../api" bilan tugaydi
const API = (process.env.VITE_API_URL || 'https://datalife.onrender.com/api').replace(/\/$/, '');

const LOCALES = ['uz', 'ru', 'kaa', 'en'];
const DEFAULT_LOCALE = 'uz';

// changefreq/priority — qidiruv tizimlari uchun maslahat, majburiyat emas
const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/courses', priority: '0.9', changefreq: 'weekly' },
  { path: '/about', priority: '0.6', changefreq: 'monthly' },
  { path: '/mentors', priority: '0.7', changefreq: 'monthly' },
  { path: '/partners', priority: '0.5', changefreq: 'monthly' },
  { path: '/blog', priority: '0.8', changefreq: 'weekly' },
  { path: '/contact', priority: '0.5', changefreq: 'yearly' },
  { path: '/verify-certificate', priority: '0.4', changefreq: 'yearly' },
];

const localized = (locale, route) => `${SITE}${locale === DEFAULT_LOCALE ? '' : `/${locale}`}${route === '/' ? '/' : route}`;

async function fetchList(endpoint) {
  try {
    const res = await fetch(`${API}${endpoint}`, { signal: AbortSignal.timeout(90_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const data = body?.data;
    const items = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
    return items.filter((it) => it?.slug).map((it) => ({ slug: it.slug, updatedAt: it.updatedAt || it.publishedAt }));
  } catch (err) {
    console.warn(`[sitemap] ${endpoint} olinmadi (${err.message}) — statik sahifalar bilan davom etamiz`);
    return [];
  }
}

function urlEntry({ loc, lastmod, priority, changefreq, route }) {
  // hreflang: bir sahifaning to'rt tildagi variantlari o'zaro bog'lanadi,
  // shunda Google ularni dublikat emas, tarjima deb tushunadi
  const alternates = LOCALES.map(
    (l) => `    <xhtml:link rel="alternate" hreflang="${l === 'kaa' ? 'kaa' : l}" href="${localized(l, route)}"/>`
  ).join('\n');

  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    lastmod ? `    <lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    alternates,
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${localized(DEFAULT_LOCALE, route)}"/>`,
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');
}

async function main() {
  const [courses, posts] = await Promise.all([fetchList('/courses'), fetchList('/blog')]);

  const routes = [
    ...STATIC_ROUTES,
    ...courses.map((c) => ({ path: `/courses/${c.slug}`, priority: '0.8', changefreq: 'weekly', lastmod: c.updatedAt })),
    ...posts.map((p) => ({ path: `/blog/${p.slug}`, priority: '0.6', changefreq: 'monthly', lastmod: p.updatedAt })),
  ];

  const entries = [];
  for (const route of routes) {
    for (const locale of LOCALES) {
      entries.push(
        urlEntry({
          loc: localized(locale, route.path),
          lastmod: route.lastmod,
          priority: route.priority,
          changefreq: route.changefreq,
          route: route.path,
        })
      );
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>
`;

  writeFileSync(OUT, xml);
  console.log(
    `[sitemap] ${entries.length} ta manzil yozildi (${routes.length} sahifa × ${LOCALES.length} til) — ` +
      `${courses.length} kurs, ${posts.length} maqola`
  );
}

main().catch((err) => {
  // Sitemap deploy'ni to'xtatmasligi kerak
  console.warn('[sitemap] yasab bo\'lmadi:', err.message);
});
