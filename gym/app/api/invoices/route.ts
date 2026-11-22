import { authenticated, failure } from '@/lib/server';
/** Server-authoritative invoice quote; the browser cannot choose its own tax or discount. */
export async function POST(request: Request) {
  try {
    const { db } = await authenticated(request);
    const p = await request.json();
    const { data, error } = await db.rpc('invoice_quote', {
      kind: p.payment_type,
      target_id: p.target_id,
    });
    if (error) throw error;
    return Response.json(data);
  } catch (error) {
    return failure(error);
  }
}
