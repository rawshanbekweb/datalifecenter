import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { SUPPORTED_LOCALES } from '../src/config/locale';
import { ERROR_MESSAGES } from '../src/i18n/errorMessages';
import { normalizeMessageKey, translateErrorMessage } from '../src/i18n/translateError';

/**
 * DRIFT QO'RIQCHISI.
 *
 * `i18n/errorMessages.ts` lug'atining kaliti — o'zbekcha matnning O'ZI. Bu
 * qulay (bitta ham `ApiError` chaqiruvini o'zgartirish kerak bo'lmadi), lekin
 * bitta zaifligi bor: kimdir manbadagi xabar matnini tahrirlasa, tarjima
 * jimgina uzilib qoladi va foydalanuvchi yana o'zbekcha xabar ko'radi.
 *
 * Shu test aynan o'sha holatni ushlaydi: manbadan barcha xato matnlarini
 * yig'ib, har biri lug'atda borligini tekshiradi. Test yiqilsa — yangi/
 * o'zgargan matnni `errorMessages.ts` ga qo'shish kerak.
 */

const SRC = path.resolve(__dirname, '../src');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return entry.name.endsWith('.ts') ? [full] : [];
  });
}

/** Berilgan pozitsiyadagi (qo'shtirnoq turini o'zi aniqlaydi) satr literalini o'qiydi. */
function readStringLiteral(source: string, start: number): string | null {
  const quote = source[start];
  if (quote !== "'" && quote !== '"' && quote !== '`') return null;
  let out = '';
  for (let i = start + 1; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '\\') {
      out += source[i + 1];
      i += 1;
      continue;
    }
    if (ch === quote) return out;
    out += ch;
  }
  return null;
}

/**
 * `ApiError.notFound('...')`, `new ApiError(404, '...')` va
 * `tooManyRequestsHandler('...')` chaqiruvlaridagi birinchi satr argumenti.
 * Shablonli (`${...}`) matnlar tashlab yuboriladi — ular dinamik, lug'atda
 * bo'lishi ham mumkin emas.
 */
