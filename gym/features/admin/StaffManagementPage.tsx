"use client";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { useGym } from "@/features/app/GymProvider";
import type { StaffRecord } from "@/lib/domain/models";
import StaffForm, { type StaffInput } from "./StaffForm";
import StaffTable from "./StaffTable";
import { staffRequest } from "./staff-client";
/** ADMIN MANAGEMENT UI: directory, registration, contact editing and confirmed deletion. */
export default function StaffManagementPage() {
  const { open, busy, setBusy } = useGym();
  const [records, setRecords] = useState<StaffRecord[]>([]),
    [editing, setEditing] = useState<StaffRecord | null>(null),
    [deleting, setDeleting] = useState<StaffRecord | null>(null);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    let active = true;
    staffRequest<{ data: StaffRecord[] }>("GET")
      .then((r) => {
        if (active) setRecords(r.data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function reload() {
    try {
      const result = await staffRequest<{ data: StaffRecord[] }>("GET");
      setRecords(result.data);
      setError("");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to refresh staff records.",
      );
    }
  }
  async function save(input: StaffInput) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await staffRequest(editing ? "PATCH" : "POST", {
        ...input,
        ...(editing ? { id: editing.staff_id } : {}),
      });
      setNotice(
        editing
          ? "Staff information updated."
          : "Staff account created. They can now use Staff sign in.",
      );
      setEditing(null);
      await reload();
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await staffRequest("DELETE", { id: deleting.staff_id, confirm: true });
      setNotice("Staff account deleted.");
      if (editing?.staff_id === deleting.staff_id) setEditing(null);
      setDeleting(null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete staff.");
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      const r = await fetch("/api/admin/session", {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!r.ok) throw Error("Unable to sign out.");
      open("login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to sign out.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="staff-management">
      <div className="eyebrow">PULSE / STAFF ADMINISTRATION</div>
      <h2>Manage staff</h2>
      <div className="staff-management-actions">
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => {
            setEditing(null);
            setError("");
          }}
        >
          Register new staff
        </Button>
        <Button variant="text" disabled={busy} onClick={logout}>
          Admin sign out
        </Button>
      </div>
      {error && (
        <div className="error" role="alert">
          <p>{error}</p>
          <Button variant="text" disabled={busy} onClick={reload}>
            Refresh
          </Button>
          <Button
            variant="text"
            disabled={busy}
            onClick={() => open("admin-login")}
          >
            Admin sign in
          </Button>
        </div>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <h3>Staff members ({records.length})</h3>
      {loading ? (
        <p role="status">Loading staff…</p>
      ) : (
        <StaffTable
          records={records}
          busy={busy}
          onEdit={(s) => {
            setEditing(s);
            setError("");
            setNotice("");
          }}
          onDelete={(s) => {
            setDeleting(s);
            setError("");
          }}
        />
      )}
      {deleting && (
        <section
          className="staff-delete-confirm"
          role="alertdialog"
          aria-label="Confirm staff deletion"
        >
          <h3>Delete {deleting.staff_name}?</h3>
          <p>
            This permanently removes their staff account and sign-in access.
            Historical cash receipts retain the verifier name.
          </p>
          <div className="staff-row-actions">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Cancel
            </Button>
            <Button variant="danger" disabled={busy} onClick={remove}>
              Yes, delete staff
            </Button>
          </div>
        </section>
      )}
      {!loading && !deleting && (
        <section className="staff-edit-section">
          <StaffForm
            key={editing?.staff_id || "new"}
            initialValues={
              editing
                ? {
                    username: editing.username,
                    name: editing.staff_name,
                    gender: editing.gender,
                    phone: editing.phone_no,
                    email: editing.email,
                  }
                : undefined
            }
            onCancel={() => setEditing(null)}
            onSave={save}
          />
        </section>
      )}
    </section>
  );
}
