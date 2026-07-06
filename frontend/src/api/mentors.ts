import { apiFetch } from './client';

export interface MentorData {
  [key: string]: unknown;
}

export function listMentors(): Promise<any> {
  return apiFetch('/mentors');
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

export function getMentorDashboard(): Promise<any> {
  return apiFetch('/mentors/me/dashboard');
}

export function getMentorStudents(): Promise<any> {
  return apiFetch('/mentors/me/students');
}
