import { apiFetch } from './client';

export interface CourseListParams {
  [key: string]: string | number | boolean | undefined;
}

export interface CourseData {
  [key: string]: unknown;
}

export function listCourses(params: CourseListParams = {}): Promise<any> {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '') as [string, string][])
  ).toString();
  return apiFetch(`/courses${query ? `?${query}` : ''}`);
}

export function getCourseBySlug(slug: string): Promise<any> {
  return apiFetch(`/courses/${slug}`);
}

export function listCoursesAdmin(): Promise<any> {
  return apiFetch('/courses/admin');
}

export function getCourseByIdAdmin(id: string | number): Promise<any> {
  return apiFetch(`/courses/admin/${id}`);
}

export function createCourse(data: unknown): Promise<any> {
  return apiFetch('/courses', { method: 'POST', body: JSON.stringify(data) });
}

export function updateCourse(id: string | number, data: unknown): Promise<any> {
  return apiFetch(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteCourse(id: string | number): Promise<any> {
  return apiFetch(`/courses/${id}`, { method: 'DELETE' });
}
