"use client";
import { createSubmitHandler } from "@/features/forms/create-submit-handler";
import { useAppearance } from "@/features/settings/useAppearance";
import { selectWorkspace } from "./workspace-selectors";
/** Application state and orchestration only. UI belongs in feature components. */
import { roomNumber } from "@/lib/domain/schedule-room.mjs";
import { sb } from "@/lib/api/browser-client";
import { requestJson } from "@/lib/api/request";
import { localInput } from "@/lib/domain/format";
import { emptyData, type GymData, type Profile } from "@/lib/domain/models";
import { klNow } from "@/lib/validation.mjs";
import { useEffect, useState } from "react";
const uid = () => crypto.randomUUID();
export default function useGymController(
  initialModal?: "login" | "register" | "staff-login" | "admin-login",
) {
  const [data, setData] = useState<GymData>(emptyData()),
    [user, setUser] = useState<Profile | null>(null),
    [session, setSession] = useState<any>(null),
    [view, setView] = useState("overview"),
    [mobile, setMobile] = useState(false),
    [modal, setModal] = useState<any>(
      initialModal ? { type: initialModal } : null,
    ),
    [values, setValues] = useState<any>({}),
    [errors, setErrors] = useState<any>({}),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState(""),
    [month, setMonth] = useState(klNow().slice(0, 7)),
    [filter, setFilter] = useState("All classes");
  const { theme, setTheme, accent, setAccent, collapsed, toggleSidebar } =
    useAppearance();
  useEffect(() => {
    if (sb) {
      sb.auth.getSession().then(({ data: { session: s } }) => {
        if (s) {
          setSession(s);
          load(s);
        }
      });
      const {
        data: { subscription },
      } = sb!.auth.onAuthStateChange((_e, s) => {
        setSession(s);
        if (_e === "PASSWORD_RECOVERY") setModal({ type: "password-reset" });
        if (!s) {
          setUser(null);
          setData(emptyData());
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 6000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  async function load(s: any) {
    const r = await fetch("/api/gym", {
        headers: { Authorization: "Bearer " + s.access_token },
      }),
      d = await r.json();
    if (!r.ok) {
      setToast(d.error);
      return;
    }
    setData(d);
    setUser(d.profiles.find((p: any) => p.id === s.user.id));
    if (new URLSearchParams(window.location.search).has("checkout")) {
      setView("payments");
      notify(
        "Returned from secure checkout. Payment status is confirmed by the provider.",
      );
      window.history.replaceState({}, "", window.location.pathname);
    }
  }
  function notify(s: string) {
    setToast(s);
  }
  function open(type: string, p: any = {}) {
    setErrors({});
    setValues(
      type === "class"
        ? {
            status: "Active",
            fee: 0,
            capacity: 16,
            ...p,
            room: roomNumber(p.room_id ?? p.room)?.toString() ?? "",
            ...(p.starts_at
              ? {
                  starts_at: localInput(p.starts_at),
                  ends_at: localInput(p.ends_at),
                }
              : {}),
          }
        : type === "fitness"
          ? { duration: 0, ...p }
          : p,
    );
    setModal({ type });
  }
  async function act(
    action: string,
    payload: any,
    message = "Saved successfully.",
  ) {
    if (!user) {
      notify("Please sign in.");
      return false;
    }
    setBusy(true);
    let savedId: any;
    try {
      {
        const {
          data: { session: s },
        } = await sb!.auth.getSession();
        if (!s) throw Error("Please sign in.");
        const endpoint =
          action === "remove_card"
            ? "/api/cards"
            : action === "add_staff"
              ? "/api/admin/staff"
              : action === "add_trainer"
                ? "/api/trainers"
                : "/api/gym";
        const r = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + s.access_token,
          },
          body: JSON.stringify(
            ["remove_card", "add_trainer", "add_staff"].includes(action)
              ? payload
              : { action, payload },
          ),
        });
        const d = await r.json();
        if (!r.ok) throw Object.assign(Error(d.error), { fields: d.errors });
        savedId = d.data?.id;
        if (action === "delete_account") {
          await sb!.auth.signOut();
        } else await load(s);
      }
      notify(message);
      setModal(null);
      return { id: savedId };
    } catch (e: any) {
      setErrors(e.fields || { form: e.message });
      notify(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function purchase(action: string, payload: any) {
    if (!user) {
      open("login");
      return;
    }
    open("purchase-review", { action, payload });
  }
  async function hostedCheckout(p: any) {
    if (p.method === "Cash") {
      const result = await act(
        "pay",
        {
          payment_type: p.payment_type,
          target_id: p.target_id,
          method: "Cash",
        },
        "Cash payment submitted. Pay at the front desk for verification.",
      );
      if (!result) throw Error("Unable to submit cash payment.");
      return;
    }
    const {
      data: { session: s },
    } = await sb!.auth.getSession();
    if (!s) throw Error("Please sign in.");
    const r = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + s.access_token,
      },
      body: JSON.stringify(p),
    });
    const result = await r.json();
    if (!r.ok) throw Error(result.error);
    const url = new URL(result.url);
    if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com")
      throw Error("Invalid payment provider URL.");
    window.location.assign(result.url);
  }
  const submit = createSubmitHandler({
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
  });
  function confirm(action: string, p: any, title: string, detail: string) {
    setModal({ type: "confirm", action, p, title, detail });
    setErrors({});
  }
  const {
    staff,
    trainer,
    ops,
    own,
    nameOf,
    subscriptions,
    bookings,
    logs,
    visits,
    payments,
    activeSub,
    plan,
    upcoming,
    latest,
    checked,
    trainerClasses,
    trainerBookings,
    nav,
    title,
  } = selectWorkspace(data, user);
  function navigate(v: string) {
    setView(v);
    setSearch("");
    setMobile(false);
    setErrors({});
  }
  async function exportReport() {
    try {
      if (user?.role !== "staff") throw new Error("Staff access required.");
      const { downloadReportPdf } =
        await import("@/lib/reports/pdf-export.mjs");
      await downloadReportPdf(data, month);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Unable to export PDF.");
    }
  }
  async function getBookingPass(bookingId: string) {
    if (!user) throw Error("Please sign in.");
    return requestJson<{ token: string; redeemed_at: string | null }>(
      "/api/attendance",
      {
        action: "issue",
        booking_id: bookingId,
      },
    );
  }
  async function redeemPass(token: string, direction = "in") {
    if (!user) throw Error("Please sign in.");
    const result = await requestJson<{
      message: string;
    }>("/api/attendance", {
      action: "redeem",
      token,
      direction,
    });
    const session = await sb!.auth.getSession();
    if (session.data.session) await load(session.data.session);
    return result;
  }
  return {
    exportReport,
    getBookingPass,
    redeemPass,
    data,
    setData,
    user,
    setUser,
    session,
    view,
    setView,
    theme,
    setTheme,
    accent,
    setAccent,
    mobile,
    setMobile,
    collapsed,
    modal,
    setModal,
    values,
    setValues,
    errors,
    setErrors,
    toast,
    setToast,
    busy,
    setBusy,
    search,
    setSearch,
    month,
    setMonth,
    filter,
    setFilter,
    toggleSidebar,
    load,
    notify,
    open,
    act,
    purchase,
    hostedCheckout,
    submit,
    confirm,
    staff,
    trainer,
    ops,
    own,
    nameOf,
    subscriptions,
    bookings,
    logs,
    visits,
    payments,
    activeSub,
    plan,
    upcoming,
    latest,
    checked,
    trainerClasses,
    trainerBookings,
    nav,
    title,
    navigate,
  };
}
