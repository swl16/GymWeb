'use client';
import ClassPicture from '@/components/ui/ClassPicture';
import Button from '@/components/ui/Button';
import { useGym } from '@/features/app/GymProvider';
import { date, time } from '@/lib/domain/format';
import { money } from '@/lib/validation.mjs';
import { ArrowUpRight, CalendarDays, Users } from 'lucide-react';

/** CLASS CARD UI: photo, schedule, availability and booking action. */
export default function ClassCard({ schedule: c }: { schedule: any }) {
  const { data, busy, open, purchase, trainer, bookings } = useGym();
  const b = bookings.find(
      (b: any) => b.schedule_id === c.id && ['Booked', 'Pending'].includes(b.status),
    ),
    filled = Number(
      data.class_availability?.find((a: any) => a.schedule_id === c.id)?.reserved ??
        data.class_bookings.filter(
          (b: any) => b.schedule_id === c.id && ['Booked', 'Pending'].includes(b.status),
        ).length,
    );
  return (
    <article className="class-card" key={c.id}>
      <div className="class-photo">
        <ClassPicture
          name={c.name}
          imagePath={data.class_types.find((t) => t.id === c.class_id)?.image_path}
        />
        <span className="photo-tag">
          {c.name.includes('Yoga')
            ? 'MIND & BODY'
            : c.name.includes('HIIT')
              ? 'HIGH INTENSITY'
              : 'STRENGTH'}
        </span>
        <span className="photo-price">{money(c.fee)}</span>
      </div>
      <div className="class-body">
        <div className="class-date">
          <CalendarDays size={13} />
          {date(c.starts_at, {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
          <span>•</span>
          {time(c.starts_at)}
        </div>
        <h3>{c.name}</h3>
        <p>with {c.trainer}</p>
        <div className="class-bottom">
          <span>
            <Users size={14} />
            {Math.max(0, c.capacity - filled)} spots left
          </span>
          <Button
            disabled={busy || b?.status === 'Booked' || (!b && filled >= c.capacity)}
            className={b?.status === 'Booked' ? 'text-button muted' : 'text-button'}
            onClick={() =>
              b
                ? open('purchase-review', { payment_type: 'Class', target_id: b.id })
                : purchase('book', { schedule_id: c.id })
            }
          >
            {b?.status === 'Booked'
              ? 'Booked'
              : b
                ? 'Book class'
                : filled >= c.capacity
                  ? 'Full'
                  : 'Book class'}
            {!b && <ArrowUpRight size={15} />}
          </Button>
        </div>
      </div>
    </article>
  );
}
