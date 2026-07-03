import { apiFetch } from './client';

export function listBlogPosts(params = {}) {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
  ).toString();
  return apiFetch(`/blog${query ? `?${query}` : ''}`);
}

export function getBlogPostBySlug(slug) {
  return apiFetch(`/blog/${slug}`);
}

export function listBlogPostsAdmin() {
  return apiFetch('/blog/admin');
}

export function createBlogPost(data) {
  return apiFetch('/blog', { method: 'POST', body: JSON.stringify(data) });
}

export function updateBlogPost(id, data) {
  return apiFetch(`/blog/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteBlogPost(id) {
  return apiFetch(`/blog/${id}`, { method: 'DELETE' });
}
