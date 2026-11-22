'use client';
import Badge from '@/components/ui/Badge';
import { table } from '@/components/ui/DataTable';
import { stat } from '@/components/ui/StatCard';
import { useGym } from '@/features/app/GymProvider';
import { reportData } from '@/lib/reports/report-data.mjs';
import { money } from '@/lib/validation.mjs';
import { Dumbbell, ShieldCheck, Wallet } from 'lucide-react';
/** REPORT PAGE UI: reuses the exact same calculation model as the PDF exporter. */
export default function ReportsPage() {
  const { data, month, setMonth } = useGym();
  const report = reportData(data, month);
  return (
    <>
      <div className="filter-row">
        <h2>Monthly revenue</h2>
        <input
          type="month"
          aria-label="Revenue month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>
      <div className="stats-grid three">
        {stat('Total verified revenue', money(report.total), 'For ' + month, Wallet)}
        {stat(
          'Membership revenue',
          money(report.membershipRevenue),
          'Verified subscription payments',
          ShieldCheck,
          'green',
        )}
        {stat(
          'Class revenue',
          money(report.classRevenue),
          'Verified class payments',
          Dumbbell,
          'purple',
        )}
      </div>
      <section className="panel mb">
        <div className="panel-heading">
          <h2>Membership summary</h2>
          <div className="actions">
            <Badge status="Active" />
            {report.active}
            <Badge status="Expired" />
            {report.expired}
          </div>
        </div>
        {table(
          ['Plan', 'Subscribers', 'Active', 'Expired'],
          report.plans.map((plan) => [
            plan.name,
            plan.subscribers,
            plan.active,
            plan.expired,
          ]),
        )}
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Class popularity</h2>
            <p>Ranked by confirmed bookings, then attendance</p>
          </div>
        </div>
        {table(
          ['Rank', 'Class', 'Confirmed bookings', 'Attendance'],
          report.classes.map((schedule, index) => [
            '#' + (index + 1),
            schedule.name,
            schedule.bookings,
            schedule.attendance,
          ]),
        )}
      </section>
    </>
  );
}
