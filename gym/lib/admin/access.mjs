/** Trusted Auth app_metadata only; public profile fields never grant administration. */
export function isGymAdmin(authUser, profile) {
  return (
    authUser?.app_metadata?.gym_admin === true &&
    profile?.role === 'staff' &&
    profile?.account_status === 'Active'
  );
}
