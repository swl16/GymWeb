/** Only availability is public; provider keys never leave the server. */
export function GET() {
  const card = Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET,
  );
  return Response.json({
    card,
    wallet: card && process.env.STRIPE_ENABLE_GRABPAY === 'true',
  });
}
