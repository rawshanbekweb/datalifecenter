import { apiFetch } from './client';

export type GroupFormat = 'ONLINE' | 'OFFLINE';
export type CourseGroupStatus = 'PLANNED' | 'ACTIVE' | 'FINISHED';

export interface CourseGroup {
  id: string;
  courseId: string;
  name: string;
  format: GroupFormat;
  mentorId: string | null;
  status: CourseGroupStatus;
  startsAt: string;
  endsAt: string | null;
  /** 0 = yakshanba ... 6 = shanba (JS Date.getDay bilan bir xil) */
  weekdays: number[];
  /** "18:00" — mahalliy vaqt, sanasiz */
  startTime: string | null;
  durationMin: number;
  room: string | null;
  capacity: number | null;
  course: { id: string; title: string; slug: string; color: string; iconKey: string };
  mentor: { id: string; name: string; photoUrl: string | null } | null;
  _count: { enrollments: number };
}

export interface CourseGroupMember {
  id: string;
  status: string;
  paymentStatus: string;
  enrolledAt: string;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
}

export type CourseGroupDetail = CourseGroup & { enrollments: CourseGroupMember[] };

/** O'quvchining o'z guruhi — kabinetdagi jadval kartasi uchun */
export type MyCourseGroup = CourseGroup & { enrollmentId: string };

export interface CourseGroupInput {
  courseId?: string;
  name: string;
  format: GroupFormat;
  mentorId?: string | null;
  status?: CourseGroupStatus;
  startsAt: string;
  endsAt?: string | null;
  weekdays?: number[];
  startTime?: string | null;
  durationMin?: number;
  room?: string | null;
  capacity?: number | null;
}

export function listCourseGroups(params: {
  courseId?: string;
  status?: CourseGroupStatus;
  format?: GroupFormat;
} = {}): Promise<CourseGroup[]> {
  const query = new URLSearchParams();
  if (params.courseId) query.set('courseId', params.courseId);
  if (params.status) query.set('status', params.status);
  if (params.format) query.set('format', params.format);
  const qs = query.toString();
  return apiFetch(`/course-groups${qs ? `?${qs}` : ''}`);
}

export function listMyCourseGroups(): Promise<MyCourseGroup[]> {
  return apiFetch('/course-groups/mine');
}

export function getCourseGroup(id: string): Promise<CourseGroupDetail> {
  return apiFetch(`/course-groups/${id}`);
}

export function createCourseGroup(input: CourseGroupInput): Promise<CourseGroup> {
  return apiFetch('/course-groups', { method: 'POST', body: JSON.stringify(input) });
}

export function updateCourseGroup(id: string, input: Partial<CourseGroupInput>): Promise<CourseGroup> {
  return apiFetch(`/course-groups/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteCourseGroup(id: string): Promise<{ deleted: boolean }> {
  return apiFetch(`/course-groups/${id}`, { method: 'DELETE' });
}

/** O'quvchining yozilishini guruhga biriktirish */
export function addGroupMember(groupId: string, enrollmentId: string): Promise<unknown> {
  return apiFetch(`/course-groups/${groupId}/members`, {
    method: 'POST',
    body: JSON.stringify({ enrollmentId }),
  });
}

export function removeGroupMember(groupId: string, enrollmentId: string): Promise<unknown> {
  return apiFetch(`/course-groups/${groupId}/members/${enrollmentId}`, { method: 'DELETE' });
}
