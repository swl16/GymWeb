/** Shared password policy for registration, trainer creation, recovery and account changes. */
export const PASSWORD_HINT =
  'Use at least 6 characters, an uppercase letter, a digit and a special character.';
export function passwordError(value) {
  return typeof value === 'string' &&
    /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{6,}$/.test(value)
    ? ''
    : PASSWORD_HINT;
}
/** @returns {Record<string,string>} */
export function passwordChangeErrors(input) {
  const errors = {};
  if (typeof input.current_password !== 'string' || !input.current_password)
    errors.current_password = 'Enter your current password.';
  const error = passwordError(input.password);
  if (error) errors.password = error;
  if (input.password !== input.confirmation)
    errors.confirmation = 'Passwords do not match.';
  if (input.current_password && input.password === input.current_password)
    errors.password = 'Choose a password different from your current password.';
  return errors;
}
