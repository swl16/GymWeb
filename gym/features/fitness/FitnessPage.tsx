'use client';
import Button from '@/components/ui/Button';
import { table } from '@/components/ui/DataTable';
import { stat } from '@/components/ui/StatCard';
import { useGym } from '@/features/app/GymProvider';
import WorkoutChart from './WorkoutChart';
import { bmiCategory } from '@/lib/domain/bmi.mjs';
import { workoutWeek } from '@/lib/domain/fitness.mjs';
import { date } from '@/lib/domain/format';
import { ageFromDob, klNow } from '@/lib/validation.mjs';
import { Activity, Flame, Target, TrendingUp } from 'lucide-react';
/** FITNESS WORKSPACE: current profile measurements, this week's duration and editable weekly target. */
export default function FitnessPage() {
  const { open, confirm, logs, user, busy } = useGym();
  const weight = user?.weight,
    height = user?.height;
  const bmi = weight && height ? Number(weight) / Number(height) ** 2 : null;
  const week = workoutWeek(logs, klNow().slice(0, 10));
  const target = user?.weekly_target_minutes;
  const percent = target ? Math.min(100, Math.round((week.duration / target) * 100)) : 0;
  return (
    <>
      <div className="stats-grid fitness-stats">
        <div className="fitness-stat-with-action">
          {stat(
            'Current weight',
            weight ? weight + ' kg' : 'Not set',
            height ? 'Height: ' + height + ' m' : 'Add your current height',
            TrendingUp,
          )}
          <Button
            className="text-button"
            onClick={() =>
              open('measurements', { weight: weight ?? '', height: height ?? '' })
            }
          >
            Edit weight & height
          </Button>
        </div>
        {stat(
          'Current BMI',
          bmi ? bmi.toFixed(1) : '—',
          bmi
            ? bmiCategory(
                Number(weight),
                Number(height),
                ageFromDob(user?.date_of_birth),
                user,
              )
            : 'Add your current weight and height',
          Activity,
          'green',
        )}
        {stat(
          'Current workout duration',
          week.duration + ' min',
          'This week · Monday–Sunday (MYT)',
          Flame,
          'orange',
        )}
        <div className="fitness-stat-with-action">
          {stat(
            'Weekly target',
            target ? target + ' min' : 'Not set',
            target
              ? `${week.duration} / ${target} min · ${percent}% achieved`
              : 'Set your own weekly goal',
            Target,
          )}
          {target && (
            <progress
              className="fitness-progress"
              max={target}
              value={Math.min(week.duration, target)}
              aria-label="Weekly workout target progress"
            />
          )}
          <Button
            className="text-button"
            onClick={() => open('weekly-target', { weekly_target_minutes: target ?? '' })}
          >
            {target ? 'Edit weekly target' : 'Set weekly target'}
          </Button>
        </div>
      </div>
      <section className="panel mb">
        <div className="panel-heading">
          <div>
            <h2>Your workout rhythm</h2>
            <p>Minutes invested in your wellbeing</p>
          </div>
          <Target size={20} />
        </div>
        <WorkoutChart logs={logs} />
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h2>Fitness log</h2>
          <span className="muted">Your workout goals and duration</span>
        </div>
        {table(
          ['Date / goal', 'Duration', 'Weekly target at entry', 'Actions'],
          logs.map((l: any) => [
            <>
              {date(l.log_date)}
              <small>{l.goal}</small>
            </>,
            l.duration + ' min',
            l.target_duration ? l.target_duration + ' min' : 'Not set',
            <div className="actions">
              <Button
                className="text-button"
                onClick={() =>
                  open('fitness', { id: l.id, goal: l.goal, duration: l.duration })
                }
              >
                Edit
              </Button>
              <Button
                className="text-button"
                disabled={busy}
                onClick={() =>
                  confirm(
                    'reset_fitness',
                    { id: l.id },
                    'Reset workout duration?',
                    'Set this entry’s duration to 0 minutes. Its goal and saved measurement history will stay unchanged.',
                  )
                }
              >
                Reset duration
              </Button>
              <Button
                className="danger-link"
                disabled={busy}
                onClick={() =>
                  confirm(
                    'delete_fitness',
                    { id: l.id },
                    'Delete fitness log?',
                    'This permanently deletes this workout entry and removes its duration from your weekly progress. Select Yes to confirm.',
                  )
                }
              >
                Delete
              </Button>
            </div>,
          ]),
        )}
      </section>
    </>
  );
}
