'use client';
import { useGym } from '@/features/app/GymProvider';
import EntityForm from '@/features/forms/EntityForm';
import { formDefs } from '@/features/forms/field-definitions';
/** MEMBERSHIP PLAN FORM UI: labels and limits are defined in field-definitions.ts. */
export default function PlanForm() {
  const { values } = useGym();
  return (
    <EntityForm
      form="plan"
      title={values.id ? 'Edit membership plan' : 'Add membership plan'}
      fields={formDefs.plan}
    />
  );
}
