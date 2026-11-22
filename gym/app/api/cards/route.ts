import { authenticated, client, failure } from '@/lib/server';
import { stripeClient } from '@/lib/stripe-server';
/** The member may detach only their own saved provider method. History is retained. */
export async function POST(request: Request) {
  try {
    const { db, user } = await authenticated(request);
    const { id, confirm } = await request.json();
    if (confirm !== true || typeof id !== 'string')
      throw new Error('Confirm which saved card to remove.');
    const { data: card, error } = await db
      .from('saved_cards')
      .select('id,provider_method_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;
    if (!card) throw new Error('Saved card unavailable.');
    const stripe = stripeClient();
    let method;
    try {
      method = await stripe.paymentMethods.retrieve(card.provider_method_id);
    } catch (error) {
      if (!(
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'resource_missing'
      ))
        throw error;
    }
    const admin = client(undefined, true);
    const { data: mapping, error: lookup } = await admin
      .from('payment_customers')
      .select('provider_customer_id')
      .eq('user_id', user.id)
      .single();
    if (lookup) throw lookup;
    if (
      method &&
      method.customer !== null &&
      method.customer !== mapping.provider_customer_id
    )
      throw new Error('Card ownership mismatch.');
    if (method?.customer) await stripe.paymentMethods.detach(method.id);
    const result = await admin
      .from('saved_cards')
      .delete()
      .eq('id', card.id)
      .eq('user_id', user.id);
    if (result.error) throw result.error;
    return Response.json({
      message: 'Saved card removed. Previous receipts are unchanged.',
    });
  } catch (error) {
    return failure(error);
  }
}
