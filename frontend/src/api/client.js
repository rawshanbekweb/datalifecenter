const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export class ApiClientError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
  } catch {
    throw new ApiClientError("Serverga ulanib bo'lmadi. Internet aloqasini tekshiring.", 0, 'NETWORK_ERROR');
  }

  const body = await res.json().catch(() => null);

  if (!res.ok || !body?.success) {
    const message = body?.error?.message || 'Kutilmagan xatolik yuz berdi';
    throw new ApiClientError(message, res.status, body?.error?.code);
  }

  return body.data;
}
