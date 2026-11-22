'use client';
import { useEffect, useState } from 'react';
import { useGym } from '@/features/app/GymProvider';
import { requestJson } from '@/lib/api/request';
import { invoiceItem } from '@/lib/domain/invoice.mjs';
import CheckoutForm from './CheckoutForm';
export default function CheckoutPage({ adding = false }: { adding?: boolean }) {
  const { data, user, values, setModal, hostedCheckout } = useGym();
  const [quote, setQuote] = useState<any>(null),
    [error, setError] = useState(''),
    [availability, setAvailability] = useState({ card: false, wallet: false });
  const id = values.target_id,
    type = values.payment_type;
  useEffect(() => {
    fetch('/api/payment-methods')
      .then((r) => r.json())
      .then(setAvailability)
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (adding) return;
    const abort = new AbortController();
    setQuote(null);
    setError('');
    requestJson('/api/invoices', { payment_type: type, target_id: id }, abort.signal)
      .then(setQuote)
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      });
    return () => abort.abort();
  }, [id, type, adding]);
  if (!adding && !quote)
    return (
      <>
        <h2>Your invoice</h2>
        <p>{error || 'Loading your invoice…'}</p>
      </>
    );
  const item = adding ? undefined : invoiceItem(data, type, id);
  return (
    <CheckoutForm
      user={user}
      item={item && quote ? { ...item, ...quote, amount: quote.total } : item}
      onClose={() => setModal(null)}
      onHosted={hostedCheckout}
      availability={availability}
    />
  );
}
