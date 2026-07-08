import { apiFetch } from './client';

export function listProjects(): Promise<any> {
  return apiFetch('/projects');
}

export function listProjectsAdmin(): Promise<any> {
  return apiFetch('/projects/admin');
}

export function createProject(data: unknown): Promise<any> {
  return apiFetch('/projects', { method: 'POST', body: JSON.stringify(data) });
}

export function updateProject(id: string, data: unknown): Promise<any> {
  return apiFetch(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteProject(id: string): Promise<any> {
  return apiFetch(`/projects/${id}`, { method: 'DELETE' });
}
