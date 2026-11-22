import { accountServicesConfigured, appOrigin } from "@/lib/server-config";
import { client, failure } from "@/lib/server";
import { ageFromDob, validateRegistration } from "@/lib/validation.mjs";
export async function POST(request: Request) {
  try {
    if (!accountServicesConfigured())
      return Response.json(
        {
          error:
            "Account services are not connected yet. Please contact the gym administrator.",
        },
        { status: 503 },
      );
    const { action, ...p } = await request.json();
    if (action === "register") {
      p.age = ageFromDob(p.date_of_birth);
      const errors = validateRegistration(p);
      if (Object.keys(errors).length)
        return Response.json(
          { error: "Check your registration fields.", errors },
          { status: 400 },
        );
      const { password, ...profile } = p;
      const { data, error } = await client().auth.signUp({
        email: p.email,
        password,
        options: { data: profile, emailRedirectTo: appOrigin() },
      });
      if (error) throw error;
      return Response.json({
        session: data.session,
        message: data.session
          ? "Registration successful."
          : "Registration successful. Check your email to confirm your account before signing in.",
      });
    }
    if (action !== "login") throw new Error("Unknown action.");
    if (!/^[A-Za-z0-9]{3,11}$/.test(p.username || ""))
      throw new Error("Invalid username or password.");
    const { data: profile } = await client(undefined, true)
      .from("profiles")
      .select("id,account_status,role")
      .eq("username", p.username.toLowerCase())
      .maybeSingle();
    // Always perform a password authentication attempt; do not disclose username existence.
    const authRecord = profile
      ? await client(undefined, true).auth.admin.getUserById(profile.id)
      : null;
    const { data, error } = await client().auth.signInWithPassword({
      email: authRecord?.data?.user?.email || "unknown@invalid.example",
      password: p.password || "",
    });
    if (
      error ||
      !profile ||
      profile.account_status !== "Active" ||
      (p.portal === "staff" && profile.role !== "staff")
    )
      throw new Error("Invalid username or password.");
    return Response.json({ session: data.session });
  } catch (e) {
    return failure(e);
  }
}
