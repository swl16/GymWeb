"use client";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useGym } from "@/features/app/GymProvider";
import { sb } from "@/lib/api/browser-client";
import { date } from "@/lib/domain/format";
import { ageFromDob } from "@/lib/validation.mjs";
import { LogOut, Pencil, ShieldCheck } from "lucide-react";
/** ProfilePage UI: one screen per file; shared state is accessed through useGym. */
export default function ProfilePage() {
  const {
    user: account,
    open,
    confirm,
    staff,
    trainer,
    subscriptions,
    bookings,
    logs,
    navigate,
  } = useGym();
  const user = account!;
  return (
    <div className="profile-grid">
      <section className="panel profile-card">
        <div className="large-avatar">
          {user.name
            .split(" ")
            .map((x: string) => x[0])
            .join("")
            .slice(0, 2)}
        </div>
        <h2>{user.name}</h2>
        <Badge status={trainer ? "Trainer" : staff ? "Staff" : "Member"} />
        <dl>
          {[
            ["Username", user.username],
            ["Email", user.email],
            ["Phone", user.phone],
            ["Gender", user.gender],
            ...(user.role === "member"
              ? [
                  ["Date of birth", date(user.date_of_birth)],
                  ["Age", String(ageFromDob(user.date_of_birth) ?? "—")],
                  ["Height", user.height ? user.height + " m" : "Not set"],
                  ["Weight", user.weight ? user.weight + " kg" : "Not set"],
                ]
              : []),
          ].map(([a, b]) => (
            <div key={a}>
              <dt>{a}</dt>
              <dd>{b}</dd>
            </div>
          ))}
        </dl>
        <Button className="primary" onClick={() => open("profile", user)}>
          <Pencil size={15} />
          Edit profile
        </Button>
        <Button className="secondary" onClick={() => open("change-password")}>
          Change password
        </Button>
        <Button
          className="secondary"
          onClick={async () => {
            await sb.auth.signOut();
            navigate("overview");
          }}
        >
          <LogOut size={15} />
          Sign out
        </Button>
      </section>
      <section className="panel profile-copy">
        <ShieldCheck size={30} />
        <h2>Your account, your control.</h2>
        <p>
          Keep your details up to date so your gym can stay in touch. Your
          username is used for sign-in.{" "}
          {user.role === "member" &&
            "Age is calculated automatically from your date of birth."}
        </p>
        {user.role === "member" && (
          <div className="danger-zone">
            <h3>Delete account</h3>
            <p>
              Your profile, subscriptions, bookings, attendance and fitness logs
              will be deleted. Payment records are retained without your member
              ID.
            </p>
            <Button
              className="danger-button"
              onClick={() =>
                confirm(
                  "delete_account",
                  {},
                  "Delete your account?",
                  "This permanently deletes your account and associated fitness records. This action cannot be undone.",
                )
              }
            >
              Delete my account
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
