'use client';
import Button from '@/components/ui/Button';
import { useGym } from '@/features/app/GymProvider';
import { requestJson } from '@/lib/api/request';
import { date, time } from '@/lib/domain/format';
import { klNow, money } from '@/lib/validation.mjs';
import { useEffect, useState } from 'react';
/** SHARED PURCHASE CONFIRMATION: membership and class summary, before any invoice/reservation exists. */
export default function PurchaseConfirmation() {
  const { data, user, values, act, open, setModal, setView, busy, errors } = useGym();
  const [summary, setSummary] = useState<any>(null),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const abort = new AbortController();
    requestJson('/api/purchase-summary', values, abort.signal)
      .then((result) => {
        if (active) setSummary(result);
      })
      .catch((e) => {
        if (active && e.name !== 'AbortError') setError(e.message);
      });
    return () => {
      active = false;
      abort.abort();
    };
  }, []);
  async function proceed() {
    if (!summary) return;
    if (values.target_id) {
      setView('payments');
      open('checkout', { payment_type: summary.type, target_id: values.target_id });
      return;
    }
    const result = await act(
      values.action,
      values.payload,
      'Confirmed. Review your invoice.',
    );
    if (!result || !result.id) return;
    if (summary.type === 'Class' && summary.subtotal === 0) {
      setView('bookings');
      return;
    }
    setView('payments');
    open('checkout', { payment_type: summary.type, target_id: result.id });
  }
  return (
    <div className="purchase-confirmation">
      <div className="eyebrow">PULSE / CONFIRM YOUR CHOICE</div>
      <h2>
        {summary?.type === 'Class' ||
        values.action === 'book' ||
        values.payment_type === 'Class'
          ? 'Confirm class booking'
          : 'Confirm membership'}
      </h2>
      {error ? (
        <div className="error" role="alert">
          {error}
        </div>
      ) : !summary ? (
        <p>Loading your purchase summary…</p>
      ) : (
        <>
          <h3>{summary.name}</h3>
          {summary.type === 'Membership' ? (
            <>
              <p>{summary.detail}</p>
              <dl className="receipt-details">
                <div>
                  <dt>Starts</dt>
                  <dd>{date(summary.start_date)}</dd>
                </div>
                <div>
                  <dt>Ends</dt>
                  <dd>{date(summary.end_date)}</dd>
                </div>
              </dl>
              <p>Your new membership follows your existing paid coverage, if any.</p>
            </>
          ) : (
            <p>
              {date(summary.starts_at)} · {time(summary.starts_at)} –{' '}
              {time(summary.ends_at)}
              <br />
              {summary.room} · {summary.trainer}
            </p>
          )}
          <p>Estimated total, including applicable discount and 6% tax</p>
          <div className="receipt-total">{money(summary.amount)}</div>
          <p>
            {summary.type === 'Class' && summary.subtotal === 0
              ? 'This class is free. Confirm to book it.'
              : 'Confirm to create or resume your reservation, then review the invoice and choose a payment method.'}
          </p>
        </>
      )}
      {errors.form && (
        <div className="error" role="alert">
          {errors.form}
        </div>
      )}
      <div className="modal-actions">
        <Button variant="secondary" disabled={busy} onClick={() => setModal(null)}>
          Go back
        </Button>
        {summary && (
          <Button variant="primary" disabled={busy} onClick={proceed}>
            {busy
              ? 'Confirming…'
              : summary.type === 'Class' && summary.subtotal === 0
                ? 'Confirm booking'
                : 'Confirm and view invoice'}
          </Button>
        )}
      </div>
    </div>
  );
}
