import { client } from '@/lib/server';
import { appOrigin } from '@/lib/server-config';
import { recoveryIdentifier, RECOVERY_MESSAGE } from '@/lib/auth/recovery-identifier.mjs';
/** PUBLIC RECOVERY: username lookup stays server-side; reset requires an emailed recovery session. */
export async function POST(request: Request) {
  let input;
  try {
    input = await request.json();
  } catch {
    return Response.json(
      { error: 'Enter your username or a valid email address.' },
      { status: 400 },
    );
  }
  const identifier = recoveryIdentifier(input.identifier ?? input.email);
  if (!identifier)
    return Response.json(
      { error: 'Enter your 3–11 character username or a valid email address.' },
      { status: 400 },
    );
  try {
    let email: string | undefined =
      identifier.kind === 'email' ? identifier.value : undefined;
    if (identifier.kind === 'username') {
      const admin = client(undefined, true);
      const profile = await admin
        .from('profiles')
        .select('id')
        .eq('username', identifier.value)
        .eq('account_status', 'Active')
        .maybeSingle();
      if (profile.data) {
        const identity = await admin.auth.admin.getUserById(profile.data.id);
        email = identity.data.user?.email;
      }
    }
    if (email)
      await client().auth.resetPasswordForEmail(email, { redirectTo: appOrigin() });
  } catch {
    /* Generic response avoids revealing whether an account exists. */
  }
  return Response.json({ message: RECOVERY_MESSAGE });
}
