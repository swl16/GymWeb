'use client';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { table } from '@/components/ui/DataTable';
import { useGym } from '@/features/app/GymProvider';
import ClassCard from '@/features/classes/ClassCard';
import { date, time } from '@/lib/domain/format';
import { money } from '@/lib/validation.mjs';
import { Pencil, Trash2 } from 'lucide-react';
import ClassTypesPanel from './ClassTypesPanel';
/** ClassesPage UI: one screen per file; shared state is accessed through useGym. */
export default function ClassesPage() {
  const {
    data,
    search,
    setSearch,
    filter,
    setFilter,
    open,
    confirm,
    staff,
    trainer,
    bookings,
    upcoming,
    trainerClasses,
  } = useGym();
  const classCard = (c: any) => <ClassCard key={c.id} schedule={c} />;
  return (
    <>
      {staff && <ClassTypesPanel />}
      {trainer ? (
        <section className="panel">
          {table(
            ['Class', 'Date', 'Time', 'Room', 'Status'],
            trainerClasses.map((c: any) => [
              c.name,
              date(c.starts_at),
              time(c.starts_at) + ' – ' + time(c.ends_at),
              c.room,
              <Badge status={c.status} />,
            ]),
            'No sessions assigned yet.',
          )}
        </section>
      ) : staff ? (
        <section className="panel">
          {table(
            [
              'Class / room',
              'Schedule',
              'Trainer',
              'Fee',
              'Capacity',
              'Status',
              'Actions',
            ],
            data.class_schedules
              .filter((c: any) => c.name.toLowerCase().includes(search.toLowerCase()))
              .sort((a: any, b: any) => +new Date(a.starts_at) - +new Date(b.starts_at))
              .map((c: any) => [
                <>
                  <b>{c.name}</b>
                  <small>{c.room}</small>
                </>,
                <>
                  {date(c.starts_at)}
                  <small>
                    {time(c.starts_at)} – {time(c.ends_at)}
                  </small>
                </>,
                c.trainer,
                money(c.fee),
                c.capacity,
                <Badge status={c.status} />,
                <div className="actions">
                  <Button
                    className="icon-button"
                    aria-label={'Edit ' + c.name}
                    onClick={() => open('class', c)}
                  >
                    <Pencil size={15} />
                  </Button>
                  <Button
                    className="icon-button danger-link"
                    disabled={c.status !== 'Cancelled'}
                    aria-label={'Delete ' + c.name}
                    onClick={() =>
                      confirm(
                        'delete_class',
                        { id: c.id },
                        'Delete cancelled schedule?',
                        'This removes the cancelled schedule and its bookings. Payment history is retained.',
                      )
                    }
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>,
              ]),
          )}
        </section>
      ) : (
        <>
          <div className="filter-row">
            <div className="tabs">
              {['All classes', 'Strength', 'Yoga', 'HIIT'].map((t) => (
                <Button
                  className={filter === t ? 'selected' : ''}
                  key={t}
                  onClick={() => setFilter(t)}
                >
                  {t}
                </Button>
              ))}
            </div>
            <input
              className="search"
              placeholder="Search classes or trainers…"
              aria-label="Search classes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="class-grid">
            {upcoming
              .filter(
                (c: any) =>
                  (filter === 'All classes' ||
                    c.name.toLowerCase().includes(filter.toLowerCase())) &&
                  (c.name + ' ' + c.trainer).toLowerCase().includes(search.toLowerCase()),
              )
              .map(classCard)}
          </div>
          {!upcoming.length && <div className="empty">New classes are on their way.</div>}
          <div className="notice">
            Confirm your class choice to reserve a slot, then review the invoice and
            choose a payment method. Cash payments are verified at the front desk.
          </div>
        </>
      )}
    </>
  );
}
