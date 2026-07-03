import { apiFetch } from './client';

export function registerUser(form) {
  return apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(form) });
}

export function loginUser(form) {
  return apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(form) });
}

export function logoutUser() {
  return apiFetch('/auth/logout', { method: 'POST' });
}

export function fetchMe() {
  return apiFetch('/auth/me');
}
