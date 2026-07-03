import { apiFetch } from './client';

export function listMentors() {
  return apiFetch('/mentors');
}

export function getMentorById(id) {
  return apiFetch(`/mentors/${id}`);
}

export function createMentor(data) {
  return apiFetch('/mentors', { method: 'POST', body: JSON.stringify(data) });
}

export function updateMentor(id, data) {
  return apiFetch(`/mentors/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function deleteMentor(id) {
  return apiFetch(`/mentors/${id}`, { method: 'DELETE' });
}
