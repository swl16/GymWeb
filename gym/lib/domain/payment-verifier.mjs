/** Cash verification is a receipt snapshot. Never infer staff approval for online payments. */
export function cashVerifier(payment, profiles = []) {
  if (payment.method !== 'Cash' || payment.status !== 'Verified') return null;
  return (
    payment.verified_by_name?.trim() ||
    profiles.find((p) => p.id === payment.verified_by && p.role === 'staff')?.name ||
    'Not recorded'
  );
}
