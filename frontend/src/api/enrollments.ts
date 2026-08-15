import { apiFetch } from './client';
import { API_URL } from './config';
import { getToken } from './token';

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

// Chek rasmini blob sifatida olib, <img>da ko'rsatish uchun vaqtinchalik object URL qaytaradi.
// Oddiy <img src> ishlatib bo'lmaydi — endpoint autentifikatsiya talab qiladi va Safari'da
// krossdomen cookie bloklangani uchun Bearer header orqali yuborilishi shart.
export async function getReceiptImageUrl(enrollmentId: string): Promise<string> {
  const token = getToken();
  const res = await fetch(`${API_URL}/enrollments/${enrollmentId}/receipt`, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error("Chekni yuklab bo'lmadi");
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
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
  format?: string;
  courseId?: string;
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

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'ONLINE' | 'OTHER';

export interface EnrollmentPayment {
  id: string;
  amount: string;
  method: PaymentMethod;
  note: string | null;
  paidAt: string;
  recordedBy?: { id: string; name: string } | null;
}

/** Summalar satr sifatida keladi — Decimal aniqligi float'da yo'qolmasin */
export interface PaymentSummary {
  agreed: string;
  paid: string;
  debt: string;
  paymentStatus: string;
}

export interface EnrollmentPaymentsResponse {
  currency: string;
  summary: PaymentSummary;
  payments: EnrollmentPayment[];
}

export function listEnrollmentPayments(enrollmentId: string): Promise<EnrollmentPaymentsResponse> {
  return apiFetch(`/enrollments/${enrollmentId}/payments`);
}

export function addEnrollmentPayment(
  enrollmentId: string,
  data: { amount: number; method?: PaymentMethod; paidAt?: string; note?: string | null }
): Promise<{ payment: EnrollmentPayment; summary: PaymentSummary }> {
  return apiFetch(`/enrollments/${enrollmentId}/payments`, { method: 'POST', body: JSON.stringify(data) });
}

export function deleteEnrollmentPayment(enrollmentId: string, paymentId: string): Promise<PaymentSummary> {
  return apiFetch(`/enrollments/${enrollmentId}/payments/${paymentId}`, { method: 'DELETE' });
}

export interface Debtor {
  id: string;
  format: 'ONLINE' | 'OFFLINE';
  status: string;
  paymentStatus: string;
  agreed: string;
  amountPaid: string | null;
  debt: string;
  enrolledAt: string;
  user: { id: string; name: string; email: string };
  group: { id: string; name: string } | null;
  course: { id: string; title: string; slug: string; currency: string };
}

export interface DebtorsResponse {
  items: Debtor[];
  totalDebt: string;
  count: number;
}

export function listDebtors(params: { courseId?: string; groupId?: string; search?: string } = {}): Promise<DebtorsResponse> {
  const query = new URLSearchParams();
  if (params.courseId) query.set('courseId', params.courseId);
  if (params.groupId) query.set('groupId', params.groupId);
  if (params.search) query.set('search', params.search);
  const qs = query.toString();
  return apiFetch(`/enrollments/debtors${qs ? `?${qs}` : ''}`);
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
