/** QR is an opaque pass token. It does not encode a name, phone or email. */
export const PASS_PREFIX = 'pulse:attendance:v1:';
export function encodePass(token) {
  return PASS_PREFIX + token;
}
export function parsePass(value) {
  const token = value.trim().startsWith(PASS_PREFIX)
    ? value.trim().slice(PASS_PREFIX.length)
    : value.trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token))
    throw new Error('Scan a valid PULSE attendance QR code.');
  return token;
}
