"use client";
import { useState, type FormEvent } from "react";
import Button from "@/components/ui/Button";
import PasswordInput from "@/components/forms/PasswordInput";
import { useGym } from "@/features/app/GymProvider";
/** ADMIN SIGN-IN UI: credentials are verified by the server, never in the browser. */
export default function AdminLoginPage() {
  const { open, setBusy, busy } = useGym();
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Enter the admin username and password.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || "Unable to sign in.");
      setPassword("");
      open("staff-admin");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <div className="eyebrow">PULSE / ADMINISTRATOR</div>
      <h2>Admin sign in.</h2>
      <p>Sign in to register staff and manage existing staff accounts.</p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="form-grid form-grid--vertical">
        <label>
          <span>
            Username <span className="required-mark">*</span>
          </span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            disabled={busy}
          />
        </label>
        <label>
          <span>
            Password <span className="required-mark">*</span>
          </span>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={busy}
          />
        </label>
      </div>
      <div className="modal-actions">
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => open("login")}
        >
          Back
        </Button>
        <Button variant="primary" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </div>
    </form>
  );
}
