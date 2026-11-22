import { addMonths } from '../validation.mjs';
/** Paid future renewals remain stored Active, but are shown Scheduled until their start. */
export function effectiveSubscriptionStatus(subscription, today) {
  if (subscription.status !== 'Active') return subscription.status;
  if (subscription.end_date <= today) return 'Expired';
  return subscription.start_date > today ? 'Scheduled' : 'Active';
}
/** Renewal begins at the latest paid expiry (exclusive boundary), never overlaps paid coverage. */
export function renewalDates(subscriptions, userId, months, today) {
  const start = subscriptions
    .filter((s) => s.user_id === userId && s.status === 'Active' && s.end_date > today)
    .reduce((end, s) => (s.end_date > end ? s.end_date : end), today);
  return { start_date: start, end_date: addMonths(start, months) };
}
