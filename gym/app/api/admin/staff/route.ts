import { hasAdminSession, sameOrigin } from "@/lib/admin/session";
import { client, failure } from "@/lib/server";
import {
  staffAuthAttributes,
  validateStaffCreation,
  validateStaffUpdate,
} from "@/lib/admin/staff-validation.mjs";
export const runtime = "nodejs";
const headers = { "Cache-Control": "no-store" };
function denied(request: Request, mutation = false) {
  if (mutation && !sameOrigin(request))
    return Response.json(
      { error: "Invalid request origin." },
      { status: 403, headers },
    );
  if (!hasAdminSession(request))
    return Response.json(
      { error: "Sign in as admin to manage staff." },
      { status: 401, headers },
    );
  return null;
}
function validId(id: unknown): id is string {
  return (
    typeof id === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  );
}
async function staffTarget(id: unknown) {
  if (!validId(id)) throw Error("Select a valid staff record.");
  const db = client(undefined, true);
  const { data, error } = await db
    .from("profiles")
    .select("id,role,account_status")
    .eq("id", id)
    .single();
  if (error || data?.role !== "staff" || data.account_status !== "Active")
    throw Error("Active staff account not found.");
  const auth = await db.auth.admin.getUserById(id);
  if (auth.error || !auth.data.user)
    throw Error("Staff authentication account not found.");
  return { db, user: auth.data.user, id };
}
export async function GET(request: Request) {
  try {
    const blocked = denied(request);
    if (blocked) return blocked;
    const { data, error } = await client(undefined, true)
      .from("staff")
      .select("staff_id,username,staff_name,gender,phone_no,email")
      .order("staff_name");
    if (error) throw error;
    return Response.json({ data }, { headers });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    const blocked = denied(request, true);
    if (blocked) return blocked;
    const input = await request.json();
    const errors = validateStaffCreation(input || {});
    if (Object.keys(errors).length)
      return Response.json(
        { error: "Check the staff details.", errors },
        { status: 400, headers },
      );
    const { data, error } = await client(undefined, true).auth.admin.createUser(
      staffAuthAttributes(input),
    );
    if (error || !data.user) throw error || Error("Unable to create staff.");
    return Response.json(
      { data: { id: data.user.id }, message: "Staff created." },
      { status: 201, headers },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(request: Request) {
  try {
    const blocked = denied(request, true);
    if (blocked) return blocked;
    const input = await request.json();
    const errors = validateStaffUpdate(input || {});
    if (Object.keys(errors).length)
      return Response.json(
        { error: "Check the staff details.", errors },
        { status: 400, headers },
      );
    const { db, user, id } = await staffTarget(input.id);
    const ready = await db.rpc("staff_profile_sync_ready");
    if (ready.error || ready.data !== true)
      throw Error(
        "Install supabase/07_staff_profile_sync.sql before editing staff.",
      );
    // The Auth update trigger synchronizes Auth and Staff in the same DB transaction.
    const { error } = await db.auth.admin.updateUserById(id, {
      email: input.email.trim(),
      email_confirm: true,
      user_metadata: {
        ...user.user_metadata,
        username: input.username.toLowerCase(),
        name: input.name.trim(),
        gender: input.gender,
        phone: input.phone,
      },
    });
    if (error) throw error;
    return Response.json(
      { message: "Staff information updated." },
      { headers },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: Request) {
  try {
    const blocked = denied(request, true);
    if (blocked) return blocked;
    const input = await request.json();
    if (input.confirm !== true) throw Error("Confirm before deleting staff.");
    const { db, id } = await staffTarget(input.id);
    // Auth deletion cascades to the linked Staff record. Cash verifier snapshots remain.
    const { error } = await db.auth.admin.deleteUser(id);
    if (error) throw error;
    return Response.json({ message: "Staff account deleted." }, { headers });
  } catch (error) {
    return failure(error);
  }
}
