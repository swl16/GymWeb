'use client';
import PasswordInput from '@/components/forms/PasswordInput';
import { passwordError } from '@/lib/domain/password.mjs';
import Button from '@/components/ui/Button';
import { useGym } from '@/features/app/GymProvider';
import { sb } from '@/lib/api/browser-client';
import { useState } from 'react';
/** PASSWORD SETUP UI: accepts Supabase recovery sessions from password recovery emails. */
export default function PasswordResetPage() {
  const { setModal, notify } = useGym();
  const [confirmation, setConfirmation] = useState('');
  const [password, setPassword] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const policyError = passwordError(password);
    if (policyError) {
      setError(policyError);
      return;
    }
    if (password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      if (!sb) throw Error('Password setup requires a connected Supabase project.');
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw error;
      setPassword('');
      setConfirmation('');
      setModal(null);
      notify('Password updated successfully.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to set password.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save}>
      <div className="eyebrow">ACCOUNT RECOVERY</div>
      <h2>Set your password</h2>
      <p>
        Choose a new password: at least 6 characters, with an uppercase letter, a digit
        and a special character.
      </p>
      <label className="stacked-field">
        New password
        <PasswordInput
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <label className="stacked-field">
        Confirm new password
        <PasswordInput
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
        />
      </label>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <div className="modal-actions">
        <Button variant="primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Set password'}
        </Button>
      </div>
    </form>
  );
}
