'use client';
import Button from '@/components/ui/Button';
import { table } from '@/components/ui/DataTable';
import { stat } from '@/components/ui/StatCard';
import { useGym } from '@/features/app/GymProvider';
import { date, time } from '@/lib/domain/format';
import { ArrowRight, CalendarDays, CheckCircle2, Users } from 'lucide-react';
/** TrainerDashboard UI: one screen per file; shared state is accessed through useGym. */
export default function TrainerDashboard() {
  const {
    filter,
    staff,
    trainer,
    bookings,
    upcoming,
    trainerClasses,
    trainerBookings,
    navigate,
  } = useGym();
  return (
    trainer && (
      <>
        <div className="stats-grid three">
          {stat(
            'Assigned sessions',
            trainerClasses.filter(
              (c: any) => c.status === 'Active' && new Date(c.ends_at) > new Date(),
            ).length,
            'Your upcoming coaching schedule',
            CalendarDays,
          )}
          {stat(
            'Confirmed members',
            trainerBookings.filter((b: any) => b.status === 'Booked').length,
            'Across your assigned classes',
            Users,
            'green',
          )}
          {stat(
            'Attendance recorded',
            trainerBookings.filter((b: any) => b.attended).length,
            'Members who showed up',
            CheckCircle2,
            'purple',
          )}
        </div>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Your coaching schedule</h2>
              <p>Only sessions assigned to your trainer account appear here.</p>
            </div>
            <Button className="text-button" onClick={() => navigate('bookings')}>
              Class attendance
              <ArrowRight size={15} />
            </Button>
          </div>
          {table(
            ['Class', 'Date & time', 'Room', 'Members'],
            trainerClasses.map((c: any) => [
              <b>{c.name}</b>,
              date(c.starts_at) + ' · ' + time(c.starts_at),
              c.room,
              trainerBookings.filter(
                (b: any) => b.schedule_id === c.id && b.status === 'Booked',
              ).length,
            ]),
            'No sessions assigned yet. Your staff team can assign classes to you.',
          )}
        </section>
      </>
    )
  );
}
