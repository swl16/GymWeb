import { authenticated, failure } from '@/lib/server';
import { purchasePreview } from '@/lib/domain/purchase-summary.mjs';
import { klNow } from '@/lib/validation.mjs';
/** Authenticated read-only summary. Confirmation creates the actual record in a checked transaction. */
export async function POST(request: Request) {
  try {
    const { db, user } = await authenticated(request);
    const names = [
      'profiles',
      'membership_plans',
      'user_subscriptions',
      'class_schedules',
      'class_bookings',
      'payments',
    ];
    const rows = await Promise.all(names.map((name) => db.from(name).select('*')));
    const data: Record<string, any> = {};
    rows.forEach((row, i) => {
      if (row.error) throw row.error;
      data[names[i]] = row.data;
    });
    const profile = data.profiles.find((p: any) => p.id === user.id);
    return Response.json(
      purchasePreview(data, profile, await request.json(), klNow().slice(0, 10)),
    );
  } catch (e) {
    return failure(e);
  }
}
