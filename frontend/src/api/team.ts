import { apiFetch } from './client';

export const DEPARTMENTS = [
  'LEADERSHIP',
  'ENGINEERING',
  'DATA',
  'DESIGN',
  'MARKETING',
  'EDUCATION',
  'OPERATIONS',
] as const;

export type Department = (typeof DEPARTMENTS)[number];

export function listTeam(): Promise<any> {
  return apiFetch('/team');
}

// Admin tahrirlash paneli — xom (barcha til) ma'lumot qaytaradi
export function listTeamAdmin(): Promise<any> {
  return apiFetch('/team/admin');
}

export function getTeamMember(slug: string): Promise<any> {
  return apiFetch(`/team/${slug}`);
}

export function createTeamMember(data: unknown): Promise<any> {
  return apiFetch('/team', { method: 'POST', body: JSON.stringify(data) });
}

export function updateTeamMember(id: string, data: unknown): Promise<any> {
  return apiFetch(`/team/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteTeamMember(id: string): Promise<any> {
  return apiFetch(`/team/${id}`, { method: 'DELETE' });
}

export function getTeamMemberMe(): Promise<any> {
  return apiFetch('/team/me');
}

export function updateTeamMemberMe(data: unknown): Promise<any> {
  return apiFetch('/team/me', { method: 'PATCH', body: JSON.stringify(data) });
}
