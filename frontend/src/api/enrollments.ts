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
