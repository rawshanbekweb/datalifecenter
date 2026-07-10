import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Hourglass, AlertTriangle, Wallet, Sparkles } from 'lucide-react';
import { createSubscription, getMySubscription, submitSubscriptionReceipt, Subscription } from '../api/subscriptions';
import { getPaymentConfig, createCheckout, PaymentConfig } from '../api/payments';
import { useTranslation } from 'react-i18next';
import { getSiteSettings } from '../api/siteSettings';
import { PAYMENT_INFO } from '../config/payment';
import { formatDate, formatNumber } from '../utils/format';
import FileUpload from '../components/common/FileUpload';

const DEFAULT_PRICE = 99000;
const DEFAULT_CURRENCY = 'UZS';

export default function SubscriptionPage(): React.ReactElement {
  const { t } = useTranslation();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [status, setStatus]             = useState<'loading' | 'ready' | 'error'>('loading');
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({ click: false, payme: false });
  const [plan, setPlan] = useState<{ price: number; currency: string }>({ price: DEFAULT_PRICE, currency: DEFAULT_CURRENCY });
  const [searchParams, setSearchParams] = useSearchParams();

  const [starting, setStarting] = useState<boolean>(false);
  const [gatewayLoading, setGatewayLoading] = useState<'click' | 'payme' | ''>('');
  const [gatewayError, setGatewayError] = useState<string>('');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [receiptState, setReceiptState] = useState<'idle' | 'sending' | 'error'>('idle');

  const load = () => {
    getMySubscription()
      .then((data) => { setSubscription(data); setStatus('ready'); })
      .catch(() => setStatus('error'));
  };

  useEffect(() => {
    load();
    getPaymentConfig().then(setPaymentConfig).catch(() => {});
    getSiteSettings()
      .then((settings) => {
        const data = settings.subscription_plan as { price?: number; currency?: string } | undefined;
        if (data?.price) setPlan({ price: data.price, currency: data.currency || DEFAULT_CURRENCY });
      })
      .catch(() => {});
  }, []);

  // Click/Payme'dan qaytgach — webhook biroz kech kelishi mumkin, shuning uchun bir necha soniyadan keyin qayta yuklaymiz.
  useEffect(() => {
    if (searchParams.get('payment') !== 'return') return;
    setSearchParams((prev) => { prev.delete('payment'); return prev; }, { replace: true });
    const timer = setTimeout(load, 2500);
    return () => clearTimeout(timer);
  }, [searchParams, setSearchParams]);

  const needsFreshSubscription = !subscription || ['REJECTED', 'CANCELLED', 'EXPIRED'].includes(subscription.status);
  const isPending = subscription?.status === 'PENDING';
  const isActive = subscription?.status === 'ACTIVE';

  const startSubscription = async () => {
    setStarting(true);
    try {
      const created = await createSubscription();
      setSubscription(created);
    } catch (err: unknown) {
      alert((err as Error).message || t('common.error'));
    } finally {
      setStarting(false);
    }
  };

  const payWithGateway = async (provider: 'click' | 'payme') => {
    if (!subscription) return;
    setGatewayLoading(provider);
    setGatewayError('');
    try {
      const { url } = await createCheckout({ kind: 'subscription', subscriptionId: subscription.id }, provider);
      window.location.href = url;
    } catch (err: unknown) {
      setGatewayError((err as Error).message || t('common.error'));
      setGatewayLoading('');
    }
  };

  const sendReceipt = async () => {
    if (!subscription || !receiptUrl.trim()) return;
    setReceiptState('sending');
    try {
      const updated = await submitSubscriptionReceipt(subscription.id, receiptUrl.trim());
      setSubscription(updated);
      setReceiptUrl('');
    } catch {
      setReceiptState('error');
    } finally {
      setReceiptState('idle');
    }
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'Outfit,sans-serif', fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{t('student.subscription.title')}</h1>
      <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 24 }}>{t('student.subscription.subtitle')}</p>

      {status === 'loading' && <p style={{ color: '#94a3b8', fontSize: 14 }}>{t('common.loading')}</p>}
      {status === 'error' && <p style={{ color: '#dc2626', fontSize: 14 }}>{t('common.loadFailed')}</p>}

      {status === 'ready' && isActive && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card"
          style={{ padding: 24, background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <CheckCircle2 size={20} style={{ color: '#16a34a' }} />
            <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{t('student.subscription.active')}</p>
          </div>
          <p style={{ fontSize: 13, color: '#475569' }}>
            {subscription?.expiresAt
              ? t('student.subscription.accessOpenUntil', { date: formatDate(subscription.expiresAt) })
              : t('student.subscription.accessOpen')}
          </p>
        </motion.div>
      )}

      {status === 'ready' && isPending && subscription && (
        <div className="card" style={{ padding: 24 }}>
          {subscription.hasReceipt ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: '#fffbeb', border: '1px solid #fde68a', marginBottom: 4 }}>
              <Hourglass size={14} style={{ color: '#d97706', flexShrink: 0 }} />
              <p style={{ fontSize: 12.5, fontWeight: 600, color: '#92400e' }}>{t('student.subscription.receiptSent')}</p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                {t('payment.amount')} <span style={{ color: '#0ea5e9' }}>{formatNumber(plan.price)} {plan.currency}</span>
              </p>
              <p style={{ fontSize: 12.5, color: '#475569', marginBottom: 2 }}>
                {t('payment.card')} <b style={{ color: '#0f172a', letterSpacing: 0.5 }}>{PAYMENT_INFO.cardNumber}</b> ({PAYMENT_INFO.cardOwner})
              </p>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>{t('payment.note')}</p>

              {(paymentConfig.click || paymentConfig.payme) && (
                <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>{t('payment.online')}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {paymentConfig.click && (
                      <button onClick={() => payWithGateway('click')} disabled={gatewayLoading !== ''} className="btn-primary"
                        style={{ fontSize: 12.5, padding: '9px 16px', opacity: gatewayLoading !== '' ? 0.6 : 1 }}>
                        <Wallet size={14} /> {gatewayLoading === 'click' ? t('payment.redirecting') : t('payment.payClick')}
                      </button>
                    )}
                    {paymentConfig.payme && (
                      <button onClick={() => payWithGateway('payme')} disabled={gatewayLoading !== ''} className="btn-primary"
                        style={{ fontSize: 12.5, padding: '9px 16px', opacity: gatewayLoading !== '' ? 0.6 : 1 }}>
                        <Wallet size={14} /> {gatewayLoading === 'payme' ? t('payment.redirecting') : t('payment.payPayme')}
                      </button>
                    )}
                  </div>
                  {gatewayError && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 8 }}>{gatewayError}</p>}
                  <p style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 10 }}>{t('payment.orManual')}</p>
                </div>
              )}

              <FileUpload value={receiptUrl} onChange={setReceiptUrl} kind="image" label={t('payment.receiptLabel')} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
                <button onClick={sendReceipt} disabled={!receiptUrl.trim() || receiptState === 'sending'} className="btn-primary"
                  style={{ fontSize: 12.5, padding: '9px 16px', opacity: !receiptUrl.trim() || receiptState === 'sending' ? 0.6 : 1 }}>
                  {receiptState === 'sending' ? t('common.sending') : t('payment.sendReceipt')}
                </button>
                {receiptState === 'error' && <span style={{ fontSize: 12, color: '#dc2626' }}>{t('payment.sendErrorRetry')}</span>}
              </div>
            </>
          )}
        </div>
      )}

      {status === 'ready' && needsFreshSubscription && (
        <div className="card" style={{ padding: 24 }}>
          {subscription?.status === 'REJECTED' && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', marginBottom: 16 }}>
              <AlertTriangle size={14} style={{ color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 12.5, fontWeight: 600, color: '#991b1b' }}>
                {t('student.subscription.rejectedPrefix')}{subscription.rejectionReason ? `: ${subscription.rejectionReason}` : ''}. {t('student.subscription.rejectedSuffix')}
              </p>
            </div>
          )}
          {subscription?.status === 'EXPIRED' && (
            <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 16 }}>{t('student.subscription.expired')}</p>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <Sparkles size={20} style={{ color: '#9333ea' }} />
            <p style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
              {formatNumber(plan.price)} {plan.currency} <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>{t('student.subscription.perMonth')}</span>
            </p>
          </div>
          <p style={{ fontSize: 13, color: '#475569', marginBottom: 18 }}>{t('student.subscription.fullAccess')}</p>

          <button onClick={startSubscription} disabled={starting} className="btn-primary"
            style={{ fontSize: 13, padding: '10px 20px', opacity: starting ? 0.6 : 1 }}>
            {starting ? t('student.subscription.starting') : t('student.subscription.subscribe')}
          </button>
        </div>
      )}
    </div>
  );
}
