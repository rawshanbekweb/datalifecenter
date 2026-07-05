import { apiFetch } from './client';

export interface AdminStats {
  counts: {
    usersTotal: number;
    studentsTotal: number;
    coursesTotal: number;
    coursesPublished: number;
    enrollmentsTotal: number;
    enrollmentsPending: number;
    enrollmentsActive: number;
    messagesNew: number;
    blogPostsTotal: number;
    mentorsTotal: number;
  };
  recentEnrollments: {
    id: string;
    status: string;
    paymentStatus: string;
    enrolledAt: string;
    user: { id: string; name: string; email: string };
    course: { id: string; title: string; slug: string };
  }[];
  recentMessages: {
    id: string;
    name: string;
    email: string;
    subject?: string | null;
    message: string;
    status: string;
    createdAt: string;
  }[];
}

export function getAdminStats(): Promise<AdminStats> {
  return apiFetch('/admin/stats');
}
