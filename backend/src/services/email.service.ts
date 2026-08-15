import { env } from '../config/env';

// Brevo API kaliti sozlanmagan bo'lsa email yuborilmaydi — asosiy oqimlar yiqilmasligi kerak.
// Development'da xat mazmuni konsolga chiqariladi (masalan, parol tiklash havolasi).
export const emailEnabled = Boolean(env.BREVO_API_KEY);

const FROM = env.EMAIL_FROM || 'DATA LIFE <no-reply@datalife.uz>';
const FROM_MATCH = FROM.match(/^(.*)<(.+)>$/);
const FROM_NAME = (FROM_MATCH?.[1] ?? 'DATA LIFE').trim();
const FROM_EMAIL = (FROM_MATCH?.[2] ?? FROM).trim();

// NEGA BU OGOHLANTIRISHLAR BOR: email nosozligi eng jim nosozlik turi.
// Foydalanuvchi "parol tiklash xati kelmayapti" deb shikoyat qilmaguncha
// hech qayerda bilinmasdi — kalit yo'qligi ham, Brevo xatosi ham.
// Shuning uchun holat ishga tushishda logga va /api/health ga chiqariladi.
if (!emailEnabled && env.NODE_ENV === 'production') {
  console.warn(
    "[email] BREVO_API_KEY sozlanmagan — parol tiklash, email tasdiqlash va to'lov xabarnomalari YUBORILMAYDI."
  );
}

// Jo'natuvchi manzili Brevo'da tasdiqlangan bo'lishi SHART, aks holda har bir
// so'rov 400 bilan qaytadi. Bundan ham nozigi: @gmail.com kabi begona domendan
// yuborilgan xat Brevo tomonidan qabul qilinadi-yu, Gmail uni DMARC bo'yicha
// spamga tashlaydi — jurnalda "delivered" ko'rinadi, lekin odam xatni ko'rmaydi.
// Shuning uchun o'z domenimizdan boshqa manzil ishlatilsa ogohlantiramiz.
if (emailEnabled && !/@datalife\.uz$/i.test(FROM_EMAIL)) {
  console.warn(
    `[email] EMAIL_FROM = "${FROM_EMAIL}" — o'z domenimiz emas. Bunday xatlar DMARC tekshiruvidan o'tmay spamga tushishi mumkin. Brevo'da datalife.uz domenini tasdiqlab, no-reply@datalife.uz ga o'ting.`
  );
}

interface MailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
}

async function deliver(input: MailInput): Promise<void> {
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': env.BREVO_API_KEY as string,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      // Brevo'ga ulanib bo'lmasa (tarmoq bloklangan/sekin) 8 soniyada uziladi —
      // undici'ning 10s connect-timeout'ini kutmasdan aniq xato logi qoldiriladi
      signal: AbortSignal.timeout(8000),
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: input.to }],
        subject: input.subject,
        textContent: input.text,
        htmlContent: input.html,
      }),
    });
    if (!res.ok) {
      console.error(`Email yuborilmadi (${input.to} — ${input.subject}):`, res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.error(`Email yuborilmadi (${input.to} — ${input.subject}):`, err instanceof Error ? err.message : err);
  }
}

// Fire-and-forget: email yuborish HTTP so'rovni hech qachon bloklamaydi va
// yiqitmaydi (register/parol tiklash Brevo'ga ulanib bo'lmasa ham darhol javob
// qaytaradi). Xatolar faqat konsolga yoziladi.
async function sendMail(input: MailInput): Promise<void> {
  if (!emailEnabled) {
    if (env.NODE_ENV !== 'production') {
      console.log(`[email o'chiq] ${input.to} — ${input.subject}\n${input.text}`);
    }
    return;
  }
  void deliver(input);
}

