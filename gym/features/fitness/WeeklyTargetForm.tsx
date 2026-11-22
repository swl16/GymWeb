'use client';
import EntityForm from '@/features/forms/EntityForm';
import { formDefs } from '@/features/forms/field-definitions';
/** WEEKLY TARGET: member-owned goal, measured in minutes per Monday–Sunday week. */
export default function WeeklyTargetForm() {
  return (
    <EntityForm
      form="weekly-target"
      title="Set weekly workout target"
      description="Choose your workout minutes per week. Progress resets each Monday, Malaysia time."
      fields={formDefs['weekly-target']}
    />
  );
}
