'use client';
import EntityForm from '@/features/forms/EntityForm';
import { formDefs } from '@/features/forms/field-definitions';
/** Registration persists through the Next.js API and Supabase Auth. */
export default function SignupPage() {
  return (
    <EntityForm
      form="register"
      title="Start your next chapter."
      description="Your stronger routine starts right here."
      fields={formDefs.register}
      submitLabel="Create account"
    >
      <p className="required-legend">
        <span className="required-mark" aria-hidden="true">
          *
        </span>{' '}
        Required fields
      </p>
    </EntityForm>
  );
}
