import { cashVerifier } from '@/lib/domain/payment-verifier.mjs';
import Badge from '@/components/ui/Badge';
import { useGym } from '@/features/app/GymProvider';
import { date } from '@/lib/domain/format';
import type { Payment } from '@/lib/domain/models';
import { money } from '@/lib/validation.mjs';
/** RECEIPT UI: historical totals are financial snapshots, never recalculated from an edited plan. */
export default function ReceiptDialog({ payment }: { payment: Payment }) {
  const { user, data } = useGym();
  const verifier = cashVerifier(payment, data.profiles);
  const rows = [
    [
      'Paid by',
      data.profiles.find((p) => p.id === payment.user_id)?.name || user?.name || 'Member',
    ],
    ['Payment for', payment.payment_type],
    ['Method', payment.method],
    ...(verifier ? [['Verified by', verifier]] : []),
    ['Submitted', date(payment.created_at)],
    ['Verified', date(payment.verified_at || payment.created_at)],
    ['Subtotal', money(payment.subtotal ?? payment.amount)],
    [
      'Discount (' + (payment.discount_percent || 0) + '%)',
      money(payment.discount_amount || 0),
    ],
    ['Tax (' + (payment.tax_rate || 0) + '%)', money(payment.tax_amount || 0)],
  ];
  return (
    <>
      <div className="eyebrow">PULSE FITNESS / PAYMENT RECEIPT</div>
      <h2>{payment.receipt_no}</h2>
      <div className="receipt-total">{money(payment.amount)}</div>
      <Badge status={payment.status} />
      <dl className="receipt-details">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
