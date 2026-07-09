import { apiFetch } from './client';
import { API_URL } from './config';
import { getToken } from './token';

export interface Subscription {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'REJECTED';
  startsAt?: string | null;
  expiresAt?: string | null;
  amountPaid?: string | number | null;
  rejectionReason?: string | null;
  hasReceipt?: boolean;
  createdAt: string;
}

export function createSubscription(): Promise<Subscription> {
  return apiFetch('/subscriptions', { method: 'POST' });
}

export function getMySubscription(): Promise<Subscription | null> {
  return apiFetch('/subscriptions/me');
}

export function submitSubscriptionReceipt(subscriptionId: string, receiptUrl: string): Promise<Subscription> {
  return apiFetch(`/subscriptions/${subscriptionId}/receipt`, { method: 'POST', body: JSON.stringify({ receiptUrl }) });
}

export interface ListSubscriptionsAdminParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export function listSubscriptionsAdmin(params: ListSubscriptionsAdminParams = {}): Promise<any> {
  const query = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => [k, String(v)])
    )
  ).toString();
  return apiFetch(`/subscriptions/admin${query ? `?${query}` : ''}`);
}

export function updateSubscriptionAdmin(id: string, data: { status: 'ACTIVE' | 'REJECTED' | 'CANCELLED'; rejectionReason?: string }): Promise<any> {
  return apiFetch(`/subscriptions/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

// Chek rasmini blob sifatida olib, <img>da ko'rsatish uchun vaqtinchalik object URL qaytaradi
// (enrollments.ts'dagi getReceiptImageUrl bilan bir xil pattern — Bearer token kerak).
export async function getSubscriptionReceiptImageUrl(subscriptionId: string): Promise<string> {
  const token = getToken();
  const res = await fetch(`${API_URL}/subscriptions/${subscriptionId}/receipt`, {
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error("Chekni yuklab bo'lmadi");
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
