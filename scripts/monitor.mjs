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

// IKKI DARAJA. Ilgari hammasi bitta ro'yxat edi va bitta buzuq hamkor logotipi
// ham butun workflow'ni yiqitardi — monitoring kunlar davomida uzluksiz qizil
// turgani uchun haqiqiy nosozlik (baza yiqilishi) shu shovqin ichida ko'zga
// tashlanmay qolardi. Endi:
//   problems — sayt ishlamayapti: darhol yiqilish + ogohlantirish
//   warnings — sayt ishlayapti, lekin kontentda nuqson (buzuq rasm): yiqilmaydi,
//              hisobotda ko'rinadi va kuniga bir marta xabar qilinadi
const problems = [];
const warnings = [];
const notes = [];

const fail = (area, detail) => problems.push(`${area}: ${detail}`);
const warn = (area, detail) => warnings.push(`${area}: ${detail}`);

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

  notes.push(
    `API ${ms} ms · baza: ${data.database} · xotira: ${data.storage}` +
      `${data.email ? ` · email: ${data.email}` : ''} · uptime: ${data.uptimeSeconds}s`
  );

  if (data.database !== 'ok') fail('Baza', `holat "${data.database}"`);
  // 'local' = Render'ning ephemeral diski: yuklangan fayllar keyingi deployda yo'qoladi
  if (data.storage === 'local') fail('Fayl xotirasi', "bulut sozlanmagan — yuklangan fayllar deployda yo'qoladi");
  // Sayt ishlab turadi, lekin parol tiklash va tasdiqlash xatlari jimgina
  // yuborilmaydi — shuning uchun ogohlantirish (yiqilish emas). Maydon eski
  // backendda yo'q, shuning uchun undefined tekshiriladi.
  if (data.email === 'off') warn('Email', "BREVO_API_KEY sozlanmagan — parol tiklash xatlari yuborilmayapti");
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
  const broken = [];
  for (const { url, label } of urls) {
    // Nisbiy yo'l frontendning o'z fayli (repo ichida keladi) — tekshirishga arzimaydi
    if (!/^https?:\/\//i.test(url)) continue;
    checked += 1;
    const { res, error } = await get(url, { method: 'HEAD' });
    if (error) {
      broken.push(`${label}: ${error}`);
    } else if (!res.ok) {
      broken.push(`${label}: HTTP ${res.status} — ${url.slice(0, 70)}`);
    }
  }
  notes.push(`${checked} ta rasm tekshirildi${broken.length ? `, ${broken.length} tasi buzuq` : ''}`);

  // Bitta-yarimta buzuq rasm — kontent nuqsoni (karta zaxira ko'rinishga tushadi,
  // sayt ishlayveradi). Lekin ko'pchiligi birdan yiqilsa bu boshqa narsa: fayl
  // xotirasi yoki CDN butunlay ishdan chiqqan — bunisi kritik.
  const massFailure = checked >= 3 && broken.length > checked / 2;
  for (const detail of broken) {
    if (massFailure) fail('Rasm', detail);
    else warn('Rasm', detail);
  }
  if (massFailure) {
    fail('Fayl xotirasi', `${checked} ta rasmdan ${broken.length} tasi ochilmadi — ommaviy nosozlikka o'xshaydi`);
  }
}

const bullets = (list) => list.map((p) => `• ${p}`).join('\n');

// Workflow qadamlari shu qiymatlarni o'qiydi (ogohlantirish yuborish shartlari)
async function writeOutputs() {
  const { appendFileSync } = await import('node:fs');
  const status = problems.length ? 'fail' : warnings.length ? 'warn' : 'ok';

  if (process.env.GITHUB_OUTPUT) {
    // Bo'sh ro'yxat uchun heredoc umuman yozilmaydi — aks holda qiymat bitta
    // bo'sh qatordan iborat bo'lib qolardi va workflow uni "bor" deb hisoblab
    // xabarga bo'sh "Nosozlik:" sarlavhasini qo'shib yuborardi.
    let out = `status=${status}\n`;
    if (problems.length) out += `problems<<EOF\n${bullets(problems)}\nEOF\n`;
    if (warnings.length) out += `warnings<<EOF\n${bullets(warnings)}\nEOF\n`;
    appendFileSync(process.env.GITHUB_OUTPUT, out);
  }

  // Actions sahifasida ko'rinadigan hisobot — ogohlantirishlar workflow'ni
  // yiqitmagani uchun ular faqat log ichida qolib ketmasligi kerak
  if (process.env.GITHUB_STEP_SUMMARY) {
    const lines = [`## Monitoring — ${status === 'ok' ? '✅ hammasi joyida' : status === 'warn' ? '⚠️ kontentda nuqson' : '❌ nosozlik'}`, ''];
    for (const note of notes) lines.push(`- ${note}`);
    if (problems.length) lines.push('', `### ❌ Nosozlik (${problems.length} ta)`, ...problems.map((p) => `- ${p}`));
    if (warnings.length) lines.push('', `### ⚠️ Kontent ogohlantirishi (${warnings.length} ta)`, ...warnings.map((p) => `- ${p}`));
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);
  }
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

  if (warnings.length) {
    console.log(`\nOGOHLANTIRISH (${warnings.length} ta) — sayt ishlayapti, kontent tuzatilishi kerak:`);
    for (const w of warnings) console.log(`  ⚠ ${w}`);
  }

  if (problems.length) {
    console.log(`\nMUAMMO (${problems.length} ta):`);
    for (const p of problems) console.log(`  ✗ ${p}`);
    // Faqat kritik nosozlikda yiqilamiz — ogohlantirish workflow'ni qizartirmaydi
    process.exitCode = 1;
  } else if (warnings.length === 0) {
    console.log('\nHammasi joyida.');
  }

  await writeOutputs();
}

main().catch((err) => {
  console.error('Monitoring skriptining o\'zi yiqildi:', err);
  process.exitCode = 1;
});
