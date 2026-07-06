import { apiFetch } from './client';

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

export function registerUser(form: unknown): Promise<any> {
  return apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(form) });
}

export function loginUser(form: unknown): Promise<any> {
  return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(form) });
}

export function logoutUser(): Promise<any> {
  return apiFetch('/auth/logout', { method: 'POST' });
}

export function fetchMe(): Promise<any> {
  return apiFetch('/auth/me');
}

export function updateProfile(data: { name?: string; phone?: string | null; avatarUrl?: string | null }): Promise<any> {
  return apiFetch('/auth/me', { method: 'PATCH', body: JSON.stringify(data) });
}

export function changePassword(currentPassword: string, newPassword: string): Promise<any> {
  return apiFetch('/auth/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
