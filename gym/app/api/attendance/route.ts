import { authenticated, failure } from '@/lib/server';
/** Random booking passes can be issued by the owner and redeemed by staff/assigned trainer only. */
export async function POST(request: Request) {
  try {
    const { db } = await authenticated(request);
    const p = await request.json();
    const operation =
      p.action === 'issue'
        ? 'issue_booking_pass'
        : p.action === 'redeem'
          ? 'redeem_booking_attendance'
          : null;
    if (!operation) throw new Error('Unknown attendance action.');
    const params =
      p.action === 'issue'
        ? { booking: p.booking_id }
        : { pass_token: p.token, direction: p.direction || 'in' };
    const { data, error } = await db.rpc(operation, params);
    if (error) throw error;
    return Response.json(data);
  } catch (error) {
    return failure(error);
  }
}
