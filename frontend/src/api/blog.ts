import { apiFetch } from './client';

export interface BlogListParams {
  [key: string]: string | number | boolean | undefined;
}

export interface BlogPostData {
  [key: string]: unknown;
}

export function listBlogPosts(params: BlogListParams = {}): Promise<any> {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '') as [string, string][])
  ).toString();
  return apiFetch(`/blog${query ? `?${query}` : ''}`);
}

export function getBlogPostBySlug(slug: string): Promise<any> {
  return apiFetch(`/blog/${slug}`);
}

export function listBlogPostsAdmin(): Promise<any> {
  return apiFetch('/blog/admin');
}

export function createBlogPost(data: unknown): Promise<any> {
  return apiFetch('/blog', { method: 'POST', body: JSON.stringify(data) });
}

export function updateBlogPost(id: string | number, data: unknown): Promise<any> {
  return apiFetch(`/blog/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteBlogPost(id: string | number): Promise<any> {
  return apiFetch(`/blog/${id}`, { method: 'DELETE' });
}
