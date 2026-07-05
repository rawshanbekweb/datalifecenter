import { apiFetch } from './client';

export function createEnrollment(courseId: string | number): Promise<any> {
  return apiFetch('/enrollments', { method: 'POST', body: JSON.stringify({ courseId }) });
}

export function getMyEnrollments(): Promise<any> {
  return apiFetch('/enrollments/me');
}

export function mockPayEnrollment(enrollmentId: string | number): Promise<any> {
  return apiFetch(`/enrollments/${enrollmentId}/mock-pay`, { method: 'POST' });
}

export interface ListEnrollmentsAdminParams {
  status?: string;
  paymentStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function listEnrollmentsAdmin(params: ListEnrollmentsAdminParams = {}): Promise<any> {
  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    )
  ).toString();
  return apiFetch(`/enrollments/admin${query ? `?${query}` : ''}`);
}

export function updateEnrollmentAdmin(
  id: string,
  data: { status?: string; paymentStatus?: string }
): Promise<any> {
  return apiFetch(`/enrollments/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}