function layout(title: string, bodyHtml: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#0f172a">
  <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
    <div style="background:#0ea5e9;padding:16px 24px">
      <span style="color:#fff;font-size:18px;font-weight:bold">DATA LIFE</span>
    </div>
    <div style="padding:24px">
      <h2 style="margin:0 0 12px;font-size:17px">${title}</h2>
      ${bodyHtml}
      <p style="font-size:12px;color:#94a3b8;margin-top:24px">DATA LIFE IT ta'lim markazi. Bu xat avtomatik yuborildi — javob yozmang.</p>
    </div>
  </div>
</div>`;
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<void> {
  await sendMail({
    to,
    subject: 'DATA LIFE — parolni tiklash',
    text: `Salom, ${name}!\n\nParolingizni tiklash uchun quyidagi havolaga o'ting (havola 30 daqiqa amal qiladi):\n${resetUrl}\n\nAgar bu so'rovni siz yubormagan bo'lsangiz, xatni e'tiborsiz qoldiring.`,
    html: layout(
      'Parolni tiklash',
      `<p style="font-size:14px;color:#475569">Salom, <b>${name}</b>! Parolingizni tiklash uchun quyidagi tugmani bosing. Havola <b>30 daqiqa</b> amal qiladi.</p>
       <p style="margin:20px 0"><a href="${resetUrl}" style="background:#0ea5e9;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:bold;display:inline-block">Parolni tiklash</a></p>
       <p style="font-size:12px;color:#94a3b8">Tugma ishlamasa, havolani nusxalab brauzerga qo'ying:<br>${resetUrl}</p>
       <p style="font-size:12px;color:#94a3b8">Agar bu so'rovni siz yubormagan bo'lsangiz, xatni e'tiborsiz qoldiring — parolingiz o'zgarmaydi.</p>`
    ),
  });
}

export async function sendVerificationEmail(to: string, name: string, verifyUrl: string): Promise<void> {
  await sendMail({
    to,
    subject: 'DATA LIFE — emailni tasdiqlang',
    text: `Salom, ${name}!\n\nDATA LIFE'da ro'yxatdan o'tganingiz uchun rahmat. Emailingizni tasdiqlash uchun havolaga o'ting (24 soat amal qiladi):\n${verifyUrl}`,
    html: layout(
      'Emailni tasdiqlang',
      `<p style="font-size:14px;color:#475569">Salom, <b>${name}</b>! DATA LIFE'da ro'yxatdan o'tganingiz uchun rahmat. Hisobingizni tasdiqlash uchun tugmani bosing. Havola <b>24 soat</b> amal qiladi.</p>
       <p style="margin:20px 0"><a href="${verifyUrl}" style="background:#0ea5e9;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:bold;display:inline-block">Emailni tasdiqlash</a></p>
       <p style="font-size:12px;color:#94a3b8">Tugma ishlamasa, havolani nusxalab brauzerga qo'ying:<br>${verifyUrl}</p>`
    ),
  });
}

export async function sendPaymentConfirmedEmail(
  to: string,
  name: string,
  courseTitle: string,
  courseUrl: string
): Promise<void> {
  await sendMail({
    to,
    subject: `DATA LIFE — to'lov tasdiqlandi: ${courseTitle}`,
    text: `Salom, ${name}!\n\n"${courseTitle}" kursi uchun to'lovingiz tasdiqlandi. Endi darslarni boshlashingiz mumkin:\n${courseUrl}`,
    html: layout(
      "To'lov tasdiqlandi 🎉",
      `<p style="font-size:14px;color:#475569">Salom, <b>${name}</b>! <b>"${courseTitle}"</b> kursi uchun to'lovingiz tasdiqlandi — kurs siz uchun ochildi.</p>
       <p style="margin:20px 0"><a href="${courseUrl}" style="background:#0ea5e9;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:bold;display:inline-block">Darslarni boshlash</a></p>`
    ),
  });
}

/**
 * Admin kurs so'rovini tasdiqlab, o'quvchini guruhga qo'shganda.
 *
 * NEGA ALOHIDA XAT: bu odam saytda o'tirmagan bo'lishi mumkin — u forma
 * to'ldirib, javob kutayotgan edi. Ichki bildirishnoma unga yetib bormaydi.
 * Offline uchun matn boshqacha: darslar markazda o'tadi, shuning uchun
 * manzil va "administrator jadval bo'yicha bog'lanadi" degani muhimroq.
 */
