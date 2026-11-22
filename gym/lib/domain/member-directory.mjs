/** Malaysia calendar day; membership coverage uses an exclusive end date. */
export function membershipType(
  userId,
  subscriptions,
  today = new Date()
    .toLocaleString('sv-SE', { timeZone: 'Asia/Kuala_Lumpur' })
    .slice(0, 10),
) {
  return subscriptions.some(
    (s) =>
      s.user_id === userId &&
      s.status === 'Active' &&
      s.start_date <= today &&
      s.end_date > today,
  )
    ? 'Member'
    : 'Normal user';
}
/** Archived accounts retain only their name, username and last membership type. */
export function memberDirectory(data, today) {
  const current = data.profiles
    .filter((p) => p.role === 'member')
    .map((p) => ({
      ...p,
      account_status: p.account_status || 'Active',
      membership_type: membershipType(p.id, data.user_subscriptions, today),
    }));
  const deleted = (data.deleted_member_accounts || []).map((p) => ({
    ...p,
    account_status: 'Deleted',
    age: null,
    gender: null,
    email: null,
    phone: null,
  }));
  return [...current, ...deleted].sort((a, b) => a.username.localeCompare(b.username));
}
