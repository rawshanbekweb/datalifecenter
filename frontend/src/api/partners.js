import { apiFetch } from './client';

export function listPartners(category) {
  const query = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiFetch(`/partners${query}`);
}

export function createPartner(data) {
  return apiFetch('/partners', { method: 'POST', body: JSON.stringify(data) });
}

export function updatePartner(id, data) {
  return apiFetch(`/partners/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deletePartner(id) {
  return apiFetch(`/partners/${id}`, { method: 'DELETE' });
}
