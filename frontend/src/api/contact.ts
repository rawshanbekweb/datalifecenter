import { apiFetch } from './client';

export interface ContactForm {
  name: string;
  email: string;
  message: string;
  [key: string]: unknown;
}

export function sendContactMessage(form: unknown): Promise<any> {
  return apiFetch('/contact', {
    method: 'POST',
    body: JSON.stringify(form),
  });
}

export function listContactMessages(): Promise<any> {
  return apiFetch('/contact');
}

export function updateContactMessageStatus(id: string | number, status: string): Promise<any> {
  return apiFetch(`/contact/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
