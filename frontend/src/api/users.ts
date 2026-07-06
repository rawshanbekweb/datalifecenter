import { apiFetch } from './client';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: 'STUDENT' | 'MENTOR' | 'ADMIN';
  isBlocked: boolean;
  avatarUrl?: string | null;
  createdAt: string;
  _count: { enrollments: number };
}

export interface UsersListResult {
  items: AdminUser[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface ListUsersParams {
  role?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function listUsers(params: ListUsersParams = {}): Promise<UsersListResult> {
  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    )
  ).toString();
  return apiFetch(`/users${query ? `?${query}` : ''}`);
}

export function updateUserRole(id: string, role: string): Promise<AdminUser> {
  return apiFetch(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
}

export function setUserBlocked(id: string, blocked: boolean): Promise<AdminUser> {
  return apiFetch(`/users/${id}/block`, { method: 'PATCH', body: JSON.stringify({ blocked }) });
}

export function deleteUser(id: string): Promise<{ deleted: boolean }> {
  return apiFetch(`/users/${id}`, { method: 'DELETE' });
}

export function resetUserPassword(id: string): Promise<{ tempPassword: string }> {
  return apiFetch(`/users/${id}/reset-password`, { method: 'POST' });
}
