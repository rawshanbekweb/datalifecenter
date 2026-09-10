import { apiFetch } from './client';
import { API_URL } from './config';
import { getToken } from './token';

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
  email: string;
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
 * Ikkala formatda ham Enrollment ochiladi; `groupId` berilsa o'quvchi
 * darrov jadvali bor guruhga tushadi va qabul xatida shu jadval ketadi.
 */
export function enrollFromRequest(
  id: string,
  options: { groupId?: string | null; paidAmount?: number | null } = {},
): Promise<CourseRequest> {
  return apiFetch(`/course-requests/${id}/enroll`, {
    method: 'POST',
    body: JSON.stringify({
      groupId: options.groupId || null,
      // undefined = "to'liq to'landi" (sukut), 0 = hozircha to'lanmadi
      paidAmount: options.paidAmount ?? null,
    }),
  });
}

/**
 * Joriy filtrga mos so'rovlarni CSV (Excel'da to'g'ridan-to'g'ri ochiladi)
 * fayl sifatida yuklab oladi. `credentials:'include'` yetarli emas — Safari
 * krossdomen cookie'ni bloklaydi, shuning uchun Bearer header ham yuboriladi.
 */
export async function exportCourseRequestsCsv(params: {
  status?: CourseRequestStatus;
  format?: CourseRequestFormat;
  search?: string;
} = {}): Promise<void> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.format) query.set('format', params.format);
  if (params.search) query.set('search', params.search);

  const token = getToken();
  const res = await fetch(`${API_URL}/course-requests/export?${query.toString()}`, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message || "Excelga yuklab bo'lmadi");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kurs-sorovlari-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
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
