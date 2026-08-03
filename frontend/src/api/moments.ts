import { apiFetch } from './client';

export function listMoments(): Promise<any> {
  return apiFetch('/moments');
}

export function listMomentsAdmin(): Promise<any> {
  return apiFetch('/moments/admin');
}

export function createMoment(data: unknown): Promise<any> {
  return apiFetch('/moments', { method: 'POST', body: JSON.stringify(data) });
}

export function updateMoment(id: string, data: unknown): Promise<any> {
  return apiFetch(`/moments/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteMoment(id: string): Promise<any> {
  return apiFetch(`/moments/${id}`, { method: 'DELETE' });
}
