import { apiFetch } from './client';

export type CourseRequestFormat = 'ONLINE' | 'OFFLINE';
export type CourseRequestStatus = 'NEW' | 'CONTACTED' | 'ENROLLED' | 'REJECTED';

export interface CourseRequest {
  id: string;
  courseId: string;
  userId: string | null;
  format: CourseRequestFormat;
  name: string;
  phone: string;
  email: string | null;
  note: string | null;
  status: CourseRequestStatus;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
  course: { id: string; title: string; slug: string; format: string; color: string };
  user: { id: string; name: string; email: string; avatarUrl: string | null; focusX?: number; focusY?: number } | null;
}

export interface CreateCourseRequestInput {
  courseId: string;
  format: CourseRequestFormat;
  name: string;
  phone: string;
  email?: string;
  note?: string;
}

/** Ochiq so'rov — login talab qilinmaydi (mehmon ham yubora oladi). */
export function createCourseRequest(input: CreateCourseRequestInput): Promise<CourseRequest> {
  return apiFetch('/course-requests', { method: 'POST', body: JSON.stringify(input) });
}

export function listMyCourseRequests(): Promise<CourseRequest[]> {
  return apiFetch('/course-requests/mine');
}

export interface CourseRequestPage {
  items: CourseRequest[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function listCourseRequestsAdmin(params: {
  status?: CourseRequestStatus;
  format?: CourseRequestFormat;
  search?: string;
  page?: number;
} = {}): Promise<CourseRequestPage> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.format) query.set('format', params.format);
  if (params.search) query.set('search', params.search);
  query.set('page', String(params.page ?? 1));
  return apiFetch(`/course-requests?${query.toString()}`);
}

export function updateCourseRequest(
  id: string,
  data: { status?: CourseRequestStatus; reply?: string },
): Promise<CourseRequest> {
  return apiFetch(`/course-requests/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

/**
 * So'rovni tasdiqlab, o'quvchini kursga qo'shadi (joy tekshiruvi bilan).
 * Onlayn kursda darhol Enrollment ochiladi; offline'da so'rov ENROLLED
 * bo'ladi va shu offline guruhdagi band joyni bildiradi.
 */
export function enrollFromRequest(id: string): Promise<CourseRequest> {
  return apiFetch(`/course-requests/${id}/enroll`, { method: 'POST' });
}

export function deleteCourseRequest(id: string): Promise<{ deleted: boolean }> {
  return apiFetch(`/course-requests/${id}`, { method: 'DELETE' });
}

// Ommaviy o'chirish POST bilan: DELETE tanasi hamma proxy'da o'tmaydi
export function deleteCourseRequests(ids: string[]): Promise<{ deleted: number }> {
  return apiFetch('/course-requests/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}
