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
