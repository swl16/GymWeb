import { renewalDates } from './membership.mjs';
import { calculatePrice, bestMembershipDiscount } from './pricing.mjs';
import { invoiceItem } from './invoice.mjs';
/** Read-only purchase summary. No reservation, invoice or payment is created by this function. */
export function purchasePreview(data, user, request, today) {
  if (user?.role !== 'member') throw Error('Member sign-in required.');
  if (request.target_id) {
    const type = request.payment_type;
    const row = (
      type === 'Membership' ? data.user_subscriptions : data.class_bookings
    ).find((r) => r.id === request.target_id && r.user_id === user.id);
    if (!row || !['Pending', 'Rejected'].includes(row.status))
      throw Error('This item is no longer awaiting payment.');
    const item = invoiceItem(data, type, row.id);
    if (!item) throw Error('Item unavailable.');
    const session =
      type === 'Class'
        ? data.class_schedules.find((c) => c.id === row.schedule_id)
        : null;
    return {
      ...item,
      start_date: row.start_date,
      end_date: row.end_date,
      ...(session
        ? {
            starts_at: session.starts_at,
            ends_at: session.ends_at,
            room: session.room,
            trainer: session.trainer,
          }
        : {}),
    };
  }
  if (request.action === 'subscribe') {
    if (
      data.user_subscriptions.some((s) => s.user_id === user.id && s.status === 'Pending')
    )
      throw Error(
        'Complete or cancel your pending membership first. Open My membership to continue its payment.',
      );
    const plan = data.membership_plans.find(
      (p) => p.id === request.payload?.plan_id && !p.archived,
    );
    if (!plan) throw Error('Plan unavailable.');
    const dates = renewalDates(
      data.user_subscriptions,
      user.id,
      plan.duration_months,
      today,
    );
    return {
      type: 'Membership',
      name: plan.name,
      ...dates,
      detail: `${plan.duration_months} month${plan.duration_months === 1 ? '' : 's'}`,
      amount: calculatePrice(plan.price).total,
      subtotal: Number(plan.price),
    };
  }
  if (request.action === 'book') {
    const c = data.class_schedules.find(
      (c) => c.id === request.payload?.schedule_id && c.status === 'Active',
    );
    if (!c || Date.parse(c.starts_at) <= Date.now())
      throw Error('This class is no longer available.');
    const plan = bestMembershipDiscount(data, user.id, today);
    const price = calculatePrice(c.fee, plan?.class_discount_percent || 0);
    return {
      type: 'Class',
      name: c.name,
      starts_at: c.starts_at,
      ends_at: c.ends_at,
      trainer: c.trainer,
      room: c.room,
      amount: price.total,
      subtotal: Number(c.fee),
    };
  }
  throw Error('Choose a membership or class.');
}
