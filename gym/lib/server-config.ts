import 'server-only';
/** Canonical trusted origin for password setup and payment return URLs. Never trust a request Host header. */
export function appOrigin() {
  const raw = process.env.APP_URL;
  if (!raw) throw new Error('APP_URL must be configured in the server environment.');
  const url = new URL(raw);
  if (
    url.protocol !== 'https:' &&
    !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))
  )
    throw new Error('APP_URL must use HTTPS.');
  return url.origin;
}
/** A real server key is required for username lookup, account deletion and staff provisioning. */
export function accountServicesConfigured() {
  return Boolean(
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
