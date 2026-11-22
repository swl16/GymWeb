import { passwordChangeErrors } from '../domain/password.mjs';
/** Reauthenticate the current Auth identity, never a submitted email/user ID. No admin key. */
export async function changeAccountPassword(auth, input) {
  const errors = passwordChangeErrors(input);
  if (Object.keys(errors).length) throw Error(Object.values(errors)[0]);
  const identity = await auth.getUser();
  if (identity.error || !identity.data.user?.email)
    throw Error('Please sign in again before changing your password.');
  const verified = await auth.signInWithPassword({
    email: identity.data.user.email,
    password: input.current_password,
  });
  if (verified.error || verified.data.user?.id !== identity.data.user.id)
    throw Error('Current password is incorrect.');
  const changed = await auth.updateUser({
    password: input.password,
    current_password: input.current_password,
  });
  if (changed.error) throw changed.error;
}
