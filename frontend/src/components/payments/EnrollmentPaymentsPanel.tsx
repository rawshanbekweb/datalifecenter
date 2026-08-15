import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Wallet } from 'lucide-react';
import {
  EnrollmentPayment,
  EnrollmentPaymentsResponse,
  PaymentMethod,
  PaymentSummary,
  addEnrollmentPayment,
  deleteEnrollmentPayment,
  listEnrollmentPayments,
} from '../../api/enrollments';
import { formatDate, formatMoney } from '../../utils/format';
import { useConfirm, useToast } from '../common/Feedback';

const METHODS: PaymentMethod[] = ['CASH', 'CARD', 'TRANSFER', 'ONLINE', 'OTHER'];

interface Props {
  enrollmentId: string;
  /** Admin uchun true — to'lov qo'shish va o'chirish tugmalari chiqadi */
  canEdit?: boolean;
  /** Qarz o'zgarganda tashqi ro'yxatni yangilash uchun */
  onChanged?: (summary: PaymentSummary) => void;
}

/**
 * Bitta yozilishning to'lov daftari: kelishilgan summa, to'langani, qarzi
 * va har bir to'lov yozuvi.
 *
 * Bitta komponent ikki joyda: adminda (yozish huquqi bilan) va o'quvchi
 * kabinetida (faqat o'qish). O'quvchi ham xuddi shu raqamlarni ko'radi —
 * "qancha qarzim bor" savoliga javob ikkalasida bir xil bo'lishi kerak.
 */
export default function EnrollmentPaymentsPanel({ enrollmentId, canEdit = false, onChanged }: Props): React.ReactElement {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();

  const [data, setData] = useState<EnrollmentPaymentsResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [note, setNote] = useState<string>('');
  const [busy, setBusy] = useState<boolean>(false);

  const load = useCallback((): void => {
    listEnrollmentPayments(enrollmentId)
      .then((res) => { setData(res); setStatus('ready'); })
      .catch(() => setStatus('error'));
  }, [enrollmentId]);

  useEffect(load, [load]);

  const submit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) return;
    setBusy(true);
    try {
      const res = await addEnrollmentPayment(enrollmentId, { amount: value, method, note: note.trim() || null });
      setAmount('');
      setNote('');
      load();
      onChanged?.(res.summary);
    } catch (err: unknown) {
      toast.error((err as Error).message || t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (payment: EnrollmentPayment): Promise<void> => {
    const ok = await confirm(t('payment.ledger.confirmDelete'), { danger: true });
    if (!ok) return;
    try {
      const summary = await deleteEnrollmentPayment(enrollmentId, payment.id);
      load();
      onChanged?.(summary);
    } catch (err: unknown) {
      toast.error((err as Error).message || t('common.error'));
    }
  };

  if (status === 'loading') return <p style={{ fontSize: 12.5, color: '#94a3b8' }}>{t('common.loading')}</p>;
  if (status === 'error' || !data) return <p style={{ fontSize: 12.5, color: '#dc2626' }}>{t('common.loadFailed')}</p>;

  const hasDebt = Number(data.summary.debt) > 0;

  return (
    <div>
      {/* Uchta raqam — kelishilgan, to'langan, qolgan. Qarz bo'lsa qizil */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {[
          { label: t('payment.ledger.agreed'), value: data.summary.agreed, color: '#475569', bg: '#f8fafc', border: '#e2e8f0' },
          { label: t('payment.ledger.paid'), value: data.summary.paid, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
          {
            label: t('payment.ledger.debt'), value: data.summary.debt,
            color: hasDebt ? '#dc2626' : '#64748b',
            bg: hasDebt ? '#fef2f2' : '#f8fafc',
            border: hasDebt ? '#fecaca' : '#e2e8f0',
          },
        ].map((card) => (
          <div key={card.label} style={{ padding: '8px 14px', borderRadius: 10, background: card.bg, border: `1px solid ${card.border}` }}>
            <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>{card.label}</p>
            <p style={{ fontSize: 13.5, fontWeight: 800, color: card.color }}>{formatMoney(card.value, data.currency)}</p>
          </div>
        ))}
      </div>

      {data.payments.length === 0 && (
        <p style={{ fontSize: 12.5, color: '#94a3b8', marginBottom: 10 }}>{t('payment.ledger.empty')}</p>
      )}

      {data.payments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {data.payments.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 9, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <Wallet size={13} style={{ color: '#0284c7', flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a', flexShrink: 0 }}>
                {formatMoney(p.amount, data.currency)}
              </span>
              <span style={{ fontSize: 11.5, color: '#64748b' }}>{t(`payment.ledger.method.${p.method}`)}</span>
              <span style={{ fontSize: 11.5, color: '#94a3b8' }}>{formatDate(p.paidAt)}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.note ?? ''}{p.recordedBy ? ` · ${p.recordedBy.name}` : ''}
              </span>
              {canEdit && (
                <button onClick={() => void remove(p)} title={t('common.delete')}
                  style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid #fecaca', background: '#fff', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <form onSubmit={submit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input className="inp" type="number" min={1} required value={amount}
            onChange={(e) => setAmount(e.target.value)} placeholder={t('payment.ledger.amount')}
            style={{ width: 150, fontSize: 12.5 }} />
          <select className="inp" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            style={{ width: 140, fontSize: 12.5, cursor: 'pointer' }}>
            {METHODS.map((m) => <option key={m} value={m}>{t(`payment.ledger.method.${m}`)}</option>)}
          </select>
          <input className="inp" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder={t('payment.ledger.note')} style={{ flex: 1, minWidth: 140, fontSize: 12.5 }} />
          <button type="submit" disabled={busy} className="btn-primary" style={{ fontSize: 12, padding: '8px 14px', opacity: busy ? 0.6 : 1 }}>
            <Plus size={13} /> {t('payment.ledger.add')}
          </button>
        </form>
      )}
    </div>
  );
}
