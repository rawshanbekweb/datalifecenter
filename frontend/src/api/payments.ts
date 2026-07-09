import { apiFetch } from './client';

export interface PaymentConfig {
  click: boolean;
  payme: boolean;
}

export function getPaymentConfig(): Promise<PaymentConfig> {
  return apiFetch('/payments/config');
}

export function createCheckout(enrollmentId: string, provider: 'click' | 'payme'): Promise<{ url: string }> {
  return apiFetch('/payments/checkout', { method: 'POST', body: JSON.stringify({ enrollmentId, provider }) });
}
