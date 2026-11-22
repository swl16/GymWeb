import {
  validateTrainer,
  validateTrainerCreation,
} from "../domain/trainer-validation.mjs";
/** Staff shares the ERD contact fields and credential rules with Trainer. */
export function validateStaffCreation(input) {
  const errors = validateTrainerCreation(input);
  if (errors.name) errors.name = "Enter the staff name (up to 100 characters).";
  return errors;
}
/** Allowlist fields; request-supplied roles/admin flags are deliberately excluded. */
export function staffAuthAttributes(input) {
  return {
    email: input.email.trim(),
    password: input.password,
    email_confirm: true,
    app_metadata: { role: "staff" },
    user_metadata: {
      username: input.username.toLowerCase(),
      name: input.name.trim(),
      gender: input.gender,
      phone: input.phone,
    },
  };
}

/** Editing contact information never resets a staff password or changes their role. */
export function validateStaffUpdate(input) {
  const errors = validateTrainer(input);
  if (errors.name) errors.name = "Enter the staff name (up to 100 characters).";
  return errors;
}
