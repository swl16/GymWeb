'use client';
import { useGym } from '@/features/app/GymProvider';
import EntityForm from '@/features/forms/EntityForm';
import { formDefs } from '@/features/forms/field-definitions';
/** CLASS SCHEDULE FORM UI: labels and limits are defined in field-definitions.ts. */
export default function ClassForm() {
  const { values } = useGym();
  return (
    <EntityForm
      form="class"
      title={values.id ? 'Edit class schedule' : 'Add class schedule'}
      fields={formDefs.class}
    />
  );
}
