'use client';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { table } from '@/components/ui/DataTable';
import { useGym } from '@/features/app/GymProvider';
import { date, time } from '@/lib/domain/format';
import { money } from '@/lib/validation.mjs';
import { Clock } from 'lucide-react';
/** BookingsPage UI: one screen per file; shared state is accessed through useGym. */
export default function BookingsPage() {
  const {
    data,
    session,
    busy,
    act,
    confirm,
    staff,
    trainer,
    ops,
    nameOf,
    bookings,
    visits,
    payments,
    checked,
    trainerBookings,
    open,
  } = useGym();
  return (
    <>
      <section className="panel">
        {table(
          ops
            ? ['Member', 'Class', 'Session', 'Status', 'Attendance']
            : ['Class', 'Session', 'Fee', 'Status', 'Action'],
          (trainer ? trainerBookings : staff ? data.class_bookings : bookings).map(
            (b: any) => {
              const c = data.class_schedules.find((c: any) => c.id === b.schedule_id);
              return ops
                ? [
                    nameOf(b.user_id),
                    <Button variant="text" onClick={() => open('booking', { id: b.id })}>
                      {c?.name || 'Deleted class'}
                    </Button>,
                    c ? date(c.starts_at) + ' · ' + time(c.starts_at) : '—',
                    <Badge status={b.status} />,
                    <Button
                      className="secondary small"
                      disabled={b.attended || b.status !== 'Booked' || busy}
                      onClick={() =>
                        act('mark_attendance', { id: b.id }, 'Attendance recorded.')
                      }
                    >
                      {b.attended ? 'Attended' : 'Mark attended'}
                    </Button>,
                  ]
                : [
                    <b>
                      {
                        <Button
                          variant="text"
                          onClick={() => open('booking', { id: b.id })}
                        >
                          {c?.name || 'Deleted class'}
                        </Button>
                      }
                    </b>,
                    c ? date(c.starts_at) + ' · ' + time(c.starts_at) : '—',
                    money(c?.fee),
                    <Badge status={b.status} />,
                    ['Booked', 'Pending'].includes(b.status) ? (
                      <div className="actions">
                        {b.status === 'Pending' && (
                          <Button
                            variant="text"
                            onClick={() =>
                              open('purchase-review', {
                                payment_type: 'Class',
                                target_id: b.id,
                              })
                            }
                          >
                            Continue to payment
                          </Button>
                        )}
                        <Button
                          className="danger-link"
                          onClick={() =>
                            confirm(
                              'cancel_booking',
                              { id: b.id },
                              'Cancel your booking?',
                              'Cancellation is available at least 24 hours before the session. Verified payments remain in your history; contact the front desk about a refund.',
                            )
                          }
                        >
                          Cancel booking
                        </Button>
                      </div>
                    ) : (
                      '—'
                    ),
                  ];
            },
          ),
          'No bookings yet. Explore classes to find your first session.',
        )}
      </section>
      <div className="notice">
        <Clock size={16} />
        Unpaid reservations can be cancelled before the session starts. Confirmed bookings
        require 24 hours notice. Open Attendance for QR passes and check-in/check-out.
      </div>
    </>
  );
}
