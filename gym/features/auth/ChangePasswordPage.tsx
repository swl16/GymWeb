'use client';
import PasswordInput from '@/components/forms/PasswordInput';
import { changeAccountPassword } from '@/lib/auth/change-password.mjs';
import { useState } from 'react';
import Button from '@/components/ui/Button';
import { useGym } from '@/features/app/GymProvider';
import { sb } from '@/lib/api/browser-client';
import { passwordChangeErrors, PASSWORD_HINT } from '@/lib/domain/password.mjs';
/** ACCOUNT SECURITY FORM: vertical fields, private local input state, no credentials in shared form state. */
export default function ChangePasswordPage() {
  const { user, setModal, notify } = useGym();
  const [values, setValues] = useState({
    current_password: '',
    password: '',
    confirmation: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    const check = passwordChangeErrors(values);
    setErrors(check);
    if (Object.keys(check).length || busy) return;
    setBusy(true);
    try {
      if (!user) throw Error('Please sign in again.');
      await changeAccountPassword(sb.auth, values);
      setValues({ current_password: '', password: '', confirmation: '' });
      setModal(null);
      notify(
        'Password changed successfully. Use your new password next time you sign in.',
      );
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : 'Unable to change password.',
      });
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} noValidate>
      <div className="eyebrow">PULSE / ACCOUNT SECURITY</div>
      <h2>Change password</h2>
      <p>{PASSWORD_HINT}</p>
      {(['current_password', 'password', 'confirmation'] as const).map((key) => {
        const label = {
          current_password: 'Current password',
          password: 'New password',
          confirmation: 'Confirm new password',
        }[key];
        return (
          <label className="stacked-field" key={key} htmlFor={'change-' + key}>
            <span>
              {label}{' '}
              <span className="required-mark" aria-hidden="true">
                *
              </span>
            </span>
            <PasswordInput
              id={'change-' + key}
              type="password"
              autoComplete={
                key === 'current_password' ? 'current-password' : 'new-password'
              }
              required
              minLength={key === 'current_password' ? undefined : 6}
              value={values[key]}
              aria-invalid={!!errors[key]}
              aria-describedby={errors[key] ? 'change-' + key + '-error' : undefined}
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
            />
            {errors[key] && (
              <small id={'change-' + key + '-error'} className="error" role="alert">
                {errors[key]}
              </small>
            )}
          </label>
        );
      })}
      {errors.form && (
        <div className="error" role="alert">
          {errors.form}
        </div>
      )}
      <div className="modal-actions">
        <Button variant="secondary" disabled={busy} onClick={() => setModal(null)}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Change password'}
        </Button>
      </div>
    </form>
  );
}