function collectMessages(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  const call = /ApiError\.(?:badRequest|unauthorized|forbidden|notFound|conflict)\(\s*|new ApiError\(\s*\d+\s*,\s*|tooManyRequestsHandler\(\s*/g;

  for (const file of sourceFiles(SRC)) {
    // Lug'atning o'zi va uni o'qiydigan modul hisobga olinmaydi
    if (file.includes(`${path.sep}i18n${path.sep}`)) continue;
    const source = fs.readFileSync(file, 'utf8');
    let match: RegExpExecArray | null;
    call.lastIndex = 0;
    while ((match = call.exec(source))) {
      const literal = readStringLiteral(source, match.index + match[0].length);
      if (!literal || literal.includes('${')) continue;
      const where = found.get(literal) ?? [];
      where.push(path.relative(SRC, file));
      found.set(literal, where);
    }
  }
  return found;
}

/**
 * Zod validatorlaridagi xabarlar.
 *
 * Ular `ApiError` orqali emas, `validateBody`/`validateQuery` orqali
 * foydalanuvchiga yetadi, lekin bir xil lug'atdan tarjima qilinadi — demak
 * ular ham qo'riqlanishi kerak.
 *
 * FAQAT to'g'ridan-to'g'ri satr literallari yig'iladi. `atLeastOne('afzallik')`
 * kabi yordamchi chaqiruvlar ATAYIN chetda qoladi: ulardagi literal —
 * xabarning bo'lagi, xabarning o'zi emas, shuning uchun lug'atda bo'lishi ham
 * mumkin emas (bunday xabarlar o'zbekcha holida qoladi).
 */
function collectValidatorMessages(): Map<string, string[]> {
  const found = new Map<string, string[]>();
  const anchors =
    /(?:message|error)\s*:\s*|\.(?:min|max|length|regex|refine|superRefine|email|url|int|positive|nonempty)\([^,()]*,\s*/g;

  for (const file of sourceFiles(path.join(SRC, 'validators'))) {
    const source = fs.readFileSync(file, 'utf8');
    let match: RegExpExecArray | null;
    anchors.lastIndex = 0;
    while ((match = anchors.exec(source))) {
      const literal = readStringLiteral(source, match.index + match[0].length);
      // Faqat odam o'qiydigan matnlar: qisqa texnik bo'laklar va shablonlar emas
      if (!literal || literal.includes('${') || literal.length < 4 || !/[a-zA-Z]/.test(literal)) continue;
      const where = found.get(literal) ?? [];
      where.push(path.relative(SRC, file));
      found.set(literal, where);
    }
  }
  return found;
}

describe('server xato xabarlari tarjimasi', () => {
  const messages = collectMessages();
  const validatorMessages = collectValidatorMessages();

  it('manbadan xabarlar topildi (regex buzilib qolmaganini tekshiradi)', () => {
    expect(messages.size).toBeGreaterThan(80);
  });

  it("manbadagi har bir xato matni lug'atda bor", () => {
    const missing = [...messages.entries()]
      .filter(([message]) => !(normalizeMessageKey(message) in ERROR_MESSAGES))
      .map(([message, files]) => `${message}  →  ${[...new Set(files)].join(', ')}`);

    expect(
      missing,
      `Quyidagi xabarlar src/i18n/errorMessages.ts da yo'q:\n${missing.join('\n')}`
    ).toEqual([]);
  });

  it("validatorlardagi har bir xabar ham lug'atda bor", () => {
    expect(validatorMessages.size).toBeGreaterThan(50);

    const missing = [...validatorMessages.entries()]
      .filter(([message]) => !(normalizeMessageKey(message) in ERROR_MESSAGES))
      .map(([message, files]) => `${message}  →  ${[...new Set(files)].join(', ')}`);

    expect(
      missing,
      `Quyidagi validator xabarlari src/i18n/errorMessages.ts da yo'q:\n${missing.join('\n')}`
    ).toEqual([]);
  });

  it("lug'atdagi har bir yozuvda uchala til ham to'ldirilgan", () => {
    const incomplete = Object.entries(ERROR_MESSAGES)
      .filter(([, value]) => !value.ru?.trim() || !value.kaa?.trim() || !value.en?.trim())
      .map(([key]) => key);

    expect(incomplete).toEqual([]);
  });

  it("kalitlarda tipografik apostrof ishlatilmagan (normalizatsiyadan keyin topilmay qolardi)", () => {
    const wrong = Object.keys(ERROR_MESSAGES).filter((key) => key !== normalizeMessageKey(key));
    expect(wrong).toEqual([]);
  });

  it("tarjima har bir tilda ishlaydi, uz o'zgarishsiz qoladi", () => {
    expect(translateErrorMessage('Kurs topilmadi', 'uz')).toBe('Kurs topilmadi');
    expect(translateErrorMessage('Kurs topilmadi', 'ru')).toBe('Курс не найден');
    expect(translateErrorMessage('Kurs topilmadi', 'kaa')).toBe('Kurs tabılmadı');
    expect(translateErrorMessage('Kurs topilmadi', 'en')).toBe('Course not found');
  });

  it('tipografik apostrofli variant ham tarjima bo\'ladi', () => {
    // Kodda ikkala yozuv ham uchraydi: "So'rov topilmadi" va "So‘rov topilmadi"
    expect(translateErrorMessage('So‘rov topilmadi', 'ru')).toBe('Заявка не найдена');
    expect(translateErrorMessage("So'rov topilmadi", 'ru')).toBe('Заявка не найдена');
  });

  it("lug'atda yo'q matn o'zgarishsiz qaytadi", () => {
    const unknown = 'Kamida bitta statistika kartasi kerak';
    for (const locale of SUPPORTED_LOCALES) {
      expect(translateErrorMessage(unknown, locale)).toBe(unknown);
    }
  });
});
