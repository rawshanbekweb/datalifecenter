#!/usr/bin/env node
// DATA LIFE — tashqi sog'liq tekshiruvi.
//
// NEGA KERAK: "servis ko'tarilgan" bilan "sayt ishlayapti" bir narsa emas.
// Fayllar oylar davomida jimgina yo'qolib turgani (Render'ning ephemeral diski)
// aynan shuning uchun sezilmagan — hech narsa tekshirib turmagan. Bu skript
// foydalanuvchi ko'radigan narsalarni tekshiradi: sayt ochiladimi, API javob
// beradimi, bazaga ulanish bormi, saytdagi rasmlar haqiqatan yuklanadimi.
//
// Bog'liqliksiz (faqat Node 20+ va fetch) — CI'da `npm install`siz ishlaydi.
//
// Ishga tushirish:
//   node scripts/monitor.mjs
//   API_URL=... SITE_URL=... node scripts/monitor.mjs

const API = (process.env.API_URL || 'https://datalife.onrender.com').replace(/\/$/, '');
const SITE = (process.env.SITE_URL || 'https://datalife.uz').replace(/\/$/, '');

// Render'ning bepul instansi uxlab qolgan bo'lsa uyg'onishi ~50 soniya oladi —
// timeout shundan kelib chiqib katta olingan, aks holda har uyquni "nosozlik"
// deb hisoblab, soxta ogohlantirish yuborardik.
const TIMEOUT_MS = 90_000;

const problems = [];
const notes = [];

const fail = (area, detail) => problems.push(`${area}: ${detail}`);

async function get(url, init = {}) {
  const started = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), ...init });
    return { res, ms: Date.now() - started };
  } catch (err) {
    return { error: err?.name === 'TimeoutError' ? 'vaqt tugadi' : `ulanib bo'lmadi (${err?.name || err})`, ms: Date.now() - started };
  }
}

async function checkHealth() {
  const { res, error, ms } = await get(`${API}/api/health`);
  if (error) return fail('API', `/api/health ${error}`);

  let body = null;
  try {
    body = await res.json();
  } catch {
    /* JSON emas — quyida ushlanadi */
  }

  if (!res.ok) {
    return fail('API', `/api/health HTTP ${res.status}${body?.data?.database ? ` (baza: ${body.data.database})` : ''}`);
  }

  const data = body?.data ?? {};

  // Eski backendning /api/health'i faqat {status:'ok'} qaytaradi. Yo'q maydonni
  // nosozlik deb hisoblamaymiz — aks holda deploy oralig'ida soxta ogohlantirish
  // ketardi; buning o'rniga tekshirilmagani aytiladi.
  if (data.database === undefined) {
    notes.push(`API ${ms} ms · eski health endpointi (baza/xotira holati berilmayapti)`);
    return;
  }

  notes.push(`API ${ms} ms · baza: ${data.database} · xotira: ${data.storage} · uptime: ${data.uptimeSeconds}s`);

  if (data.database !== 'ok') fail('Baza', `holat "${data.database}"`);
  // 'local' = Render'ning ephemeral diski: yuklangan fayllar keyingi deployda yo'qoladi
  if (data.storage === 'local') fail('Fayl xotirasi', "bulut sozlanmagan — yuklangan fayllar deployda yo'qoladi");
  if (ms > 60_000) notes.push('DIQQAT: javob juda sekin — instans uyqudan uyg\'ongan bo\'lishi mumkin');
}

async function checkSite() {
  const { res, error } = await get(SITE);
  if (error) return fail('Sayt', `${SITE} ${error}`);
  if (!res.ok) return fail('Sayt', `${SITE} HTTP ${res.status}`);

  const html = await res.text();
  // SPA bo'sh sahifa qaytarsa ham 200 keladi — index.html haqiqatan to'ldirilganini tekshiramiz
  if (!/<div id="root"/.test(html)) fail('Sayt', 'index.html kutilgan ko\'rinishda emas');
  if (!/<script/.test(html)) fail('Sayt', 'JS bundle havolasi topilmadi');
}

