import { apiFetch } from './client';

export function sendContactMessage(form) {
  return apiFetch('/contact', {
    method: 'POST',
    body: JSON.stringify(form),
  });
}

export function listContactMessages() {
  return apiFetch('/contact');
}

export function updateContactMessageStatus(id, status) {
  return apiFetch(`/contact/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
