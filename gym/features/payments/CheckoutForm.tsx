'use client';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { money } from '@/lib/validation.mjs';
import { LockKeyhole, Receipt } from 'lucide-react';
import CardDetailsForm from './CardDetailsForm';
import WalletDetailsForm from './WalletDetailsForm';
import InvoiceSummary from './InvoiceSummary';
import PaymentMethodPicker, { type PaymentAvailability } from './PaymentMethodPicker';
/** Real checkout only: the server computes invoices and the provider confirms online payments. */
export default function CheckoutForm({
  user,
  item,
  onClose,
  onHosted,
  availability,
}: {
  user: any;
  item?: any;
  onClose: () => void;
  onHosted: (payload: any) => Promise<any>;
  availability: PaymentAvailability;
}) {
  const adding = item === undefined;
  const [method, setMethod] = useState(adding ? 'Card' : 'Cash');
  const [step, setStep] = useState(1),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [save, setSave] = useState(adding);
  async function finish(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onHosted({
        action: adding ? 'add_card' : 'pay',
        method,
        payment_type: item?.type,
        target_id: item?.id,
        save_card: save,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to submit payment.');
    } finally {
      setBusy(false);
    }
  }
  if (item === null)
    return (
      <>
        <h2>Invoice unavailable</h2>
        <p>Refresh your payments to see the latest status.</p>
        <Button onClick={onClose}>Close</Button>
      </>
    );
  return (
    <div className="checkout">
      <div className="eyebrow">
        PULSE FITNESS / {adding ? 'PAYMENT METHODS' : 'CHECKOUT'}
      </div>
      <h2>
        {adding
          ? 'Add credit/debit card'
          : step === 1
            ? 'Your invoice'
            : 'Complete your payment'}
      </h2>
      <p>
        {adding
          ? 'Save a card using the secure payment provider.'
          : 'Review your invoice and choose your payment method.'}
      </p>
      {!adding && <InvoiceSummary item={item} memberName={user.name} />}
      {!adding && step === 1 ? (
        <>
          <PaymentMethodPicker
            value={method}
            onChange={setMethod}
            availability={availability}
          />
          <div className="modal-actions">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        </>
      ) : (
        <form onSubmit={finish}>
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          {method === 'Card' ? (
            <CardDetailsForm adding={adding} save={save} setSave={setSave} />
          ) : method === 'E-wallet' ? (
            <WalletDetailsForm />
          ) : (
            <div className="secure-provider">
              <Receipt size={28} />
              <h3>Pay at the front desk</h3>
              <p>
                Submit this invoice, then pay {money(item?.amount)} in cash. Your
                membership or booking activates after staff verify receipt of payment.
              </p>
            </div>
          )}
          <div className="checkout-security">
            <LockKeyhole size={12} />
            Online payment details stay with the provider.
          </div>
          <div className="modal-actions">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={adding ? onClose : () => setStep(1)}
            >
              {adding ? 'Cancel' : 'Back'}
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={
                busy ||
                (method === 'Card' && !availability.card) ||
                (method === 'E-wallet' && !availability.wallet)
              }
            >
              {busy
                ? 'Processing…'
                : method === 'Cash'
                  ? 'Submit cash payment'
                  : 'Continue securely'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
