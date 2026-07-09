import { apiFetch } from './client';

export interface PaymentConfig {
  click: boolean;
  payme: boolean;
}

export type CheckoutTarget = { kind: 'enrollment'; enrollmentId: string } | { kind: 'subscription'; subscriptionId: string };

export function getPaymentConfig(): Promise<PaymentConfig> {
  return apiFetch('/payments/config');
}

export function createCheckout(target: CheckoutTarget, provider: 'click' | 'payme'): Promise<{ url: string }> {
  const body = target.kind === 'enrollment' ? { enrollmentId: target.enrollmentId, provider } : { subscriptionId: target.subscriptionId, provider };
  return apiFetch('/payments/checkout', { method: 'POST', body: JSON.stringify(body) });
}
