import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { m } from 'framer-motion';
import { CheckCircle2, Hourglass, AlertTriangle, Wallet, Sparkles, Lock, MessagesSquare } from 'lucide-react';
import { createSubscription, getMySubscription, Subscription } from '../api/subscriptions';
import { getPaymentConfig, createCheckout, PaymentConfig } from '../api/payments';
import { useTranslation } from 'react-i18next';
import { getSiteSettings } from '../api/siteSettings';
import { useSubscriptionsEnabled } from '../hooks/useSubscriptionsEnabled';
import { formatDate, formatNumber } from '../utils/format';
import { useToast } from '../components/common/Feedback';
import Loading from '../components/common/Loading';

const DEFAULT_PRICE = 99000;
const DEFAULT_CURRENCY = 'UZS';

export default function SubscriptionPage(): React.ReactElement {
  const { t } = useTranslation();
  const toast = useToast();
  const subscriptionsEnabled = useSubscriptionsEnabled();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [status, setStatus]             = useState<'loading' | 'ready' | 'error'>('loading');
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({ click: false, payme: false });
  const [plan, setPlan] = useState<{ price: number; currency: string }>({ price: DEFAULT_PRICE, currency: DEFAULT_CURRENCY });
  const [searchParams, setSearchParams] = useSearchParams();

  const [starting, setStarting] = useState<boolean>(false);
  const [gatewayLoading, setGatewayLoading] = useState<'click' | 'payme' | ''>('');
  const [gatewayError, setGatewayError] = useState<string>('');

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
      toast.error((err as Error).message || t('common.error'));
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

  // Bo'lim admin panelidan yopib qo'yilgan (subscription_plan.enabled = false):
  // to'lov hozircha administrator orqali rasmiylashtiriladi. Menyuda ham havola
  // yo'q, lekin sahifa URL orqali ochilishi mumkin — shuning uchun izoh beramiz.
  if (subscriptionsEnabled === null) return <Loading />;
  if (!subscriptionsEnabled) {
    return (
      <div>
        <h1 style={{ fontFamily:'var(--font-sans)', fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{t('student.subscription.title')}</h1>
        <div className="card" style={{ padding: 24, marginTop: 20, maxWidth: 620 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Lock size={18} style={{ color: '#64748b' }} />
            <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{t('student.subscription.disabledTitle')}</p>
          </div>
          <p style={{ fontSize: 13, color: '#475569', marginBottom: 16 }}>{t('student.subscription.disabledText')}</p>
          <Link to="/student/messages" style={{ textDecoration: 'none' }}>
            <button className="btn-primary" style={{ fontSize: 12.5, padding: '9px 16px' }}>
              <MessagesSquare size={14} /> {t('payment.contactAdmin')}
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontFamily:'var(--font-sans)', fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{t('student.subscription.title')}</h1>
      <p style={{ fontSize: 13.5, color: '#64748b', marginBottom: 24 }}>{t('student.subscription.subtitle')}</p>

      {status === 'loading' && <Loading />}
      {status === 'error' && <p style={{ color: '#dc2626', fontSize: 14 }}>{t('common.loadFailed')}</p>}

      {status === 'ready' && isActive && (
        <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card"
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
        </m.div>
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
              <p style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>
                {t('payment.amount')} <span style={{ color: '#0ea5e9' }}>{formatNumber(plan.price)} {plan.currency}</span>
              </p>

              {/* Karta raqami ATAYIN ko'rsatilmaydi: kodda yozilgan raqam eskirsa
                  yoki almashsa, talaba noto'g'ri hisobga pul o'tkazib yuborardi va
                  buni qaytarib bo'lmasdi. To'lov yo yo'naltirilgan shlyuz orqali
                  (rasmiy merchant hisobi), yo administrator orqali qabul qilinadi. */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 14 }}>
                <Wallet size={15} style={{ color: '#0ea5e9', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <p style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{t('payment.adminOnlyTitle')}</p>
                  <p style={{ fontSize: 12.5, color: '#475569' }}>{t('payment.adminOnlyText')}</p>
                </div>
              </div>

              {(paymentConfig.click || paymentConfig.payme) && (
                <div style={{ marginBottom: 14 }}>
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
                </div>
              )}

              <Link to="/student/messages" style={{ textDecoration: 'none' }}>
                <button className="btn-outline" style={{ fontSize: 12.5, padding: '9px 16px' }}>
                  <MessagesSquare size={14} /> {t('payment.contactAdmin')}
                </button>
              </Link>
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
