'use client';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { stat } from '@/components/ui/StatCard';
import { useGym } from '@/features/app/GymProvider';
import ClassCard from '@/features/classes/ClassCard';
import WorkoutChart from '@/features/fitness/WorkoutChart';
import { date } from '@/lib/domain/format';
import { klNow } from '@/lib/validation.mjs';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  Dumbbell,
  Flame,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
/** OverviewPage UI: one screen per file; shared state is accessed through useGym. */
export default function OverviewPage() {
  const {
    data,
    user,
    session,
    busy,
    filter,
    act,
    staff,
    trainer,
    subscriptions,
    bookings,
    logs,
    visits,
    payments,
    activeSub,
    plan,
    upcoming,
    latest,
    checked,
    title,
    navigate,
  } = useGym();
  const classCard = (c: any) => <ClassCard key={c.id} schedule={c} />;
  return (
    !trainer && (
      <>
        <section className="hero">
          <div className="hero-copy">
            <div className="hero-kicker">
              <span /> SHOW UP FOR YOURSELF
            </div>
            <h2>
              Your only limit?
              <br />
              The one you set.
            </h2>
            <p>
              New goals. Fresh energy. Same commitment.
              <br />
              Make your next session count.
            </p>
            <Button className="primary" onClick={() => navigate('classes')}>
              {staff ? 'Manage class schedules' : 'Explore classes'}
              <ArrowUpRight size={17} />
            </Button>
          </div>
          <div className="hero-stamp">
            <span>BE STRONGER</span>
            <Activity size={28} />
            <span>THAN YESTERDAY</span>
          </div>
          <div className="hero-pagination">
            <i />
            <i />
            <i />
          </div>
        </section>
        <div className="stats-grid">
          {staff ? (
            <>
              {stat(
                'Total members',
                data.profiles.filter((x: any) => x.role === 'member').length,
                'Your growing fitness community',
                Users,
              )}
              {stat(
                'Active subscriptions',
                data.user_subscriptions.filter(
                  (s: any) =>
                    s.status === 'Active' &&
                    s.start_date <= klNow().slice(0, 10) &&
                    s.end_date > klNow().slice(0, 10),
                ).length,
                'Memberships in good standing',
                ShieldCheck,
                'green',
              )}
              {stat(
                'Upcoming classes',
                upcoming.length,
                'Ready for your members',
                CalendarDays,
                'purple',
              )}
              {stat(
                'Pending payments',
                data.payments.filter((x: any) => x.status === 'Pending').length,
                'Awaiting front desk review',
                Wallet,
                'orange',
              )}
            </>
          ) : (
            <>
              {stat(
                'Gym visits',
                visits.length,
                'Every visit is a step forward',
                Dumbbell,
              )}
              {stat(
                'Workout minutes',
                logs.reduce((s: number, l: any) => s + l.duration, 0),
                'Total time invested in yourself',
                Flame,
                'orange',
              )}
              {stat(
                'Classes booked',
                bookings.filter((b: any) => b.status === 'Booked').length,
                'Your next challenge is waiting',
                CalendarDays,
                'purple',
              )}
              {stat(
                'Current weight',
                user?.weight ? `${user.weight} kg` : '—',
                'Edit your current measurements in Fitness tracker',
                TrendingUp,
                'green',
              )}
            </>
          )}
        </div>
        <div className="overview-columns">
          <section className="panel activity-panel">
            <div className="panel-heading">
              <div>
                <h2>{staff ? 'Class popularity' : 'Your workout rhythm'}</h2>
                <p>
                  {staff ? 'Confirmed bookings by class' : 'Small steps. Real progress.'}
                </p>
              </div>
              <span className="soft-pill">
                {staff ? 'All classes' : 'Recent logs'}
                <ChevronDown size={12} />
              </span>
            </div>
            {staff ? (
              <div className="bar-chart">
                {data.class_schedules.map((c: any) => (
                  <div key={c.id}>
                    <span>{c.name}</span>
                    <div>
                      <i
                        style={{
                          width:
                            Math.max(
                              3,
                              (data.class_bookings.filter(
                                (b: any) =>
                                  b.schedule_id === c.id && b.status === 'Booked',
                              ).length /
                                c.capacity) *
                                100,
                            ) + '%',
                        }}
                      />
                    </div>
                    <b>
                      {
                        data.class_bookings.filter(
                          (b: any) => b.schedule_id === c.id && b.status === 'Booked',
                        ).length
                      }
                    </b>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="chart-summary">
                  <strong>
                    {logs.reduce((s: number, l: any) => s + l.duration, 0)}
                    <span>min</span>
                  </strong>
                  <span className="chart-key">
                    <i />
                    Workout duration
                  </span>
                </div>
                <WorkoutChart logs={logs} />
              </>
            )}
          </section>
          <section className="membership-card">
            <div className="panel-heading">
              <h2>{staff ? 'Front desk' : 'Your membership'}</h2>
              <ShieldCheck size={20} />
            </div>
            <div className="membership-kicker">
              {staff
                ? 'KEEP YOUR GYM MOVING'
                : activeSub
                  ? 'YOU’RE PART OF THE CLUB'
                  : 'MAKE YOURSELF A PRIORITY'}
            </div>
            <h3>
              {staff ? 'Ready when you are.' : plan?.name || 'Find your fit.'}
              <ArrowUpRight size={26} />
            </h3>
            <div className="membership-divider" />
            {staff ? (
              <>
                <p>
                  Review cash payments, manage your schedule and welcome your members.
                </p>
                <Button
                  className="membership-button"
                  onClick={() => navigate('payments')}
                >
                  Review payments
                  <ArrowRight size={16} />
                </Button>
              </>
            ) : (
              <>
                <div className="membership-details">
                  <span>Membership status</span>
                  <Badge status={activeSub ? 'Active' : 'No plan'} />
                  <span>Valid until</span>
                  <b>{activeSub ? date(activeSub.end_date) : 'Start today'}</b>
                </div>
                <Button
                  className="membership-button"
                  onClick={() => navigate('memberships')}
                >
                  Manage membership
                  <ArrowRight size={16} />
                </Button>
              </>
            )}
          </section>
        </div>
        {/* MEMBER CLASS DISCOVERY: staff manage sessions in Class schedules. */}
        {!staff && (
          <>
            <div className="section-title">
              <div>
                <h2>Find your next session</h2>
                <p>Good energy. Great coaches. Your kind of workout.</p>
              </div>
              <Button className="text-button" onClick={() => navigate('classes')}>
                View all classes
                <ArrowRight size={15} />
              </Button>
            </div>
            <div className="class-grid">{upcoming.slice(0, 3).map(classCard)}</div>
          </>
        )}
      </>
    )
  );
}
