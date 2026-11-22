'use client';
import { table } from '@/components/ui/DataTable';
import { useGym } from '@/features/app/GymProvider';
/** TRAINER DIRECTORY UI: staff-maintained Trainer entity from the supplied ERD. */
export default function TrainersPage() {
  const { data } = useGym();
  return (
    <section className="panel">
      {table(
        ['Trainer ID / username', 'Trainer name', 'Gender', 'Phone', 'Email'],
        data.trainers.map((t) => [
          <>
            <b>{t.username}</b>
            <small>{t.trainer_id}</small>
          </>,
          t.trainer_name,
          t.gender,
          t.phone_no,
          t.email,
        ]),
        'No trainers yet. Add a trainer to get started.',
      )}
    </section>
  );
}
