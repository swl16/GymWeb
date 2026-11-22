import { quoteInvoice } from './pricing.mjs';
/** View model for a member-owned invoice. Live UI replaces estimate with an authenticated server quote. */
export function invoiceItem(data, type, id) {
  const row = (
    type === 'Membership' ? data.user_subscriptions : data.class_bookings
  ).find((x) => x.id === id);
  if (!row) return null;
  const product = (
    type === 'Membership' ? data.membership_plans : data.class_schedules
  ).find((x) => x.id === (type === 'Membership' ? row.plan_id : row.schedule_id));
  if (!product) return null;
  const quote = quoteInvoice(
    data,
    type,
    id,
    new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kuala_Lumpur' }).slice(0, 10),
  );
  return {
    type,
    id,
    name: product.name,
    amount: quote.total,
    detail:
      type === 'Membership'
        ? `${product.duration_months} month${product.duration_months > 1 ? 's' : ''} · ${row.start_date} — ${row.end_date}`
        : new Date(product.starts_at).toLocaleString('en-MY', {
            timeZone: 'Asia/Kuala_Lumpur',
          }),
    status: row.status,
    ...quote,
  };
}
