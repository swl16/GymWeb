import { authenticated, client, failure } from '@/lib/server';
import { appOrigin, customerFor, stripeClient } from '@/lib/stripe-server';
export async function POST(request: Request) {
  try {
    const { db, user } = await authenticated(request);
    const p = await request.json();
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role !== 'member') throw new Error('Member sign-in required.');
    if (p.method === 'E-wallet' && process.env.STRIPE_ENABLE_GRABPAY !== 'true')
      throw Error('GrabPay is not connected.');
    if (p.action === 'pay' && !['Card', 'E-wallet'].includes(p.method))
      throw Error('Choose a supported online payment method.');
    if (!['add_card', 'pay'].includes(p.action))
      throw new Error('Unknown checkout action.');
    const stripe = stripeClient(),
      origin = appOrigin(),
      customer = await customerFor(user);
    if (p.action === 'add_card') {
      const session = await stripe.checkout.sessions.create({
        mode: 'setup',
        customer,
        currency: 'myr',
        payment_method_types: ['card'],
        metadata: { pulse_user_id: user.id, purpose: 'save_card' },
        success_url: origin + '/?checkout=card_saved',
        cancel_url: origin + '/?checkout=cancelled',
      });
      return Response.json({ url: session.url });
    }
    const { data: payment, error } = await db.rpc('begin_online_payment', {
      kind: p.payment_type,
      target_id: p.target_id,
    });
    if (error) throw error;
    if (payment.provider_session_id) {
      const old = await stripe.checkout.sessions.retrieve(payment.provider_session_id);
      if (old.status === 'open') return Response.json({ url: old.url });
      throw new Error(
        'Checkout is complete or expired. Refresh Payments to see the latest status.',
      );
    }
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        customer,
        payment_method_types: p.method === 'E-wallet' ? ['grabpay'] : ['card'],
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'myr',
              unit_amount: Math.round(Number(payment.amount) * 100),
              product_data: {
                name:
                  payment.payment_type === 'Membership'
                    ? 'PULSE membership invoice'
                    : 'PULSE class booking invoice',
              },
            },
          },
        ],
        metadata: {
          pulse_payment_id: payment.id,
          pulse_user_id: user.id,
          save_card: p.save_card === true ? 'yes' : 'no',
        },
        ...(p.save_card === true && p.method === 'Card'
          ? {
              payment_intent_data: {
                setup_future_usage: 'on_session' as const,
              },
            }
          : {}),
        success_url: origin + '/?checkout=payment_returned',
        cancel_url: origin + '/?checkout=cancelled',
      },
      { idempotencyKey: 'pulse-checkout-' + payment.id },
    );
    const { error: saveError } = await client(undefined, true)
      .from('payments')
      .update({ provider_session_id: session.id, method: p.method })
      .eq('id', payment.id);
    if (saveError) throw saveError;
    return Response.json({ url: session.url });
  } catch (e) {
    return failure(e);
  }
}
