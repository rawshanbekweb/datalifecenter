import { apiFetch } from './client';
import { API_URL } from './config';

export function createEnrollment(courseId: string | number): Promise<any> {
  return apiFetch('/enrollments', { method: 'POST', body: JSON.stringify({ courseId }) });
}

export function getMyEnrollments(): Promise<any> {
  return apiFetch('/enrollments/me');
}

export function mockPayEnrollment(enrollmentId: string | number): Promise<any> {
  return apiFetch(`/enrollments/${enrollmentId}/mock-pay`, { method: 'POST' });
}

export function submitReceipt(enrollmentId: string, receiptUrl: string): Promise<any> {
  return apiFetch(`/enrollments/${enrollmentId}/receipt`, {
    method: 'POST',
    body: JSON.stringify({ receiptUrl }),
  });
}

// PDF'ni blob sifatida olib, brauzerda yuklab olishni boshlaydi
export async function downloadCertificate(enrollmentId: string): Promise<void> {
  const res = await fetch(`${API_URL}/enrollments/${enrollmentId}/certificate`, { credentials: 'include' });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message || "Sertifikatni yuklab bo'lmadi");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sertifikat-DL-${String(enrollmentId).slice(-8).toUpperCase()}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface ListEnrollmentsAdminParams {
  status?: string;
  paymentStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function listEnrollmentsAdmin(params: ListEnrollmentsAdminParams = {}): Promise<any> {
  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    )
  ).toString();
  return apiFetch(`/enrollments/admin${query ? `?${query}` : ''}`);
}

export function updateEnrollmentAdmin(
  id: string,
  data: { status?: string; paymentStatus?: string; rejectionReason?: string }
): Promise<any> {
  return apiFetch(`/enrollments/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export interface CertificateInfo {
  certificateNo: string;
  studentName: string;
  courseTitle: string;
  durationMonths: number;
  completedAt: string | null;
}

// Ochiq tekshiruv — login talab qilinmaydi
export function verifyCertificate(no: string): Promise<CertificateInfo> {
  return apiFetch(`/certificates/${encodeURIComponent(no)}/verify`);
}
