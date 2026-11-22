export const MINIMUM_REGISTRATION_AGE = 18;
/** Latest eligible birth date, clamping leap-day subtraction in Malaysia's calendar. */
export function latestRegistrationDob(
  today = new Date()
    .toLocaleString('sv-SE', { timeZone: 'Asia/Kuala_Lumpur' })
    .slice(0, 10),
) {
  const [year, month, day] = today.split('-').map(Number);
  const targetYear = year - MINIMUM_REGISTRATION_AGE;
  const lastDay = new Date(Date.UTC(targetYear, month, 0)).getUTCDate();
  return `${targetYear}-${String(month).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
}
