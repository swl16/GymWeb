/** Assignment pricing policy, expressed in integer sen to avoid float rounding drift. */
export const TAX_PERCENT = 6;
/** @type {Record<string,number>} */
// export const DEFAULT_CLASS_DISCOUNTS = {
//   Essential: 5,
//   Performance: 10,
//   Elite: 15,
// };
export function calculatePrice(subtotal, discountPercent = 0) {
  const base = Math.round(Number(subtotal) * 100);
  const rate = Number(discountPercent);
  if (
    !Number.isFinite(base) ||
    base < 0 ||
    !Number.isFinite(rate) ||
    rate < 0 ||
    rate > 100
  ) {
    throw new Error('Invalid price or discount.');
  }
  const discount = Math.round((base * rate) / 100);
  const tax = Math.round(((base - discount) * TAX_PERCENT) / 100);
  return {
    subtotal: base / 100,
    discount_percent: rate,
    discount_amount: discount / 100,
    tax_rate: TAX_PERCENT,
    tax_amount: tax / 100,
    total: (base - discount + tax) / 100,
  };
}
/** Best current, paid membership wins; discounts never stack. */
export function bestMembershipDiscount(data, userId, today) {
  return data.user_subscriptions
    .filter(
      (s) =>
        s.user_id === userId &&
        s.status === 'Active' &&
        s.start_date <= today &&
        s.end_date > today,
    )
    .map((s) => data.membership_plans.find((p) => p.id === s.plan_id))
    .filter(Boolean)
    .sort(
      (a, b) =>
        Number(b.class_discount_percent || 0) - Number(a.class_discount_percent || 0),
    )[0];
}
/** A submitted payment keeps its original financial snapshot, even after plan edits. */
export function quoteInvoice(data, type, targetId, today) {
  const row = (
    type === 'Membership' ? data.user_subscriptions : data.class_bookings
  ).find((x) => x.id === targetId);
  if (!row) throw new Error('Invoice item unavailable.');
  const existing = data.payments.find(
    (p) =>
      p[type === 'Membership' ? 'subscription_id' : 'booking_id'] === row.id &&
      p.status !== 'Rejected',
  );
  if (existing)
    return {
      subtotal: Number(existing.subtotal ?? existing.amount),
      discount_percent: Number(existing.discount_percent || 0),
      discount_amount: Number(existing.discount_amount || 0),
      tax_rate: Number(existing.tax_rate || 0),
      tax_amount: Number(existing.tax_amount || 0),
      total: Number(existing.amount),
      discount_plan_name: existing.discount_plan_name || '',
    };
  const product = (
    type === 'Membership' ? data.membership_plans : data.class_schedules
  ).find((x) => x.id === (type === 'Membership' ? row.plan_id : row.schedule_id));
  if (!product) throw new Error('Product unavailable.');
  const plan = type === 'Class' ? bestMembershipDiscount(data, row.user_id, today) : null;
  return {
    ...calculatePrice(product.price ?? product.fee, plan?.class_discount_percent || 0),
    discount_plan_name: plan?.name || '',
  };
}
