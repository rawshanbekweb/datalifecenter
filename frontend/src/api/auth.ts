import { apiFetch } from './client';
import { clearToken, setToken } from './token';

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  [key: string]: unknown;
}

export interface LoginForm {
  email: string;
  password: string;
  [key: string]: unknown;
}

// Backend {user, token} qaytaradi — token localStorage'ga olinadi (Safari'da
// krossdomen cookie ishlamaydi), chaqiruvchiga esa faqat user beriladi.
export async function registerUser(form: unknown): Promise<any> {
  const data = await apiFetch<{ user: any; token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(form),
  });
  setToken(data.token);
  return data.user;
}

export async function loginUser(form: unknown): Promise<any> {
  const data = await apiFetch<{ user: any; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(form),
  });
  setToken(data.token);
  return data.user;
}

export async function logoutUser(): Promise<any> {
  try {
    return await apiFetch('/auth/logout', { method: 'POST' });
  } finally {
    clearToken();
  }
}

export function fetchMe(): Promise<any> {
  return apiFetch('/auth/me');
}

export function updateProfile(data: { name?: string; phone?: string | null; avatarUrl?: string | null }): Promise<any> {
  return apiFetch('/auth/me', { method: 'PATCH', body: JSON.stringify(data) });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<any> {
  const data = await apiFetch<{ message: string; token: string }>('/auth/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  // Parol o'zgarganda eski sessiyalar bekor bo'ladi — joriy sessiya yangi token oladi
  if (data.token) setToken(data.token);
  return data;
}

export function verifyEmail(token: string): Promise<{ message: string }> {
  return apiFetch('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) });
}

export function resendVerification(): Promise<{ message: string }> {
  return apiFetch('/auth/resend-verification', { method: 'POST' });
}

export function forgotPassword(email: string): Promise<{ message: string }> {
  return apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
}

export function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  return apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) });
}
