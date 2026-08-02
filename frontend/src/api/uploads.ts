import { API_URL } from './config';
import { apiFetch } from './client';
import { getToken } from './token';
import i18n from '../i18n/i18n';
import { downscaleImage } from '../utils/imageResize';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface UploadConfig {
  /** false bo'lsa fayllar ephemeral diskda qoladi va deployda yo'qoladi */
  cloudStorage: boolean;
  /** Serverdagi limitlar — mijoz shu bo'yicha oldindan tekshiradi */
  imageMaxBytes?: number;
  videoMaxBytes?: number;
}

/**
 * Sozlamalar bir marta so'raladi va butun panel bo'ylab bo'lishiladi —
 * bitta formada 3-4 ta yuklash maydoni bo'lishi mumkin, har biri alohida
 * so'rov yubormasin.
 */
let configPromise: Promise<UploadConfig> | null = null;

export function getUploadConfig(): Promise<UploadConfig> {
  if (!configPromise) {
    configPromise = apiFetch<UploadConfig>('/uploads/config').catch((err: unknown) => {
      // Keyingi urinishda qayta so'ralsin — bitta uzilish butun sessiyaga
      // "sozlama yo'q" bo'lib qolmasin
      configPromise = null;
      throw err;
    });
  }
  return configPromise;
}

/**
 * Yuklash uchun kutish muddati.
 *
 * Bepul Render rejasida uxlab qolgan servis birinchi so'rovda ~30-60 soniya
 * uyg'onadi va shu vaqt davomida yuklash so'rovi javobsiz turadi. Ilgari
 * `xhr.timeout` UMUMAN o'rnatilmagan edi — ya'ni `ontimeout` ishlovchisi
 * hech qachon chaqirilmasdi va nosoz tarmoqda progress hech tugamaydigan
 * holatda qotib qolardi. Video kattaroq bo'lgani uchun unga uzunroq muddat.
 */
const TIMEOUT_MS: Record<'image' | 'video', number> = {
  image: 120_000,
  video: 900_000,
};

/**
 * Tarmoq uzilishi yoki servis uyg'onayotgan paytda qayta uriniladi.
 *
 * Yuklash idempotent emas, lekin takroriy urinish faqat yangi fayl yaratadi
 * (avvalgisi hech qayerga bog'lanmagan) — foydalanuvchining o'zi qayta
 * bosishidan farqi yo'q, faqat buni qo'lda qilishi shart emas.
 */
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = [1500, 4000];

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

class UploadError extends Error {
  /** Qayta urinish mantiqiymi (tarmoq yoki server tomonidagi vaqtinchalik xato) */
  retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.retryable = retryable;
  }
}

function once(
  file: File,
  kind: 'image' | 'video',
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}/uploads/${kind}`);
    xhr.withCredentials = true;
    xhr.timeout = TIMEOUT_MS[kind];
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      // Shlyuz xatolari (servis uyg'onmoqda yoki qayta deploy bo'lyapti)
      // JSON emas, HTML sahifa qaytaradi — uni tahlil qilishga urinmaymiz
      if (xhr.status >= 502) {
        reject(new UploadError(i18n.t('upload.serverWaking'), true));
        return;
      }
      try {
        const body = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && body?.success) {
          resolve(body.data as UploadResult);
        } else {
          // Fayl turi yoki hajmi xato bo'lsa qayta urinishning ma'nosi yo'q
          reject(new UploadError(body?.error?.message || i18n.t('upload.error'), xhr.status >= 500));
        }
      } catch {
        reject(new UploadError(i18n.t('upload.error'), xhr.status >= 500));
      }
    };

    // Tarmoq uzildi (Wi-Fi almashdi, qurilma uyquga ketdi) — brauzer buni
    // krossdomen so'rovda "CORS xatosi" deb ko'rsatadi, aslida javob umuman yo'q
    xhr.onerror = () => reject(new UploadError(i18n.t('upload.networkError'), true));
    xhr.ontimeout = () => reject(new UploadError(i18n.t('upload.timeout'), true));

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}

/**
 * Hajmni yuborishdan OLDIN tekshiradi.
 *
 * Limitdan katta fayl serverda baribir rad etiladi, lekin bunga qadar butun
 * fayl tarmoqqa chiqib bo'ladi — sekin internetda bu bir necha daqiqa kutib,
 * oxirida xato ko'rish demakdir. Limit serverdan keladi, shuning uchun ikki
 * tomonda ikki xil raqam bo'lib qolmaydi.
 *
 * Sozlamani olib bo'lmasa tekshiruv o'tkazib yuboriladi — yuklashning o'zi
 * ishlashi kerak, oxirgi so'z baribir serverda.
 */
async function assertSizeAllowed(file: File, kind: 'image' | 'video'): Promise<void> {
  let max: number | undefined;
  try {
    const cfg = await getUploadConfig();
    max = kind === 'image' ? cfg.imageMaxBytes : cfg.videoMaxBytes;
  } catch {
    return;
  }
  if (max && file.size > max) {
    throw new UploadError(i18n.t('upload.tooLarge', { max: Math.round(max / (1024 * 1024)) }), false);
  }
}

// fetch o'rniga XHR — yuklash jarayonini (progress) ko'rsatish uchun
export async function uploadFile(
  file: File,
  kind: 'image' | 'video',
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  // Rasm avval kichraytiriladi, tekshiruv esa HAQIQATAN yuborilayotgan
  // baytlarga qo'llanadi — telefon surati kichraytirilgach limitga sig'sa,
  // foydalanuvchini bekorga rad etmaymiz. Video o'z holicha ketadi.
  const payload = kind === 'image' ? await downscaleImage(file) : file;
  await assertSizeAllowed(payload, kind);

  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return await once(payload, kind, onProgress);
    } catch (err) {
      lastError = err;
      if (!(err instanceof UploadError) || !err.retryable || attempt === MAX_ATTEMPTS - 1) break;
      // Qayta urinishda progress noldan boshlanadi
      onProgress?.(0);
      await sleep(RETRY_DELAY_MS[attempt] ?? 4000);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(i18n.t('upload.error'));
}
