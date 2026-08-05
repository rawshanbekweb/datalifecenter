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
    /** Ko'rib chiqilmagan kurs so'rovlari */
    courseRequestsNew: number;
    /** Butun sayt bo'ylab ko'rishlar va yoqtirishlar yig'indisi */
    viewsTotal: number;
    likesTotal: number;
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
  /** Eng ko'p ko'rilgan kontent — har turdan 5 tadan */
  topContent: {
    courses: TopContentItem[];
    posts: TopContentItem[];
    projects: TopContentItem[];
  };
}

export interface TopContentItem {
  id: string;
  title: string;
  /** Loyihalarda alohida sahifa yo'q — slug bo'lmaydi */
  slug?: string;
  views: number;
  likesCount: number;
}

export function getAdminStats(): Promise<AdminStats> {
  return apiFetch('/admin/stats');
}

/** Monitoring uchun ruxsat etilgan davrlar — backend boshqa qiymatni 30 kunga tenglaydi */
export type AnalyticsDays = 7 | 30 | 90;

export type EngagementTarget = 'BLOG_POST' | 'PROJECT' | 'COURSE' | 'TESTIMONIAL';

export interface AnalyticsPoint {
  /** YYYY-MM-DD */
  day: string;
  views: number;
  likes: number;
  users: number;
  enrollments: number;
}

export interface AnalyticsTotals {
  views: number;
  likes: number;
  users: number;
  enrollments: number;
}

export interface AnalyticsTopItem {
  id: string;
  type: EngagementTarget;
  title: string;
  /** Loyihalarda alohida sahifa yo'q — slug bo'lmaydi */
  slug: string | null;
  views: number;
  likes: number;
}

export interface AdminAnalytics {
  range: { days: number; from: string; to: string };
  /** Har kun uchun bitta nuqta — hodisasiz kunlar ham nol bilan turadi */
  series: AnalyticsPoint[];
  totals: AnalyticsTotals;
  /** Oldingi shuncha kunlik davr — o'zgarishni hisoblash uchun */
  previous: AnalyticsTotals;
  byType: { type: EngagementTarget; views: number; likes: number }[];
  topContent: AnalyticsTopItem[];
}

export function getAdminAnalytics(days: AnalyticsDays): Promise<AdminAnalytics> {
  return apiFetch(`/admin/analytics?days=${days}`);
}
