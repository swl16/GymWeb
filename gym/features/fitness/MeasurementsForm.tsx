'use client';
import EntityForm from '@/features/forms/EntityForm';
import { formDefs } from '@/features/forms/field-definitions';
/** CURRENT BODY MEASUREMENTS: changes the member profile, preserving historical workout snapshots. */
export default function MeasurementsForm() {
  return (
    <EntityForm
      form="measurements"
      title="Edit current weight and height"
      description="Used for your current BMI. Past workout entries stay unchanged."
      fields={formDefs.measurements}
    />
  );
}
