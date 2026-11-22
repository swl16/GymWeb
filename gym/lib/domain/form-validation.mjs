import { roomNumber } from './schedule-room.mjs';
import { validateMeasurements } from '../validation.mjs';
export function malaysiaTimestamp(value) {
  if (!value) return NaN;
  return Date.parse(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) ? value + ':00+08:00' : value,
  );
}
/** Every field receives its own actionable validation error, on client and server. */
/** @returns {Record<string,string>} */
export function validateSchedule(p, data, now = Date.now()) {
  const errors = {};
  if (!data.class_types.some((c) => c.id === p.class_id && !c.archived))
    errors.class_id =
      'Select an available class type. Create one first if the list is empty.';
  if (!data.trainers.some((t) => t.trainer_id === p.trainer_id))
    errors.trainer_id =
      'Select a trainer account. Staff must add the trainer before scheduling.';
  const selectedRoom = roomNumber(p.room);
  if (!selectedRoom) errors.room = 'Select a room from 1 to 10.';
  const start = malaysiaTimestamp(p.starts_at),
    end = malaysiaTimestamp(p.ends_at);
  if (!Number.isFinite(start))
    errors.starts_at = 'Choose a valid start date and time in Malaysia time.';
  else if (start <= now)
    errors.starts_at =
      'Start time must be in the future. Past dates and times are unavailable.';
  if (!Number.isFinite(end))
    errors.ends_at = 'Choose a valid end date and time in Malaysia time.';
  else if (Number.isFinite(start) && end <= start)
    errors.ends_at = 'End time must be later than the start time.';
  if (p.fee === '' || p.fee == null || !Number.isFinite(+p.fee) || +p.fee < 0)
    errors.fee = 'Enter a fee of RM0.00 or more. Use 0 for a free class.';
  if (!Number.isInteger(+p.capacity) || +p.capacity < 1)
    errors.capacity = 'Enter a whole-number capacity of at least 1.';
  const reserved = (data.class_bookings || []).filter(
    (b) => b.schedule_id === p.id && ['Pending', 'Booked'].includes(b.status),
  ).length;
  if (+p.capacity < reserved)
    errors.capacity = `Capacity cannot be below the ${reserved} reserved slots.`;
  if (!['Active', 'Cancelled'].includes(p.status))
    errors.status = 'Choose Active or Cancelled.';
  if (p.status === 'Active' && Number.isFinite(start) && end > start) {
    for (const c of data.class_schedules || []) {
      if (
        c.id === p.id ||
        c.status !== 'Active' ||
        start >= Date.parse(c.ends_at) ||
        end <= Date.parse(c.starts_at)
      )
        continue;
      if (selectedRoom && selectedRoom === roomNumber(c.room))
        errors.room = `This room overlaps “${c.name}”. Choose another room or time.`;
      if (p.trainer_id === c.trainer_id)
        errors.trainer_id = `This trainer is assigned to “${c.name}” at that time. Choose another trainer or time.`;
    }
  }
  return errors;
}
/** @returns {Record<string,string>} */
export function validateFitness(p) {
  const errors = validateMeasurements(p);
  if (!p.goal?.trim()) errors.goal = 'Enter your fitness goal.';
  if (
    p.duration === '' ||
    p.duration == null ||
    !Number.isInteger(+p.duration) ||
    +p.duration < 0 ||
    +p.duration > 1440
  )
    errors.duration = 'Enter a whole workout duration from 0 to 1440 minutes.';
  return errors;
}

/** Native date picker minimum: next Malaysia minute, or a later end after selected start. */
export function scheduleMinimum(field, start, now = Date.now()) {
  const startMillis = malaysiaTimestamp(start);
  const minimum =
    field === 'ends_at' && Number.isFinite(startMillis)
      ? Math.max(now + 60000, startMillis + 60000)
      : now + 60000;
  return new Date(minimum)
    .toLocaleString('sv-SE', { timeZone: 'Asia/Kuala_Lumpur' })
    .replace(' ', 'T')
    .slice(0, 16);
}
