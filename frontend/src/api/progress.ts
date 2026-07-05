import { apiFetch } from './client';

export interface ProgressSummary {
  totalLessons: number;
  completedLessons: number;
  enrollmentStatus: string;
  courseCompleted: boolean;
}

export function completeLesson(lessonId: string): Promise<ProgressSummary> {
  return apiFetch(`/progress/lessons/${lessonId}/complete`, { method: 'POST' });
}

export function uncompleteLesson(lessonId: string): Promise<ProgressSummary> {
  return apiFetch(`/progress/lessons/${lessonId}/complete`, { method: 'DELETE' });
}
