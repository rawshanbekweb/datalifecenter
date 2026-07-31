import { lazy, type ComponentType } from 'react';

const RELOAD_KEY = 'dl_chunk_reloaded';

// Private rejimda sessionStorage istisno otishi mumkin — hech qachon yiqilmasin
function readFlag(): boolean {
  try {
    return sessionStorage.getItem(RELOAD_KEY) === '1';
  } catch {
    return true; // o'qib bo'lmasa qayta yuklashga urinmaymiz (loop xavfi)
  }
}

function writeFlag(value: boolean): void {
  try {
    if (value) sessionStorage.setItem(RELOAD_KEY, '1');
    else sessionStorage.removeItem(RELOAD_KEY);
  } catch {
    // e'tiborsiz
  }
}

/**
 * `lazy()` ustiga qo'yiladigan himoya: yangi deploy'dan keyin fayl nomlaridagi
 * hash o'zgaradi, foydalanuvchining brauzerida esa eski `index.html` qolgan
 * bo'lishi mumkin — u endi mavjud bo'lmagan chunk'ni so'raydi va import
 * yiqiladi. Natijada sahifa ochilmay qoladi (xato ekrani yoki oq ekran).
 *
 * Bunday holatda sahifani BIR MARTA qayta yuklaymiz — brauzer yangi
 * `index.html`ni oladi va to'g'ri chunk nomlari bilan ishlaydi. Sessiya bayrog'i
 * cheksiz qayta-yuklanish siklini oldini oladi: ikkinchi marta yiqilsa xato
 * odatdagidek yuqoriga uzatiladi va `RouteErrorPage` ko'rsatiladi.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- React.lazy'ning o'z imzosi ham shunday
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const mod = await factory();
      // Muvaffaqiyatli yuklandi — keyingi deploy uchun imkon qayta ochiladi
      writeFlag(false);
      return mod;
    } catch (err) {
      if (!readFlag()) {
        writeFlag(true);
        window.location.reload();
        // Sahifa qayta yuklanguncha Suspense'ni ushlab turamiz: bu promise
        // hech qachon hal bo'lmaydi, ya'ni xato ekrani bir zumga ham chiqmaydi
        await new Promise<never>(() => {});
      }
      throw err;
    }
  });
}
