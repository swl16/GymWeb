'use client';
import Button from '@/components/ui/Button';
import { useGym } from '@/features/app/GymProvider';
import { ArrowRight } from 'lucide-react';
import FormFields from './FormFields';
import type { FieldDefinition } from './field-definitions';
/** SHARED FORM LAYOUT: feature forms own their fields/title, this owns consistent spacing/buttons. */
export default function EntityForm({
  form,
  title,
  description = 'Fill in the details below.',
  fields,
  submitLabel = 'Save changes',
  children,
  afterFields,
  onCancel,
  onSubmit,
  submitting = false,
}: {
  form: string;
  title: string;
  description?: string;
  fields: FieldDefinition[];
  submitLabel?: string;
  children?: React.ReactNode;
  afterFields?: React.ReactNode;
  onCancel?: () => void;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  submitting?: boolean;
}) {
  const { submit, setModal, errors, busy: sharedBusy } = useGym();
  const busy = sharedBusy || submitting;
  return (
    <form
      onSubmit={onSubmit || submit}
      noValidate={['class', 'fitness', 'register'].includes(form)}
    >
      <div className="eyebrow">PULSE FITNESS</div>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
      {errors.form && (
        <div className="error" role="alert">
          {errors.form}
        </div>
      )}
      <FormFields form={form} fields={fields} />
      {afterFields}
      <div className="modal-actions">
        <Button
          variant="secondary"
          disabled={busy}
          onClick={onCancel || (() => setModal(null))}
        >
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
          <ArrowRight size={15} />
        </Button>
      </div>
    </form>
  );
}
