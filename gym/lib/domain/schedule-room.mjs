/** Room is a field on ClassSchedule, not a separate table/entity. */
export const ROOM_NUMBERS = Array.from({ length: 10 }, (_, i) => String(i + 1));
/** Accept existing numeric labels during migration; named legacy studios require explicit assignment. */
export function roomNumber(value) {
  const text = String(value ?? '').trim();
  if (!/^(?:room\s*)?(?:0?[1-9]|10)$/i.test(text)) return null;
  return Number(text.replace(/\D/g, ''));
}
/** Preserve local schedules when removing the former Room lookup/FK. */
export function withScheduleRooms(data) {
  const { rooms, ...rest } = data;
  return {
    ...rest,
    class_schedules: (data.class_schedules || []).map((c) => {
      const { room_id, ...schedule } = c;
      const number = roomNumber(room_id ?? c.room);
      return { ...schedule, ...(number ? { room: String(number) } : {}) };
    }),
  };
}
