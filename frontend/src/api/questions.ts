import { apiFetch } from './client';

export interface LessonQuestion {
  id: string;
  body: string;
  answer?: string | null;
  answeredAt?: string | null;
  createdAt: string;
  user: { id: string; name: string; email?: string; avatarUrl?: string | null };
  lesson?: {
    id: string;
    title: string;
    module: { course: { id: string; title: string; slug: string } };
  };
}

export interface MentorRequest {
  id: string;
  subject: string;
  body: string;
  status: 'OPEN' | 'ANSWERED' | 'CLOSED';
  reply?: string | null;
  repliedAt?: string | null;
  createdAt: string;
  mentor?: { id: string; name: string; photoUrl?: string | null; user?: { email: string } | null };
}

// ---------- Dars savol-javoblari ----------

export function askQuestion(lessonId: string, body: string): Promise<LessonQuestion> {
  return apiFetch('/questions', { method: 'POST', body: JSON.stringify({ lessonId, body }) });
}

export function getLessonQuestions(lessonId: string): Promise<LessonQuestion[]> {
  return apiFetch(`/questions/lesson/${lessonId}`);
}

export function getMentorQuestions(): Promise<LessonQuestion[]> {
  return apiFetch('/questions/mentor');
}

export function answerQuestion(id: string, answer: string): Promise<LessonQuestion> {
  return apiFetch(`/questions/${id}/answer`, { method: 'PATCH', body: JSON.stringify({ answer }) });
}

// ---------- Mentor so'rovlari ----------

export function createMentorRequest(subject: string, body: string): Promise<MentorRequest> {
  return apiFetch('/mentor-requests', { method: 'POST', body: JSON.stringify({ subject, body }) });
}

export function getMyMentorRequests(): Promise<MentorRequest[]> {
  return apiFetch('/mentor-requests/mine');
}

export function getAllMentorRequests(): Promise<MentorRequest[]> {
  return apiFetch('/mentor-requests');
}

export function updateMentorRequest(id: string, data: { reply?: string; status?: MentorRequest['status'] }): Promise<MentorRequest> {
  return apiFetch(`/mentor-requests/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}
