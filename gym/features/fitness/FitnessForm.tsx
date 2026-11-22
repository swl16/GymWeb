'use client';
import { useGym } from '@/features/app/GymProvider';
import EntityForm from '@/features/forms/EntityForm';
import { formDefs } from '@/features/forms/field-definitions';
/** FITNESS ENTRY FORM UI: labels and limits are defined in field-definitions.ts. */
export default function FitnessForm() {
  const { values } = useGym();
  return (
    <EntityForm
      form="fitness"
      title={values.id ? 'Edit fitness entry' : 'Add fitness entry'}
      fields={formDefs.fitness}
    />
  );
}
