/** Accept username or email; do not reveal whether either identifies an account. */
export function recoveryIdentifier(value) {
  if (typeof value !== 'string') return null;
  const id = value.trim();
  if (/^[A-Za-z0-9]{3,11}$/.test(id)) return { kind: 'username', value: id.toLowerCase() };
  if (id.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id))
    return { kind: 'email', value: id };
  return null;
}
export const RECOVERY_MESSAGE =
  'If an account matches, a password reset link will be sent to its registered email. Open the link to choose your new password.';
