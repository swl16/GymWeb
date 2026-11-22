'use client';
import { recoveryIdentifier } from '@/lib/auth/recovery-identifier.mjs';
import Button from '@/components/ui/Button';
import { useGym } from '@/features/app/GymProvider';
import { useState } from 'react';
/** FORGOT PASSWORD UI: request an email link; password changes require its recovery session. */
export default function ForgotPasswordPage() {
  const { open } = useGym();
  const [identifier, setIdentifier] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function send(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (!recoveryIdentifier(identifier)) {
      setError('Enter your username or a valid email address.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || 'Unable to request a reset link.');
      setMessage(result.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to request a reset link.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={send}>
      <div className="eyebrow">PULSE FITNESS / ACCOUNT RECOVERY</div>
      <h2>Forgot your password?</h2>
      <p>
        Enter your username or registered email address. Verify the link in your email,
        then create a new password.
      </p>
      {message ? (
        <div className="notice" role="status">
          {message}
        </div>
      ) : (
        <label className="stacked-field">
          Username or email address
          <input
            type="text"
            autoComplete="username"
            required
            maxLength={254}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={busy}
          />
        </label>
      )}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <div className="modal-actions">
        <Button variant="secondary" disabled={busy} onClick={() => open('login')}>
          Back to sign in
        </Button>
        {!message && (
          <Button variant="primary" type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </Button>
        )}
      </div>
    </form>
  );
}
