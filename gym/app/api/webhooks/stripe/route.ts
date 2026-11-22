import { client } from '@/lib/server';
import { saveCard, stripeClient } from '@/lib/stripe-server';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret)
    return Response.json({ error: 'Webhook is not configured.' }, { status: 503 });
  let event: any;
  try {
    event = stripeClient().webhooks.constructEvent(
      await request.text(),
      request.headers.get('stripe-signature') || '',
      secret,
    );
  } catch {
    return Response.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }
  if (
    ![
      'checkout.session.completed',
      'checkout.session.async_payment_succeeded',
      'checkout.session.expired',
    ].includes(event.type)
  )
    return Response.json({ received: true });
  try {
    const stripe = stripeClient(),
      session: any = await stripe.checkout.sessions.retrieve(event.data.object.id, {
        expand: ['setup_intent.payment_method', 'payment_intent.payment_method'],
      });
    const db = client(undefined, true),
      userId = session.metadata?.pulse_user_id;
    const { data: customer, error } = await db
      .from('payment_customers')
      .select('provider_customer_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!customer || session.customer !== customer.provider_customer_id)
      throw new Error('Customer mismatch.');
    if (session.mode === 'setup') {
      if (
        event.type === 'checkout.session.completed' &&
        session.setup_intent?.status === 'succeeded'
      )
        await saveCard(
          session.setup_intent.payment_method,
          userId,
          customer.provider_customer_id,
        );
    } else {
      const paid =
        session.payment_status === 'paid' ||
        (session.payment_status === 'no_payment_required' && session.amount_total === 0);
      if (!paid && event.type !== 'checkout.session.expired')
        return Response.json({ received: true });
      const { error: failure } = await db.rpc('settle_online_payment', {
        payment_id: session.metadata.pulse_payment_id,
        event_key: event.id,
        session_id: session.id,
        paid_amount: Number(session.amount_total) / 100,
        paid_currency: session.currency,
        paid,
      });
      if (failure) throw failure;
      if (paid && session.metadata.save_card === 'yes')
        await saveCard(
          session.payment_intent?.payment_method,
          userId,
          customer.provider_customer_id,
        );
    }
    return Response.json({ received: true });
  } catch {
    return Response.json(
      { error: 'Webhook processing failed; retry required.' },
      { status: 500 },
    );
  }
}
