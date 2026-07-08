import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';

// SMTP sozlanmagan bo'lsa email yuborilmaydi — asosiy oqimlar yiqilmasligi kerak.
// Development'da xat mazmuni konsolga chiqariladi (masalan, parol tiklash havolasi).
export const emailEnabled = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

let transporter: Transporter | null = null;
if (emailEnabled) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
}

const FROM = env.SMTP_FROM || `DATA LIFE <${env.SMTP_USER ?? 'no-reply@datalife.uz'}>`;

interface MailInput {
  to: string;
  subject: string;
  text: string;
  html: string;
}

async function sendMail(input: MailInput): Promise<void> {
  if (!transporter) {
    if (env.NODE_ENV !== 'production') {
      console.log(`[email o'chiq] ${input.to} — ${input.subject}\n${input.text}`);
    }
    return;
  }
  try {
    await transporter.sendMail({ from: FROM, ...input });
  } catch (err) {
    // Email yuborilmasa ham API so'rovi muvaffaqiyatli tugashi kerak
    console.error('Email yuborilmadi:', err);
  }
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

export async function sendPaymentRejectedEmail(
  to: string,
  name: string,
  courseTitle: string,
  reason: string
): Promise<void> {
  await sendMail({
    to,
    subject: `DATA LIFE — to'lov rad etildi: ${courseTitle}`,
    text: `Salom, ${name}!\n\n"${courseTitle}" kursi uchun yuborgan to'lov chekingiz rad etildi.\nSabab: ${reason}\n\nIltimos, to'g'ri chekni qayta yuklang.`,
    html: layout(
      "To'lov rad etildi",
      `<p style="font-size:14px;color:#475569">Salom, <b>${name}</b>! <b>"${courseTitle}"</b> kursi uchun yuborgan to'lov chekingiz rad etildi.</p>
       <p style="font-size:14px;color:#0f172a;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px"><b>Sabab:</b> ${reason}</p>
       <p style="font-size:13px;color:#64748b">Iltimos, to'g'ri to'lov chekini shaxsiy kabinetingizdan qayta yuklang.</p>`
    ),
  });
}
