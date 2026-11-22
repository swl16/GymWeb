import { effectiveSubscriptionStatus } from '@/lib/domain/membership.mjs';
import type { GymData, Profile } from '@/lib/domain/models';
import { klNow } from '@/lib/validation.mjs';
import {
  Activity,
  CalendarDays,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';
/** Read-only workspace selectors and role navigation; no network or UI markup. */
export function selectWorkspace(data: GymData, user: Profile | null) {
  const staff = user?.role === 'staff',
    trainer = user?.role === 'trainer',
    ops = staff || trainer,
    own = (rows: any[]) => rows.filter((x: any) => x.user_id === user?.id),
    nameOf = (id: string) =>
      data.profiles.find((p: any) => p.id === id)?.name ||
      data.class_roster?.find((r: any) => r.member_id === id)?.member_name ||
      'Deleted member';
  const subscriptions = data
      ? own(data.user_subscriptions).map((s: any) => ({
          ...s,
          status: effectiveSubscriptionStatus(s, klNow().slice(0, 10)),
        }))
      : [],
    bookings = data ? own(data.class_bookings) : [],
    logs = data
      ? own(data.fitness_logs).sort((a: any, b: any) =>
          a.log_date.localeCompare(b.log_date),
        )
      : [],
    visits = data ? own(data.gym_attendance) : [],
    payments = data ? (staff ? data.payments : own(data.payments)) : [],
    activeSub = subscriptions.find((s: any) => s.status === 'Active'),
    plan =
      activeSub && data.membership_plans.find((p: any) => p.id === activeSub.plan_id),
    upcoming = data
      ? data.class_schedules
          .filter((c: any) => c.status === 'Active' && new Date(c.starts_at) > new Date())
          .sort((a: any, b: any) => +new Date(a.starts_at) - +new Date(b.starts_at))
      : [],
    latest = logs.at(-1),
    checked = visits.some((a: any) => !a.check_out);
  const trainerClasses = data
    ? data.class_schedules.filter((c: any) => c.trainer_id === user?.id)
    : [];
  const trainerBookings = data
    ? data.class_bookings.filter((b: any) =>
        trainerClasses.some((c: any) => c.id === b.schedule_id),
      )
    : [];
  const nav = trainer
    ? [
        ['overview', 'My overview', LayoutDashboard],
        ['classes', 'My schedule', CalendarDays],
        ['bookings', 'Class bookings', Users],
        ['attendance', 'Attendance', CalendarDays],
      ]
    : staff
      ? [
          ['overview', 'Overview', LayoutDashboard],
          ['plans', 'Membership plans', ShieldCheck],
          ['classes', 'Class schedules', CalendarDays],
          ['bookings', 'Bookings', Users],
          ['attendance', 'Attendance', CalendarDays],
          ['payments', 'Payments', CreditCard],
          ['reports', 'Reports', TrendingUp],
          ['members', 'Members', User],
          ['trainers', 'Trainers', Dumbbell],
        ]
      : [
          ['overview', 'Overview', LayoutDashboard],
          ['memberships', 'My membership', ShieldCheck],
          ['classes', 'Explore classes', Dumbbell],
          ['bookings', 'My bookings', CalendarDays],
          ['attendance', 'Attendance', Users],
          ['progress', 'Fitness tracker', Activity],
          ['payments', 'Payments', CreditCard],
        ];
  const title: any = {
    overview: 'Overview',
    attendance: 'Attendance',
    memberships: 'My membership',
    plans: 'Membership plans',
    classes: trainer ? 'My schedule' : staff ? 'Class schedules' : 'Explore classes',
    bookings: trainer
      ? 'Class attendance'
      : staff
        ? 'Bookings & attendance'
        : 'My bookings',
    progress: 'Fitness tracker',
    payments: 'Payments',
    reports: 'Reports & insights',
    members: 'Members',
    trainers: 'Trainers',
    profile: 'My profile',
    settings: 'Preferences',
  };

  return {
    staff,
    trainer,
    ops,
    own,
    nameOf,
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
    trainerClasses,
    trainerBookings,
    nav,
    title,
  };
}
