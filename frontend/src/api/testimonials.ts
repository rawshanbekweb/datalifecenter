import { apiFetch } from './client';

export function listTestimonials(): Promise<any> {
  return apiFetch('/testimonials');
}

export function listTestimonialsAdmin(): Promise<any> {
  return apiFetch('/testimonials/admin');
}

export function createTestimonial(data: unknown): Promise<any> {
  return apiFetch('/testimonials', { method: 'POST', body: JSON.stringify(data) });
}

export function updateTestimonial(id: string, data: unknown): Promise<any> {
  return apiFetch(`/testimonials/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteTestimonial(id: string): Promise<any> {
  return apiFetch(`/testimonials/${id}`, { method: 'DELETE' });
}
