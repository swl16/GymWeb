import "server-only";
import { verifyAdminPassword } from "./admin-password.server";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
// The fixed admin username and password verifier stay on the server.
const ADMIN_USERNAME = "PulseAdmin";
const COOKIE = "pulse_admin_session";
const TTL = 30 * 60;
type State = {
  secret: string;
  failures: number;
  window: number;
  revoked: Map<string, number>;
};
const globals = globalThis as typeof globalThis & { pulseAdminState?: State };
function state() {
  return (globals.pulseAdminState ??= {
    secret: randomBytes(32).toString("hex"),
    failures: 0,
    window: Date.now(),
    revoked: new Map(),
  });
}
function secret() {
  const configured = process.env.ADMIN_SESSION_SECRET;
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV === "production")
    throw Error(
      "Configure ADMIN_SESSION_SECRET with at least 32 characters before using staff administration.",
    );
  return state().secret;
}
function equal(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    const parsed = new URL(origin);
    if (parsed.host !== host || !["http:", "https:"].includes(parsed.protocol))
      return false;
    if (
      process.env.NODE_ENV === "production" &&
      (!process.env.APP_URL ||
        parsed.origin !== new URL(process.env.APP_URL).origin)
    )
      return false;
    const site = request.headers.get("sec-fetch-site");
    return !site || site === "same-origin" || site === "none";
  } catch {
    return false;
  }
}
export async function loginAdmin(username: unknown, password: unknown) {
  const s = state();
  if (Date.now() - s.window > 60_000) {
    s.failures = 0;
    s.window = Date.now();
  }
  if (s.failures >= 10)
    return { status: 429, error: "Too many attempts. Please wait one minute." };
  // Reserve an attempt before async verification to bound concurrent hash work.
  s.failures++;
  const validName =
    typeof username === "string" && equal(username, ADMIN_USERNAME);
  const validPassword = await verifyAdminPassword(password);
  if (!validName || !validPassword) {
    return { status: 401, error: "Invalid admin username or password." };
  }
  s.failures = 0;
  const token = Buffer.from(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + TTL,
      nonce: randomBytes(24).toString("hex"),
    }),
  ).toString("base64url");
  return {
    status: 200,
    token:
      token +
      "." +
      createHmac("sha256", secret()).update(token).digest("base64url"),
  };
}
function claims(request: Request) {
  const raw = request.headers
    .get("cookie")
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(COOKIE + "="))
    ?.slice(COOKIE.length + 1);
  if (!raw || raw.length > 1000) return null;
  const [body, signature, extra] = raw.split(".");
  if (
    !body ||
    !signature ||
    extra ||
    !equal(
      signature,
      createHmac("sha256", secret()).update(body).digest("base64url"),
    )
  )
    return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString());
    const now = Math.floor(Date.now() / 1000);
    for (const [nonce, exp] of state().revoked)
      if (exp <= now) state().revoked.delete(nonce);
    if (
      typeof parsed.exp !== "number" ||
      parsed.exp <= now ||
      parsed.exp > now + TTL ||
      typeof parsed.nonce !== "string" ||
      state().revoked.has(parsed.nonce)
    )
      return null;
    return parsed as { exp: number; nonce: string };
  } catch {
    return null;
  }
}
export function hasAdminSession(request: Request) {
  return Boolean(claims(request));
}
export function revokeAdminSession(request: Request) {
  const session = claims(request);
  if (session) state().revoked.set(session.nonce, session.exp);
}
export function adminCookie(token = "") {
  return `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/api/admin; Max-Age=${token ? TTL : 0}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}
