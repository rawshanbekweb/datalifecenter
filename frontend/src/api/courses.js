import { apiFetch } from './client';

export function listCourses(params = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
  ).toString();
  return apiFetch(`/courses${query ? `?${query}` : ''}`);
}

export function getCourseBySlug(slug) {
  return apiFetch(`/courses/${slug}`);
}

export function listCoursesAdmin() {
  return apiFetch('/courses/admin');
}

export function getCourseByIdAdmin(id) {
  return apiFetch(`/courses/admin/${id}`);
}

export function createCourse(data) {
  return apiFetch('/courses', { method: 'POST', body: JSON.stringify(data) });
}

export function updateCourse(id, data) {
  return apiFetch(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteCourse(id) {
  return apiFetch(`/courses/${id}`, { method: 'DELETE' });
}
