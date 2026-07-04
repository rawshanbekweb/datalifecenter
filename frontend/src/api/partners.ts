import { apiFetch } from './client';

export interface PartnerData {
  [key: string]: unknown;
}

export function listPartners(category?: string): Promise<any> {
  const query: string = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiFetch(`/partners${query}`);
}

export function createPartner(data: unknown): Promise<any> {
  return apiFetch('/partners', { method: 'POST', body: JSON.stringify(data) });
}

export function updatePartner(id: string | number, data: unknown): Promise<any> {
  return apiFetch(`/partners/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deletePartner(id: string | number): Promise<any> {
  return apiFetch(`/partners/${id}`, { method: 'DELETE' });
}
