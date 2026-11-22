/** Malaysia calendar week (Monday inclusive to following Monday exclusive). */
export function workoutWeek(logs, today) {
  const date = new Date(today + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  const start = date.toISOString().slice(0, 10);
  date.setUTCDate(date.getUTCDate() + 7);
  const end = date.toISOString().slice(0, 10);
  return {
    start,
    end,
    duration: logs
      .filter((l) => l.log_date >= start && l.log_date < end)
      .reduce((sum, l) => sum + Number(l.duration || 0), 0),
  };
}
/** @returns {Record<string,string>} */
export function validateWeeklyTarget(p) {
  return p.weekly_target_minutes === '' ||
    p.weekly_target_minutes == null ||
    !Number.isInteger(Number(p.weekly_target_minutes)) ||
    Number(p.weekly_target_minutes) < 1 ||
    Number(p.weekly_target_minutes) > 10080
    ? { weekly_target_minutes: 'Enter a whole weekly target from 1 to 10080 minutes.' }
    : {};
}
