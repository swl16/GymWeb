"use client";
import { useGym } from "@/features/app/GymProvider";
import EntityForm from "@/features/forms/EntityForm";
import { formDefs } from "@/features/forms/field-definitions";
/** PROFILE FORM UI: labels and limits are defined in field-definitions.ts. */
export default function ProfileForm() {
  const { values, user } = useGym();
  return (
    <EntityForm
      form="profile"
      title={values.id ? "Edit profile" : "Add profile"}
      fields={formDefs.profile.filter(
        (field) =>
          user?.role === "member" ||
          !["height", "weight", "date_of_birth", "age"].includes(field.key),
      )}
    />
  );
}
