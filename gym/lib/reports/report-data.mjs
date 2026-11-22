import { effectiveSubscriptionStatus } from '../domain/membership.mjs';
/** Pure report calculations shared by the screen and PDF export. */
/** @param {import('../domain/models').GymData} data @param {string} month */
export function reportData(
  data,
  month,
  today = new Date()
    .toLocaleString('sv-SE', { timeZone: 'Asia/Kuala_Lumpur' })
    .slice(0, 10),
) {
  const subscriptions = data.user_subscriptions.map((s) => ({
    ...s,
    status: effectiveSubscriptionStatus(s, today),
  }));
  const distinct = (rows) => new Set(rows.map((s) => s.user_id)).size;
  const verified = data.payments.filter(
    (p) =>
      p.status === 'Verified' &&
      new Date(p.verified_at || p.created_at)
        .toLocaleString('sv-SE', { timeZone: 'Asia/Kuala_Lumpur' })
        .slice(0, 7) === month,
  );
  const total = (type) =>
    verified
      .filter((p) => !type || p.payment_type === type)
      .reduce((sum, p) => sum + Number(p.amount), 0);
  return {
    month,
    total: total(),
    membershipRevenue: total('Membership'),
    classRevenue: total('Class'),
    active: distinct(subscriptions.filter((s) => s.status === 'Active')),
    expired: distinct(subscriptions.filter((s) => s.status === 'Expired')),
    plans: data.membership_plans.map((p) => ({
      name: p.name,
      subscribers: distinct(subscriptions.filter((s) => s.plan_id === p.id)),
      active: distinct(
        subscriptions.filter((s) => s.plan_id === p.id && s.status === 'Active'),
      ),
      expired: distinct(
        subscriptions.filter((s) => s.plan_id === p.id && s.status === 'Expired'),
      ),
    })),
    classes: data.class_schedules
      .map((c) => ({
        name: c.name,
        bookings: data.class_bookings.filter(
          (b) => b.schedule_id === c.id && b.status === 'Booked',
        ).length,
        attendance: data.class_bookings.filter(
          (b) => b.schedule_id === c.id && b.attended,
        ).length,
      }))
      .sort((a, b) => b.bookings - a.bookings || b.attendance - a.attendance),
  };
}
