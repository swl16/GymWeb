import EntityForm from '@/features/forms/EntityForm';
import { formDefs } from '@/features/forms/field-definitions';
/** TRAINER FORM UI: staff enter ERD trainer contact fields; staff set the initial password; trainer can change it after sign-in. */
export default function TrainerForm() {
  return (
    <EntityForm
      form="trainer"
      title="Add trainer"
      description="Set an initial password for the trainer. They can change it from My profile after signing in."
      fields={formDefs.trainer}
      submitLabel="Add trainer"
    />
  );
}
