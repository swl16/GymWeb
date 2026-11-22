import { isGymAdmin } from "@/lib/admin/access.mjs";
import { validateWeeklyTarget } from "@/lib/domain/fitness.mjs";
import { validateMeasurements } from "@/lib/validation.mjs";
import {
  validateFitness,
  validateSchedule,
} from "@/lib/domain/form-validation.mjs";
import { authenticated, client, failure } from "@/lib/server";
import { stripeClient } from "@/lib/stripe-server";
import { validateTrainer } from "@/lib/domain/trainer-validation.mjs";
import { validateStaffUpdate } from "@/lib/admin/staff-validation.mjs";
export async function GET(request: Request) {
  try {
    const { db, user } = await authenticated(request);
    const refreshed = await db.rpc("refresh_membership_dictionary");
    if (refreshed.error) throw refreshed.error;
    const tables = [
      "profiles",
      "class_types",
      "membership_plans",
      "user_subscriptions",
      "class_schedules",
      "class_bookings",
      "gym_attendance",
      "payments",
      "fitness_logs",
      "saved_cards",
      "trainers",
      "staff",
      "deleted_member_accounts",
    ];
    const results = await Promise.all(
      tables.map((t) => db.from(t).select("*")),
    );
    const out: any = {};
    results.forEach((r, i) => {
      if (r.error) throw r.error;
      out[tables[i]] = r.data;
    });
    const availability = await db.rpc("class_availability");
    if (availability.error) throw availability.error;
    out.class_availability = availability.data;
    const roster = await db.rpc("class_roster");
    if (roster.error) throw roster.error;
    out.class_roster = roster.data;
    out.is_admin = isGymAdmin(
      user,
      out.profiles.find((p: any) => p.id === user.id),
    );
    return Response.json(out);
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const { db, user, profile } = await authenticated(request);
    const { action, payload } = await request.json();
    if (action === "update_profile" && profile.role !== "member") {
      const contact = {
        ...profile,
        ...payload,
        username: profile.username,
        gender: profile.gender,
      };
      const errors = profile.role === 'staff' ? validateStaffUpdate(contact) : validateTrainer(contact);
      if (Object.keys(errors).length)
        return Response.json(
          { error: "Check your profile details.", errors },
          { status: 400 },
        );
      const { error } = await client(undefined, true).auth.admin.updateUserById(
        user.id,
        {
          email: contact.email.trim(),
          email_confirm: true,
          user_metadata: {
            ...user.user_metadata,
            username: profile.username,
            name: contact.name.trim(),
            gender: profile.gender,
            phone: contact.phone,
          },
        },
      );
      if (error) throw error;
      return Response.json({ message: "Profile updated." });
    }
    if (action === "delete_account") {
      const { data: profile } = await db
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role !== "member" || payload?.confirm !== true)
        throw new Error("Member confirmation required.");
      const admin = client(undefined, true);
      const { data: mapping, error: lookupError } = await admin
        .from("payment_customers")
        .select("provider_customer_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (lookupError) throw lookupError;
      if (mapping) {
        try {
          await stripeClient().customers.del(mapping.provider_customer_id);
        } catch (e: any) {
          if (e.code !== "resource_missing") throw e;
        }
      }
      const { error } = await admin.auth.admin.deleteUser(user.id);
      if (error) throw error;
      return Response.json({ message: "Account deleted." });
    }
    if (action === "set_measurements" || action === "set_weekly_target") {
      const errors =
        action === "set_weekly_target"
          ? validateWeeklyTarget(payload || {})
          : validateMeasurements(payload || {});
      if (action === "set_measurements") {
        if (!payload?.weight) errors.weight = "Enter your current weight.";
        if (!payload?.height) errors.height = "Enter your current height.";
      }
      if (Object.keys(errors).length)
        return Response.json(
          { error: "Please correct the highlighted fields.", errors },
          { status: 400 },
        );
    }
    if (action === "save_class" || action === "save_fitness") {
      let errors;
      if (action === "save_class") {
        const permission = await db.rpc("is_staff");
        if (!permission.data) throw Error("Staff access required.");
        const names = [
          "class_types",
          "trainers",
          "class_schedules",
          "class_bookings",
        ];
        const rows = await Promise.all(
          names.map((name) => db.from(name).select("*")),
        );
        const snapshot: Record<string, any> = {};
        rows.forEach((r, i) => {
          if (r.error) throw r.error;
          snapshot[names[i]] = r.data;
        });
        errors = validateSchedule(payload, snapshot);
      } else errors = validateFitness(payload);
      if (Object.keys(errors).length)
        return Response.json(
          { error: "Please correct the highlighted fields.", errors },
          { status: 400 },
        );
    }
    const { data, error } = await db.rpc("gym_action", {
      action,
      payload: payload || {},
    });
    if (error) throw error;
    return Response.json({ data, message: "Saved successfully." });
  } catch (e) {
    return failure(e);
  }
}
