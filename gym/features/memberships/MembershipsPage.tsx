'use client';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { table } from '@/components/ui/DataTable';
import { useGym } from '@/features/app/GymProvider';
import PlanList from '@/features/memberships/PlanList';
import { date } from '@/lib/domain/format';
/** MembershipsPage UI: one screen per file; shared state is accessed through useGym. */
export default function MembershipsPage() {
  const { data, staff, subscriptions, confirm, busy, open } = useGym();
  return (
    <>
      {!staff && subscriptions.length > 0 && (
        <section className="panel mb">
          <div className="panel-heading">
            <h2>Your subscriptions</h2>
          </div>
          {table(
            ['Plan', 'Start date', 'End date', 'Status', 'Action'],
            subscriptions.map((s: any) => [
              data.membership_plans.find((p: any) => p.id === s.plan_id)?.name,
              date(s.start_date),
              date(s.end_date),
              <Badge status={s.status} />,
              ['Pending', 'Rejected'].includes(s.status) ? (
                <div className="actions">
                  <Button
                    variant="text"
                    onClick={() =>
                      open('purchase-review', {
                        payment_type: 'Membership',
                        target_id: s.id,
                      })
                    }
                  >
                    Continue to payment
                  </Button>
                  <Button
                    variant="text"
                    className="danger-link"
                    disabled={busy}
                    onClick={() =>
                      confirm(
                        'cancel_subscription',
                        { id: s.id },
                        'Cancel pending membership?',
                        'This cancels the unpaid subscription and its pending invoice. Verified payments cannot be cancelled here.',
                      )
                    }
                  >
                    Cancel subscription
                  </Button>
                </div>
              ) : (
                '—'
              ),
            ]),
          )}
        </section>
      )}
      <PlanList />
    </>
  );
}
