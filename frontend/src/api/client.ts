import { API_URL } from './config';
import { getToken } from './token';

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

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Token bo'lsa header orqali ham yuboriladi — krossdomen cookie bloklangan
  // brauzerlarda (Safari) ham autentifikatsiya ishlashi uchun
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string>),
      },
      ...options,
    });
  } catch {
    throw new ApiClientError("Serverga ulanib bo'lmadi. Internet aloqasini tekshiring.", 0, 'NETWORK_ERROR');
  }

  const body: ApiResponse<T> | null = await res.json().catch(() => null);

  if (!res.ok || !body?.success) {
    const message: string = body?.error?.message || 'Kutilmagan xatolik yuz berdi';
    throw new ApiClientError(message, res.status, body?.error?.code);
  }

  return body.data;
}
