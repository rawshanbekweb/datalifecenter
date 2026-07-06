// API bazaviy URL — bitta joyda normalizatsiya qilinadi.
// Backend hamma route'larni /api ostida beradi, shuning uchun env'da
// /api unutilgan bo'lsa ham o'zimiz qo'shamiz (production'dagi 404 xatolarning oldini oladi).
function normalizeApiUrl(raw: string | undefined): string {
  const fallback = import.meta.env.PROD
    ? 'https://datalife.onrender.com/api'
    : 'http://localhost:4000/api';

  if (!raw || !raw.trim()) return fallback;

  let url = raw.trim().replace(/\/+$/, '');
  if (!url.endsWith('/api')) url += '/api';
  return url;
}

export const API_URL: string = normalizeApiUrl(import.meta.env.VITE_API_URL);
