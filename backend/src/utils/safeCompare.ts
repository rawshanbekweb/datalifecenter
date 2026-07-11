import crypto from 'crypto';

// Maxfiy qiymatlarni (webhook imzo, API kalit) vaqt-jihatdan xavfsiz solishtirish.
// Oddiy === birinchi farq topilganda to'xtaydi — takroriy o'lchash orqali
// belgilab-belgilab taxmin qilishga (timing attack) yo'l ochadi.
export function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}
