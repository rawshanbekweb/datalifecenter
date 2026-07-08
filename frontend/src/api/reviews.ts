import { apiFetch } from './client';

export function listCourseReviews(slug: string): Promise<any> {
  return apiFetch(`/courses/${slug}/reviews`);
}

export function getMyCourseReview(slug: string): Promise<any> {
  return apiFetch(`/courses/${slug}/reviews/me`);
}

export function submitCourseReview(slug: string, data: { rating: number; comment: string }): Promise<any> {
  return apiFetch(`/courses/${slug}/reviews`, { method: 'POST', body: JSON.stringify(data) });
}

export function deleteMyCourseReview(slug: string): Promise<any> {
  return apiFetch(`/courses/${slug}/reviews/me`, { method: 'DELETE' });
}

export function listReviewsAdmin(): Promise<any> {
  return apiFetch('/reviews/admin?limit=100');
}

export function updateReviewAdmin(id: string, data: { published: boolean }): Promise<any> {
  return apiFetch(`/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteReviewAdmin(id: string): Promise<any> {
  return apiFetch(`/reviews/${id}`, { method: 'DELETE' });
}
