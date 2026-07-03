import { apiFetch } from './client';

export function createEnrollment(courseId) {
  return apiFetch('/enrollments', { method: 'POST', body: JSON.stringify({ courseId }) });
}

export function getMyEnrollments() {
  return apiFetch('/enrollments/me');
}

export function mockPayEnrollment(enrollmentId) {
  return apiFetch(`/enrollments/${enrollmentId}/mock-pay`, { method: 'POST' });
}
