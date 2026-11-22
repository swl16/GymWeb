import Button from '@/components/ui/Button';
import { CheckCircle2, CreditCard, Receipt, Wallet } from 'lucide-react';
export type PaymentAvailability = { card: boolean; wallet: boolean };
export default function PaymentMethodPicker({
  value,
  onChange,
  availability,
}: {
  value: string;
  onChange: (method: string) => void;
  availability: PaymentAvailability;
}) {
  return (
    <>
      <h3 className="method-heading">Choose payment method</h3>
      <div className="payment-methods">
        {[
          {
            id: 'Card',
            label: 'Credit / Debit card',
            Icon: CreditCard,
            enabled: availability.card,
          },
          {
            id: 'E-wallet',
            label: 'GrabPay',
            Icon: Wallet,
            enabled: availability.wallet,
          },
          { id: 'Cash', label: 'Cash at front desk', Icon: Receipt, enabled: true },
        ].map(({ id, label, Icon, enabled }) => (
          <Button
            aria-pressed={value === id}
            disabled={!enabled}
            title={enabled ? undefined : 'Not connected'}
            className={value === id ? 'selected' : ''}
            key={id}
            onClick={() => onChange(id)}
          >
            <Icon size={21} />
            <span>
              {label}
              {!enabled && <small>Not connected</small>}
            </span>
            <i>{value === id && <CheckCircle2 size={16} />}</i>
          </Button>
        ))}
      </div>
    </>
  );
}