// Ochiq endpointlar: javob berishi VA bo'sh bo'lmasligi kerak. Bo'sh massiv
// odatda migratsiya/seed nosozligini bildiradi (sayt "ishlayapti", lekin bo'm-bo'sh).
const ENDPOINTS = [
  { path: '/api/courses', label: 'Kurslar', expectItems: true },
  { path: '/api/mentors', label: 'Mentorlar', expectItems: true },
  { path: '/api/partners', label: 'Hamkorlar', expectItems: false },
  { path: '/api/blog', label: 'Blog', expectItems: false },
  { path: '/api/site-settings', label: 'Sayt sozlamalari', expectItems: false },
];

const listOf = (payload) => {
  const d = payload?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.items)) return d.items;
  return null;
};

async function checkEndpoints() {
  const collected = [];
  for (const ep of ENDPOINTS) {
    const { res, error } = await get(`${API}${ep.path}`);
    if (error) {
      fail(ep.label, `${ep.path} ${error}`);
      continue;
    }
    if (!res.ok) {
      fail(ep.label, `${ep.path} HTTP ${res.status}`);
      continue;
    }
    const body = await res.json().catch(() => null);
    const items = listOf(body);
    if (items === null) {
      // site-settings massiv emas, obyekt qaytaradi — bu normal
      continue;
    }
    if (ep.expectItems && items.length === 0) fail(ep.label, `${ep.path} bo'sh ro'yxat qaytardi`);
    collected.push(...items);
  }
  return collected;
}

// Saytda ko'rinadigan rasmlar. Aynan shu tekshiruv bo'lmagani uchun singan
// mentor rasmi va bloklangan hamkor logotipi oylar davomida sezilmagan.
function imageUrlsFrom(items) {
  const urls = [];
  for (const it of items ?? []) {
    for (const key of ['photoUrl', 'logoUrl', 'screenshotUrl', 'avatarUrl']) {
      const value = it?.[key];
      if (typeof value === 'string' && value.trim()) urls.push({ url: value, label: it.name || it.title?.uz || it.title || key });
    }
  }
  return urls;
}

async function checkImages(items) {
  const urls = imageUrlsFrom(items);
  if (urls.length === 0) return;

  let checked = 0;
  for (const { url, label } of urls) {
    // Nisbiy yo'l frontendning o'z fayli (repo ichida keladi) — tekshirishga arzimaydi
    if (!/^https?:\/\//i.test(url)) continue;
    checked += 1;
    const { res, error } = await get(url, { method: 'HEAD' });
    if (error) {
      fail('Rasm', `${label}: ${error}`);
    } else if (!res.ok) {
      fail('Rasm', `${label}: HTTP ${res.status} — ${url.slice(0, 70)}`);
    }
  }
  notes.push(`${checked} ta rasm tekshirildi`);
}

async function main() {
  console.log(`DATA LIFE monitoring — ${new Date().toISOString()}`);
  console.log(`API:  ${API}`);
  console.log(`Sayt: ${SITE}\n`);

  await checkHealth();
  await checkSite();
  const items = await checkEndpoints();
  await checkImages(items);

  for (const note of notes) console.log(`  ${note}`);

  if (problems.length === 0) {
    console.log('\nHammasi joyida.');
    return;
  }

  console.log(`\nMUAMMO (${problems.length} ta):`);
  for (const p of problems) console.log(`  ✗ ${p}`);

  // Workflow shu kod bo'yicha yiqiladi va ogohlantirish yuboradi
  process.exitCode = 1;

  // Telegram uchun qisqa matn (workflow shu faylni o'qiydi)
  if (process.env.GITHUB_OUTPUT) {
    const { appendFileSync } = await import('node:fs');
    const summary = problems.map((p) => `• ${p}`).join('\n');
    appendFileSync(process.env.GITHUB_OUTPUT, `problems<<EOF\n${summary}\nEOF\n`);
  }
}

main().catch((err) => {
  console.error('Monitoring skriptining o\'zi yiqildi:', err);
  process.exitCode = 1;
});
