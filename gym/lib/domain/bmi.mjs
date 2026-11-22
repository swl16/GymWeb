import reference from '../data/bmi-for-age.mjs';
/** CDC adult BMI ranges (20+). Unrounded measurements decide the category at boundaries. */
/** @param {number} weight @param {number} height @param {number|null} age
 * @param {{date_of_birth?:string|null,gender?:string,today?:string}|null} profile */
export function bmiCategory(weight, height, age, profile = null) {
  const bmi = Number(weight) / Number(height) ** 2;
  if (!Number.isFinite(bmi) || !(weight > 0) || !(height > 0))
    return 'Add a weight and height to see your category';
  if (age == null) return 'Date of birth needed for an age-appropriate category';
  if (age < 20) {
    if (!profile?.date_of_birth || !['M', 'F'].includes(profile.gender))
      return 'Under 20: BMI-for-age assessment needed';
    const day =
      profile.today ||
      new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Kuala_Lumpur' }).slice(0, 10);
    const dob = new Date(profile.date_of_birth + 'T00:00:00Z'),
      now = new Date(day + 'T00:00:00Z');
    if (!Number.isFinite(+dob) || !Number.isFinite(+now))
      return 'Valid date of birth needed';
    const months =
      (now.getUTCFullYear() - dob.getUTCFullYear()) * 12 +
      now.getUTCMonth() -
      dob.getUTCMonth() +
      (now.getUTCDate() - dob.getUTCDate()) /
        new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate();
    if (months < 24) return 'BMI categories are available from age 2';
    const rows = reference.filter((r) => r[0] === (profile.gender === 'M' ? 1 : 2));
    const high = rows.find((r) => r[1] >= months) || rows.at(-1),
      low = rows.findLast((r) => r[1] <= months) || rows[0];
    const fraction = high[1] === low[1] ? 0 : (months - low[1]) / (high[1] - low[1]);
    const [p5, p85, p95] = [2, 3, 4].map((i) => low[i] + fraction * (high[i] - low[i]));
    if (bmi < p5) return 'Underweight';
    if (bmi < p85) return 'Normal weight';
    if (bmi < p95) return 'Overweight';
    return 'Obesity range';
  }
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obesity range';
}
