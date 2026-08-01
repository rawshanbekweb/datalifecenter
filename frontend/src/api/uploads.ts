import { API_URL } from './config';
import { apiFetch } from './client';
import { getToken } from './token';
import i18n from '../i18n/i18n';

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface UploadConfig {
  /** false bo'lsa fayllar ephemeral diskda qoladi va deployda yo'qoladi */
  cloudStorage: boolean;
}

export function getUploadConfig(): Promise<UploadConfig> {
  return apiFetch('/uploads/config');
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

// fetch o'rniga XHR — yuklash jarayonini (progress) ko'rsatish uchun
export async function uploadFile(
  file: File,
  kind: 'image' | 'video',
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      return await once(file, kind, onProgress);
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
