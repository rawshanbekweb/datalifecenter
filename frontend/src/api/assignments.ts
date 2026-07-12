import { apiFetch } from './client';

export type SubmissionStatus = 'SUBMITTED' | 'ACCEPTED' | 'RETURNED';

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  userId: string;
  content: string;
  linkUrl?: string | null;
  fileUrl?: string | null;
  status: SubmissionStatus;
  grade?: number | null;
  feedback?: string | null;
  reviewedAt?: string | null;
  submittedAt: string;
  user: { id: string; name: string; email: string; avatarUrl?: string | null };
}

interface AssignmentBase {
  id: string;
  title: string;
  description: string;
  linkUrl?: string | null;
  dueAt?: string | null;
  createdAt: string;
  course: { id: string; title: string; slug: string; color: string; bg: string; border: string; iconKey: string };
  mentor: { id: string; name: string; photoUrl?: string | null };
}

// Talaba ko'rinishi — GET /assignments/mine
export interface MyAssignment extends AssignmentBase {
  mySubmission: AssignmentSubmission | null;
}

// Mentor/admin boshqaruv ko'rinishi — barcha javoblar bilan
export interface ManagedAssignment extends AssignmentBase {
  targetStudentIds: string[];
  submissions: AssignmentSubmission[];
}

export interface CreateAssignmentInput {
  courseId: string;
  title: string;
  description: string;
  linkUrl?: string;
  dueAt?: string;
  targetStudentIds?: string[];
}

export interface SubmitAssignmentInput {
  content: string;
  linkUrl?: string;
  fileUrl?: string;
}

export function getMyAssignments(): Promise<MyAssignment[]> {
  return apiFetch('/assignments/mine');
}

export function submitAssignment(id: string, input: SubmitAssignmentInput): Promise<AssignmentSubmission> {
  return apiFetch(`/assignments/${id}/submit`, { method: 'POST', body: JSON.stringify(input) });
}

export function getManagedAssignments(): Promise<ManagedAssignment[]> {
  return apiFetch('/assignments/manage');
}

export function createAssignment(input: CreateAssignmentInput): Promise<ManagedAssignment> {
  return apiFetch('/assignments', { method: 'POST', body: JSON.stringify(input) });
}

export function deleteAssignment(id: string): Promise<{ deleted: boolean }> {
  return apiFetch(`/assignments/${id}`, { method: 'DELETE' });
}

export function reviewSubmission(
  id: string,
  input: { status: 'ACCEPTED' | 'RETURNED'; grade?: number; feedback?: string }
): Promise<AssignmentSubmission> {
  return apiFetch(`/assignments/submissions/${id}/review`, { method: 'PATCH', body: JSON.stringify(input) });
}
