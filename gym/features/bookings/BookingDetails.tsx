'use client';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { useGym } from '@/features/app/GymProvider';
import BookingQrPass from '@/features/attendance/BookingQrPass';
import { date, time } from '@/lib/domain/format';
import { CalendarDays, Clock, MapPin, User } from 'lucide-react';
/** BOOKING DETAILS UI: complete session information and the owner's server-issued QR pass. */
export default function BookingDetails({ bookingId }: { bookingId: string }) {
  const { data, user, open, getBookingPass } = useGym();
  const booking = data.class_bookings.find((b) => b.id === bookingId),
    schedule = data.class_schedules.find((c) => c.id === booking?.schedule_id);
  const confirmed = booking?.status === 'Booked' && booking.user_id === user?.id;
  if (!booking || !schedule)
    return (
      <>
        <h2>Booking unavailable</h2>
        <p>This schedule has been removed.</p>
      </>
    );
  return (
    <div className="booking-details">
      <div className="eyebrow">PULSE / YOUR BOOKING</div>
      <h2>{schedule.name}</h2>
      <Badge status={booking.status} />
      <dl className="booking-info">
        <div>
          <dt>
            <CalendarDays size={15} />
            Date
          </dt>
          <dd>{date(schedule.starts_at)}</dd>
        </div>
        <div>
          <dt>
            <Clock size={15} />
            Time
          </dt>
          <dd>
            {time(schedule.starts_at)} – {time(schedule.ends_at)}
          </dd>
        </div>
        <div>
          <dt>
            <MapPin size={15} />
            Room
          </dt>
          <dd>{schedule.room}</dd>
        </div>
        <div>
          <dt>
            <User size={15} />
            Trainer
          </dt>
          <dd>{schedule.trainer}</dd>
        </div>
        <div>
          <dt>Booking reference</dt>
          <dd>{booking.id}</dd>
        </div>
        <div>
          <dt>Attendance</dt>
          <dd>{booking.attended ? 'Attended' : 'Not checked in'}</dd>
        </div>
      </dl>
      {confirmed ? (
        <BookingQrPass bookingId={bookingId} />
      ) : booking.status === 'Pending' ? (
        <div className="notice">
          Complete payment to receive your attendance QR code.
          <Button
            variant="text"
            onClick={() =>
              open('purchase-review', { payment_type: 'Class', target_id: booking.id })
            }
          >
            Pay invoice
          </Button>
        </div>
      ) : (
        <div className="notice">
          Attendance passes are available only for confirmed bookings.
        </div>
      )}
    </div>
  );
}
