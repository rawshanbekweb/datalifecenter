import { apiFetch } from './client';

export interface ContactForm {
  name: string;
  email: string;
  message: string;
  [key: string]: unknown;
}

export function sendContactMessage(form: unknown): Promise<any> {
  return apiFetch('/contact', {
    method: 'POST',
    body: JSON.stringify(form),
  });
}

export function listContactMessages(params?: { status?: string; page?: number; limit?: number }): Promise<any> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return apiFetch(`/contact${qs ? `?${qs}` : ''}`);
}

export function updateContactMessageStatus(id: string | number, status: string): Promise<any> {
  return apiFetch(`/contact/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function deleteContactMessage(id: string): Promise<any> {
  return apiFetch(`/contact/${id}`, { method: 'DELETE' });
}

// Ommaviy o'chirish POST bilan: DELETE tanasi hamma proxy'da o'tmaydi
export function deleteContactMessages(ids: string[]): Promise<{ deleted: number }> {
  return apiFetch('/contact/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}
