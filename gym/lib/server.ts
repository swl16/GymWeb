import { withErdNames } from "./database/erd-names.mjs";
import { createClient } from "@supabase/supabase-js";
import "server-only";
import { PROJECT_URL, PUBLISHABLE_KEY } from "@/lib/config/public";

export function client(token?: string, admin = false) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || PROJECT_URL,
    key = admin
      ? process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error(
      "Supabase is not configured. Follow README.md to connect your project.",
    );
  return withErdNames(
    createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      ...(token
        ? { global: { headers: { Authorization: `Bearer ${token}` } } }
        : {}),
    }),
  );
}
export async function authenticated(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) throw new Error("Please sign in.");
  const db = client(token);
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new Error("Session expired. Please sign in.");
  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();
  if (profileError || profile?.account_status !== "Active")
    throw new Error("Active gym account required.");
  return { db, user: data.user, profile };
}
export function failure(error: unknown) {
  return Response.json(
    {
      error:
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "Request failed",
    },
    { status: 400 },
  );
}
