import { apiFetch } from './client';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: 'STUDENT' | 'MENTOR' | 'ADMIN';
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
