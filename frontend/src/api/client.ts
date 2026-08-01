import { API_URL } from './config';
import { getToken } from './token';
import { getDeviceId } from './device';
import { trackRequest } from './serverStatus';
import { detectLocale } from '../i18n/locale';
import i18n from '../i18n/i18n';

export class ApiClientError extends Error {
  status: number;
  code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: {
    message?: string;
    code?: string;
  };
}

// Bepul Render rejasida uxlab qolgan servis birinchi so'rovda ~30-60 soniya
// uyg'onadi. Timeout shundan uzunroq bo'lishi kerak, aks holda uyg'otish
// so'rovining o'zi uzilib, sayt hech qachon ochilmaydi.
const TIMEOUT_MS = 45_000;
// Idempotent (GET) so'rovlar tarmoq uzilishi yoki shlyuz xatosida qayta uriniladi.
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = [800, 2500];
const RETRYABLE_STATUS = new Set([502, 503, 504]);

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

function isIdempotent(method: string | undefined): boolean {
  const m = (method ?? 'GET').toUpperCase();
  return m === 'GET' || m === 'HEAD';
}

/**
 * Chaqiruvchi o'z `signal`ini bergan bo'lsa (masalan komponent unmount bo'lganda
 * bekor qilish) uni timeout signali bilan birlashtiramiz — ikkalasidan biri
 * ishga tushsa so'rov to'xtaydi.
 */
function withTimeout(signal: AbortSignal | null | undefined): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException('Timeout', 'TimeoutError')), TIMEOUT_MS);

  const onAbort = (): void => controller.abort(signal?.reason);
  if (signal) {
    if (signal.aborted) onAbort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }

  return {
    signal: controller.signal,
    cancel: () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    },
  };
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Token bo'lsa header orqali ham yuboriladi — krossdomen cookie bloklangan
  // brauzerlarda (Safari) ham autentifikatsiya ishlashi uchun
  const token = getToken();
  const retries = isIdempotent(options.method) ? MAX_RETRIES : 0;
  const finishTracking = trackRequest();

  try {
    for (let attempt = 0; ; attempt += 1) {
      const { signal, cancel } = withTimeout(options.signal);
      let res: Response;

      try {
        res = await fetch(`${API_URL}${path}`, {
          credentials: 'include',
          ...options,
          signal,
          headers: {
            'Content-Type': 'application/json',
            'X-Locale': detectLocale().locale,
            // Anonim yoqtirish/ko'rish hisoblagichlari uchun — cookie
            // krossdomen bloklanadigani sabab header orqali yuboriladi
            'X-Device-Id': getDeviceId(),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers as Record<string, string>),
          },
        });
      } catch {
        cancel();
        // Chaqiruvchining o'zi bekor qilgan bo'lsa qayta urinmaymiz
        if (options.signal?.aborted) throw new ApiClientError(i18n.t('errors.network'), 0, 'ABORTED');
        if (attempt < retries) {
          await sleep(RETRY_DELAY_MS[attempt] ?? 2500);
          continue;
        }
        throw new ApiClientError(i18n.t('errors.network'), 0, 'NETWORK_ERROR');
      }

      cancel();

      // Shlyuz xatolari (Render uyg'onayotganda yoki qayta deploy paytida) o'tkinchi
      if (RETRYABLE_STATUS.has(res.status) && attempt < retries) {
        await sleep(RETRY_DELAY_MS[attempt] ?? 2500);
        continue;
      }

      const body: ApiResponse<T> | null = await res.json().catch(() => null);

      if (!res.ok || !body?.success) {
        const message: string = body?.error?.message || i18n.t('errors.generic');
        throw new ApiClientError(message, res.status, body?.error?.code);
      }

      return body.data;
    }
  } finally {
    finishTracking();
  }
}
