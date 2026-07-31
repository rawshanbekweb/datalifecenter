import { apiFetch } from './client';

/** URL'dagi qisqa kontent turi — backenddagi TARGET_BY_SLUG bilan bir xil. */
export type EngagementTarget = 'blog' | 'project' | 'course' | 'testimonial';

export interface EngagementStats {
  contentId: string;
  likesCount: number;
  /** Sharhlarda ko'rishlar hisoblanmaydi — null keladi */
  views: number | null;
  /** Shu qurilma yoqtirganmi */
  liked: boolean;
}

export interface LikeResult {
  liked: boolean;
  likesCount: number;
}

export interface ViewResult {
  views: number;
  /** Dublikat bo'lsa false — hisob oshmagan */
  counted: boolean;
}

/**
 * Bir nechta element uchun hisoblagichlarni bitta so'rovda oladi.
 * Ro'yxat sahifalarida har karta uchun alohida so'rov yuborilsa
 * bitta sahifa ochilishi o'nlab so'rovga aylanardi.
 */
export function getEngagementStats(
  target: EngagementTarget,
  ids: string[],
  signal?: AbortSignal,
): Promise<EngagementStats[]> {
  if (ids.length === 0) return Promise.resolve([]);
  return apiFetch(`/engagement/${target}?ids=${encodeURIComponent(ids.join(','))}`, { signal });
}

/** Yoqtirishni almashtiradi (qo'yilgan bo'lsa oladi). */
export function toggleLike(target: EngagementTarget, id: string): Promise<LikeResult> {
  return apiFetch(`/engagement/${target}/${id}/like`, { method: 'POST' });
}

/** Ko'rishni qayd etadi — bir qurilma uchun 24 soatda bir marta sanaladi. */
export function registerView(target: EngagementTarget, id: string): Promise<ViewResult> {
  return apiFetch(`/engagement/${target}/${id}/view`, { method: 'POST' });
}
