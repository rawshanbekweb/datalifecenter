import { apiFetch } from './client';

export interface MentorData {
  [key: string]: unknown;
}

// `limit` — bosh sahifadagi qisqa ro'yxat uchun; /mentors sahifasi
// chegarasiz chaqiradi va hammasini oladi
export function listMentors(params: { limit?: number } = {}): Promise<any> {
  return apiFetch(`/mentors${params.limit ? `?limit=${params.limit}` : ''}`);
}

// Admin tahrirlash paneli — xom (barcha til) ma'lumot qaytaradi
export function listMentorsAdmin(): Promise<any> {
  return apiFetch('/mentors/admin');
}

export function getMentorById(id: string | number): Promise<any> {
  return apiFetch(`/mentors/${id}`);
}

export function createMentor(data: unknown): Promise<any> {
  return apiFetch('/mentors', { method: 'POST', body: JSON.stringify(data) });
}

export function updateMentor(id: string | number, data: unknown): Promise<any> {
  return apiFetch(`/mentors/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteMentor(id: string | number): Promise<any> {
  return apiFetch(`/mentors/${id}`, { method: 'DELETE' });
}

export function getMentorMe(): Promise<any> {
  return apiFetch('/mentors/me');
}

export function updateMentorMe(data: unknown): Promise<any> {
  return apiFetch('/mentors/me', { method: 'PATCH', body: JSON.stringify(data) });
}

export function getMentorCourse(id: string): Promise<any> {
  return apiFetch(`/mentors/me/courses/${id}`);
}

export function getMentorDashboard(): Promise<any> {
  return apiFetch('/mentors/me/dashboard');
}

export function getMentorStudents(): Promise<any> {
  return apiFetch('/mentors/me/students');
}
