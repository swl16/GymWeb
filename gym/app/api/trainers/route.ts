import { validateTrainerCreation } from '@/lib/domain/trainer-validation.mjs';
import { authenticated, client, failure } from '@/lib/server';
/** STAFF-ONLY trainer provisioning. Public metadata can never grant a trainer role. */
export async function POST(request: Request) {
  try {
    const { db } = await authenticated(request);
    const { data: allowed, error: roleError } = await db.rpc('is_staff');
    if (roleError || !allowed) throw new Error('Staff access required.');
    const input = await request.json();
    const errors = validateTrainerCreation(input);
    if (Object.keys(errors).length)
      return Response.json({ error: 'Check trainer details.', errors }, { status: 400 });
    const admin = client(undefined, true);
    const { data, error } = await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      app_metadata: { role: 'trainer' },
      user_metadata: {
        username: input.username.toLowerCase(),
        name: input.name.trim(),
        gender: input.gender,
        phone: input.phone,
      },
    });
    if (error || !data.user) throw error || new Error('Unable to create trainer.');
    return Response.json(
      {
        data: { id: data.user.id },
        message:
          'Trainer added. The trainer can sign in with their username and initial password.',
      },
      { status: 201 },
    );
  } catch (error) {
    return failure(error);
  }
}
