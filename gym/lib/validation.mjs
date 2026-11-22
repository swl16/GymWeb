import { MINIMUM_REGISTRATION_AGE } from './domain/registration-age.mjs';
import { passwordError } from './domain/password.mjs';
export function ageFromDob(
  value,
  today = new Date()
    .toLocaleString('sv-SE', { timeZone: 'Asia/Kuala_Lumpur' })
    .slice(0, 10),
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const d = new Date(value + 'T00:00:00Z');
  if (!Number.isFinite(+d) || d.toISOString().slice(0, 10) !== value || value > today)
    return null;
  const [y, m, day] = today.split('-').map(Number),
    [by, bm, bd] = value.split('-').map(Number);
  return y - by - (m < bm || (m === bm && day < bd) ? 1 : 0);
}
/** @returns {Record<string,string>} */
export function validateMeasurements(p) {
  const errors = {};
  for (const [key, min, max, unit] of [
    ['height', 1.3, 2.5, 'meters'],
    ['weight', 30, 300, 'kg'],
  ]) {
    if (
      p[key] !== undefined &&
      p[key] !== null &&
      p[key] !== '' &&
      (!Number.isFinite(Number(p[key])) || Number(p[key]) <= min || Number(p[key]) >= max)
    )
      errors[key] =
        `Enter ${key} greater than ${key === 'height' ? min.toFixed(2) : min} and less than ${key === 'height' ? max.toFixed(2) : max} ${unit}.`;
  }
  return errors;
}
/** @returns {Record<string,string>} */
export function validateRegistration(
  p,
  { minimumAge = MINIMUM_REGISTRATION_AGE, today = undefined } = {},
) {
  const e = {};
  if (!/^[A-Za-z0-9]{3,11}$/.test(p.username || ''))
    e.username = 'Use 3–11 letters or numbers only.';
  const credentialError = passwordError(p.password);
  if (credentialError) e.password = credentialError;
  if (!(p.name || '').trim() || p.name.length > 100)
    e.name = 'Enter your name (up to 100 characters).';
  if (!['M', 'F'].includes(p.gender)) e.gender = 'Select M or F.';
  const age = ageFromDob(p.date_of_birth, today);
  if (age === null || age < 1 || age > 120)
    e.date_of_birth = 'Enter a valid date of birth (age up to 120).';
  else if (age < minimumAge)
    e.date_of_birth = `You must be at least ${minimumAge} years old to register.`;
  if (p.date_of_birth > '2008-12-31')
    e.date_of_birth =
      'Birth year must be 2008 or earlier; registration also requires age 18.';
  Object.assign(e, validateMeasurements(p));
  if (!/^01\d{8,9}$/.test(p.phone || ''))
    e.phone = 'Enter a 10–11 digit Malaysian phone number starting with 01.';
  if (
    (p.email || '').length > 100 ||
    !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/i.test(p.email || '')
  )
    e.email = 'Enter a valid @gmail.com address (up to 100 characters).';
  return e;
}
export function addMonths(date, months) {
  const d = new Date(date + 'T00:00:00Z');
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + Number(months));
  const last = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0),
  ).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}
export const money = (n) =>
  new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(
    Number(n) || 0,
  );
export const klNow = () =>
  new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kuala_Lumpur' });
