import 'server-only';
import Stripe from 'stripe';
import { client } from './server';
export function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key)
    throw new Error(
      'Secure card payments are not configured yet. Please choose cash or contact the front desk.',
    );
  return new Stripe(key);
}
export { appOrigin } from './server-config';
export async function customerFor(user: any) {
  const db = client(undefined, true);
  const { data: existing, error } = await db
    .from('payment_customers')
    .select('provider_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (existing) return existing.provider_customer_id;
  const stripe = stripeClient();
  const c = await stripe.customers.create(
    { email: user.email, metadata: { pulse_user_id: user.id } },
    { idempotencyKey: 'pulse-customer-' + user.id },
  );
  const { error: saveError } = await db
    .from('payment_customers')
    .upsert({ user_id: user.id, provider_customer_id: c.id });
  if (saveError) throw saveError;
  return c.id;
}
export async function saveCard(method: any, userId: string, customer: string) {
  if (!method?.card || method.customer !== customer) return;
  const stripe = stripeClient();
  await stripe.paymentMethods.update(method.id, { allow_redisplay: 'always' });
  const { error } = await client(undefined, true)
    .from('saved_cards')
    .upsert(
      {
        user_id: userId,
        provider_method_id: method.id,
        holder: method.billing_details?.name || '',
        brand: method.card.brand,
        last4: method.card.last4,
        exp_month: method.card.exp_month,
        exp_year: method.card.exp_year,
      },
      { onConflict: 'provider_method_id' },
    );
  if (error) throw error;
}