export interface CourseEnrolledEmailInput {
  to: string;
  name: string;
  courseTitle: string;
  format: 'ONLINE' | 'OFFLINE';
  courseUrl: string;
  location?: string | null;
  /** Guruh jadvali bir qatorda (courseGroups.service.ts: groupScheduleText) */
  schedule?: string | null;
}

export async function sendCourseEnrolledEmail(input: CourseEnrolledEmailInput): Promise<void> {
  const { to, name, courseTitle, courseUrl, location, schedule } = input;
  const offline = input.format === 'OFFLINE';
  // Guruh tanlangan bo'lsa aynan u eng muhim ma'lumot: qachon va qayerda
  // kelish kerakligini o'quvchi shu qatordan biladi
  const contact = schedule
    ? `Guruhingiz: <b>${schedule}</b>.`
    : "Jadval bo'yicha administrator siz bilan bog'lanadi.";
  const intro = offline
    ? `<b>"${courseTitle}"</b> kursining <b>offline guruhiga</b> qabul qilindingiz. ${contact}${location ? ` Mashg'ulotlar manzili: <b>${location}</b>.` : ''}`
    : `<b>"${courseTitle}"</b> kursiga qabul qilindingiz — darslar kabinetingizda ochildi.${schedule ? ` Guruhingiz: <b>${schedule}</b>.` : ''}`;

  await sendMail({
    to,
    subject: `DATA LIFE — kursga qabul qilindingiz: ${courseTitle}`,
    text: offline
      ? `Salom, ${name}!\n\n"${courseTitle}" kursining offline guruhiga qabul qilindingiz.\n${schedule ? `Guruhingiz: ${schedule}` : "Jadval bo'yicha administrator siz bilan bog'lanadi."}${location ? `\nManzil: ${location}` : ''}\n\nKurs materiallari kabinetingizda ham ochiq:\n${courseUrl}`
      : `Salom, ${name}!\n\n"${courseTitle}" kursiga qabul qilindingiz.${schedule ? `\nGuruhingiz: ${schedule}` : ''}\n\nDarslarni boshlashingiz mumkin:\n${courseUrl}`,
    html: layout(
      'Kursga qabul qilindingiz 🎉',
      `<p style="font-size:14px;color:#475569">Salom, <b>${name}</b>! ${intro}</p>
       <p style="margin:20px 0"><a href="${courseUrl}" style="background:#0ea5e9;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:bold;display:inline-block">${offline ? 'Kurs materiallari' : 'Darslarni boshlash'}</a></p>`
    ),
  });
}

export async function sendPaymentRejectedEmail(
  to: string,
  name: string,
  courseTitle: string,
  reason: string
): Promise<void> {
  await sendMail({
    to,
    subject: `DATA LIFE — to'lov rad etildi: ${courseTitle}`,
    // To'lov saytda qabul qilinmaydi, shuning uchun "chekni qayta yuklang" deb
    // aytilmaydi — talaba administrator bilan bog'lanishi kerak.
    text: `Salom, ${name}!\n\n"${courseTitle}" kursi uchun to'lov tasdiqlanmadi.\nSabab: ${reason}\n\nAniqlashtirish uchun administrator bilan bog'laning.`,
    html: layout(
      "To'lov rad etildi",
      `<p style="font-size:14px;color:#475569">Salom, <b>${name}</b>! <b>"${courseTitle}"</b> kursi uchun to'lov tasdiqlanmadi.</p>
       <p style="font-size:14px;color:#0f172a;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px"><b>Sabab:</b> ${reason}</p>
       <p style="font-size:13px;color:#64748b">Aniqlashtirish uchun administrator bilan bog'laning — kurs to'lovi o'quv markazida rasmiylashtiriladi.</p>`
    ),
  });
}
