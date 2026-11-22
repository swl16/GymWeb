'use client';
import { planBenefits } from '@/lib/domain/benefits.mjs';
import Button from '@/components/ui/Button';
import { useGym } from '@/features/app/GymProvider';
import { money } from '@/lib/validation.mjs';
import { ArrowRight, CheckCircle2, Pencil } from 'lucide-react';

/** MEMBERSHIP CARD UI: editable plans and purchase actions. */
export default function PlanList() {
  const { data, busy, month, filter, open, purchase, confirm, staff, plan } = useGym();
  return (
    <>
      <div className="plans">
        {data.membership_plans
          .filter((p: any) => !p.archived)
          .map((p: any, i: number) => (
            <article className={'plan ' + (i === 1 ? 'featured' : '')} key={p.id}>
              <div className="eyebrow">
                {i === 1 ? 'MOST POPULAR' : 'FIND YOUR RHYTHM'}
              </div>
              <h2>{p.name}</h2>
              <div className="plan-price">
                {money(p.price)}
                <small>
                  {' '}
                  / {p.duration_months} {p.duration_months === 1 ? 'month' : 'months'}
                </small>
              </div>
              <p>Make consistency your strongest habit.</p>
              <ul>
                {Number(p.class_discount_percent) > 0 && (
                  <li>
                    <CheckCircle2 size={16} />
                    {p.class_discount_percent}% off paid classes
                  </li>
                )}
                {planBenefits(p.benefits).map((b: string) => (
                  <li key={b}>
                    <CheckCircle2 size={16} />
                    {b.trim()}
                  </li>
                ))}
              </ul>
              {staff ? (
                <div className="actions">
                  <Button className="secondary" onClick={() => open('plan', p)}>
                    <Pencil size={14} />
                    Edit
                  </Button>
                  <Button
                    className="danger-link"
                    onClick={() =>
                      confirm(
                        'delete_plan',
                        { id: p.id },
                        'Delete this plan?',
                        'The plan will be removed from sale. Existing subscription history will be kept.',
                      )
                    }
                  >
                    Delete
                  </Button>
                </div>
              ) : (
                <Button
                  className={i === 1 ? 'primary' : 'secondary'}
                  onClick={() => purchase('subscribe', { plan_id: p.id })}
                  disabled={busy}
                >
                  Choose {p.name}
                  <ArrowRight size={16} />
                </Button>
              )}
            </article>
          ))}
      </div>
    </>
  );
}
