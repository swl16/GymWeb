'use client';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { table } from '@/components/ui/DataTable';
import { useGym } from '@/features/app/GymProvider';
import { date, time } from '@/lib/domain/format';
import BookingQrPass from './BookingQrPass';
/** ATTENDANCE WORKSPACE UI: visit history, per-booking QR passes and explicit check-in/out actions. */
export default function AttendancePage() {
  const { data, user, ops, visits, checked, busy, act, nameOf } = useGym();
  const confirmed = data.class_bookings.filter(
    (b) => b.user_id === user?.id && b.status === 'Booked',
  );
  const rows = ops ? data.gym_attendance : visits;
  return (
    <>
      {!ops && (
        <section className="panel mb">
          <div className="panel-heading">
            <div>
              <h2>Your gym visit</h2>
              <p>
                Use this for a general gym visit. Class attendance is recorded with its
                booking below.
              </p>
            </div>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() =>
                act(
                  checked ? 'check_out' : 'check_in',
                  {},
                  checked ? 'Checked out.' : 'Checked in.',
                )
              }
            >
              {checked ? 'Check out' : 'Check in'}
            </Button>
          </div>
        </section>
      )}
      {!ops && (
        <>
          <div className="section-title">
            <div>
              <h2>Class attendance passes</h2>
              <p>
                Check-in opens 30 minutes before class and closes one hour after it ends.
                Checkout remains available for an open visit.
              </p>
            </div>
          </div>
          {!confirmed.length && (
            <div className="panel mb">
              No confirmed class bookings yet. Complete a booking’s payment to receive its
              QR pass.
            </div>
          )}
          <div className="attendance-grid">
            {confirmed.map((b) => {
              const c = data.class_schedules.find((s) => s.id === b.schedule_id);
              if (!c) return null;
              const visit = data.gym_attendance.find((v) => v.booking_id === b.id),
                openVisit = visit && !visit.check_out;
              const inWindow =
                Date.now() >= Date.parse(c.starts_at) - 1800000 &&
                Date.now() <= Date.parse(c.ends_at) + 3600000 &&
                c.status === 'Active';
              return (
                <article className="panel attendance-card" key={b.id}>
                  <h2>{c.name}</h2>
                  <p>
                    {date(c.starts_at)} · {time(c.starts_at)} – {time(c.ends_at)} ·{' '}
                    {c.room}
                  </p>
                  <Badge
                    status={
                      visit?.check_out
                        ? 'Checked out'
                        : openVisit
                          ? 'Checked in'
                          : 'Not checked in'
                    }
                  />
                  <BookingQrPass bookingId={b.id} />
                  <div className="actions">
                    <Button
                      variant="primary"
                      disabled={busy || Boolean(visit) || !inWindow}
                      onClick={() =>
                        act(
                          'booking_attendance',
                          { id: b.id, direction: 'in' },
                          'Class check-in recorded.',
                        )
                      }
                    >
                      Check in
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={busy || !openVisit}
                      onClick={() =>
                        act(
                          'booking_attendance',
                          { id: b.id, direction: 'out' },
                          'Class check-out recorded.',
                        )
                      }
                    >
                      Check out
                    </Button>
                  </div>
                  {!visit && !inWindow && (
                    <p className="attendance-help">
                      Check-in is unavailable outside this session’s attendance window.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
      <section className="panel">
        <div className="panel-heading">
          <h2>Attendance history</h2>
        </div>
        {table(
          [
            ...(ops ? ['Member'] : []),
            'Type',
            'Class / visit',
            'Date',
            'Check-in',
            'Check-out',
          ],
          rows.map((a) => [
            ...(ops ? [nameOf(a.user_id)] : []),
            a.attendance_type || (a.booking_id ? 'Class' : 'Gym'),
            data.class_schedules.find(
              (c) =>
                c.id ===
                data.class_bookings.find((b) => b.id === a.booking_id)?.schedule_id,
            )?.name || 'Gym visit',
            date(a.check_in),
            time(a.check_in),
            a.check_out ? time(a.check_out) : <Badge status="Checked in" />,
          ]),
          'No attendance recorded yet.',
        )}
      </section>
    </>
  );
}
