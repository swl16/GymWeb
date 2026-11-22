import { passwordError } from './password.mjs';
/** ERD trainer contact validation; creation also requires a staff-selected password. */
/** @returns {Record<string,string>} */
export function validateTrainer(p) {
  const errors = {};
  if (typeof p.username !== 'string' || !/^[A-Za-z0-9]{3,11}$/.test(p.username))
    errors.username = 'Use 3–11 letters or numbers.';
  if (typeof p.name !== 'string' || !p.name.trim() || p.name.length > 100)
    errors.name = 'Enter the trainer name (up to 100 characters).';
  if (!['M', 'F'].includes(p.gender)) errors.gender = 'Select M or F.';
  if (typeof p.phone !== 'string' || !/^01\d{8,9}$/.test(p.phone))
    errors.phone = 'Enter a 10–11 digit Malaysian phone number starting with 01.';
  if (
    typeof p.email !== 'string' ||
    !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/i.test(p.email)
  )
    errors.email = 'Enter a valid @gmail.com address (up to 100 characters).';
  return errors;
}

/** Creation-only password rule; profile edits do not change credentials. */
export function validateTrainerCreation(input) {
  const errors = validateTrainer(input);
  const error = passwordError(input.password);
  if (error) errors.password = error;
  return errors;
}
