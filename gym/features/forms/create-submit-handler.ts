import { MINIMUM_REGISTRATION_AGE } from "@/lib/domain/registration-age.mjs";
import { validateStaffCreation, validateStaffUpdate } from "@/lib/admin/staff-validation.mjs";
import { validateWeeklyTarget } from "@/lib/domain/fitness.mjs";
import { sb } from "@/lib/api/browser-client";
import {
  validateFitness,
  validateSchedule,
} from "@/lib/domain/form-validation.mjs";
import type { GymData, Profile } from "@/lib/domain/models";
import { emptyData } from "@/lib/domain/models";
import {
  validateTrainer,
  validateTrainerCreation,
} from "@/lib/domain/trainer-validation.mjs";
import {
  ageFromDob,
  validateMeasurements,
  validateRegistration,
} from "@/lib/validation.mjs";
import type { FormEvent } from "react";
const uid = () => crypto.randomUUID();
interface FormSubmitDependencies {
  modal: {
    type: string;
  } | null;
  values: Record<string, any>;
  user: Profile | null;
  data: GymData;
  setValues: (values: Record<string, any>) => void;
  setErrors: (errors: Record<string, string>) => void;
  setBusy: (busy: boolean) => void;
  setData: (data: GymData) => void;
  setUser: (user: Profile | null) => void;
  setSession: (session: any) => void;
  setModal: (modal: any) => void;
  setView: (view: string) => void;
  notify: (message: string) => void;
  load: (session: any) => Promise<void>;
  act: (
    action: string,
    payload: any,
    message?: string,
  ) => Promise<
    | false
    | {
        id?: string;
      }
  >;
}
/** Form orchestration is separated from rendering; each page owns its own UI fields. */
export function createSubmitHandler(dependencies: FormSubmitDependencies) {
  const {
    modal,
    values,
    user,
    data,
    setErrors,
    setValues,
    setBusy,
    setData,
    setUser,
    setSession,
    setModal,
    setView,
    notify,
    load,
    act,
  } = dependencies;
  return async function submit(event: FormEvent) {
    const e = event;
    if (!modal) return;
    e.preventDefault();
    setErrors({});
    const type = modal.type,
      p = { ...values };
    if (type === "profile" && user?.role !== "member") {
      delete p.height;
      delete p.weight;
      delete p.date_of_birth;
      delete p.age;
    }
    if (type === "register" || (type === "profile" && user?.role === "member"))
      p.age = ageFromDob(p.date_of_birth);
    if (type === "register" || type === "profile") {
      const check: Record<string, string> =
        type === "profile" && user?.role !== "member"
          ? {
              ...(user?.role === "staff" ? validateStaffUpdate({ ...user, ...p }) : validateTrainer({ ...user, ...p })),
            }
          : validateRegistration(
              type !== "profile"
                ? p
                : { ...user, ...p, password: "Validation1!" },
              { minimumAge: type === "profile" ? 1 : MINIMUM_REGISTRATION_AGE },
            );
      if (type === "profile") {
        delete check.username;
        delete check.password;
        delete check.gender;
      }
      if (Object.keys(check).length) {
        setErrors(check);
        return;
      }
    }
    if (type === "register" || type === "login" || type === "staff-login") {
      setBusy(true);
      try {
        {
          const r = await fetch("/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...p,
              action: type === "staff-login" ? "login" : type,
              ...(type === "staff-login" ? { portal: "staff" } : {}),
            }),
          });
          const result = await r.json();
          if (!r.ok) {
            setErrors(result.errors || { form: result.error });
            return;
          }
          if (result.session) {
            await sb!.auth.setSession(result.session);
            setSession(result.session);
            await load(result.session);
          }
          notify(result.message || "Welcome back.");
        }
        setModal(null);
        setView("overview");
      } catch (e: any) {
        setErrors({ form: e.message });
      } finally {
        setBusy(false);
      }
      return;
    }
    if (type === "trainer" || type === "staff-create") {
      const check: Record<string, string> =
        type === "staff-create"
          ? validateStaffCreation(p)
          : validateTrainerCreation(p);
      if (Object.keys(check).length) {
        setErrors(check);
        return;
      }
      const added = await act(
        type === "staff-create" ? "add_staff" : "add_trainer",
        p,
        type === "staff-create"
          ? "Staff profile created."
          : "Trainer added. They can sign in with the username and initial password you set.",
      );
      if (added) setValues({});
      return;
    }
    if (type === "measurements" || type === "weekly-target") {
      const check =
        type === "weekly-target"
          ? validateWeeklyTarget(p)
          : validateMeasurements(p);
      if (type === "measurements") {
        if (!p.weight) check.weight = "Enter your current weight.";
        if (!p.height) check.height = "Enter your current height.";
      }
      if (Object.keys(check).length) {
        setErrors(check);
        return;
      }
      await act(
        type === "measurements" ? "set_measurements" : "set_weekly_target",
        p,
        "Fitness settings updated.",
      );
      return;
    }
    if (
      type === "fitness" &&
      !p.id &&
      (!user?.weight || !user?.height || !user?.weekly_target_minutes)
    ) {
      setErrors({
        form: "Set your current weight, height and weekly target before adding a fitness log.",
      });
      return;
    }
    if (type === "class" || type === "fitness") {
      const check =
        type === "class" ? validateSchedule(p, data) : validateFitness(p);
      if (Object.keys(check).length) {
        setErrors(check);
        return;
      }
    }
    if (type === "class") {
      p.starts_at = p.starts_at + ":00+08:00";
      p.ends_at = p.ends_at + ":00+08:00";
    }
    if (type === "pay") {
      if (!p.target_id || !p.method) {
        setErrors({ form: "Select a payment item and method." });
        return;
      }
      await act(
        "pay",
        p,
        "Payment submitted. Pay at the front desk; staff will verify your cash payment.",
      );
      return;
    }
    await act(
      (
        {
          plan: "save_plan",
          class: "save_class",
          "class-type": "save_class_type",
          fitness: "save_fitness",
          profile: "update_profile",
        } as Record<string, string>
      )[type],
      p,
      type === "profile" ? "Profile updated." : "Saved successfully.",
    );
  };
}
