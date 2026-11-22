'use client';
import { useEffect, useState } from 'react';
import { cashVerifier } from '@/lib/domain/payment-verifier.mjs';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { table } from '@/components/ui/DataTable';
import { useGym } from '@/features/app/GymProvider';
import { date } from '@/lib/domain/format';
import { money } from '@/lib/validation.mjs';
import { ArrowUpRight, CreditCard, Plus, ShieldCheck, Wallet } from 'lucide-react';
import SavedCardTile from './SavedCardTile';
/** PaymentsPage UI: one screen per file; shared state is accessed through useGym. */
export default function PaymentsPage() {
  const {
    data,
    user: account,
    setModal,
    busy,
    open,
    confirm,
    staff,
    nameOf,
    payments,
  } = useGym();
  const user = account!;
  const [cardAvailable, setCardAvailable] = useState(false);
  useEffect(() => {
    fetch('/api/payment-methods')
      .then((r) => r.json())
      .then((r) => setCardAvailable(r.card === true))
      .catch(() => setCardAvailable(false));
  }, []);
  return (
    <>
      <div className="payment-intro">
        <div>
          <Wallet size={23} />
          <div>
            <h3>
              {staff
                ? 'Front desk payment review'
                : 'Simple payments. More time to train.'}
            </h3>
            <p>
              {staff
                ? 'Verify cash only after receiving it at the front desk.'
                : 'Manage your saved cards, invoices and payment history.'}
            </p>
          </div>
        </div>
        {!staff && cardAvailable && (
          <Button
            className="primary"
            onClick={() => {
              open('add-card');
            }}
          >
            <Plus size={16} />
            Add credit/debit card
          </Button>
        )}
      </div>
      {!staff && (
        <>
          <div className="section-title">
            <h2>Saved credit/debit cards</h2>
          </div>
          <div className="saved-cards-grid">
            {(data.saved_cards || [])
              .filter((c: any) => c.user_id === user.id)
              .map((c: any) => (
                <SavedCardTile
                  key={c.id}
                  card={c}
                  memberName={user.name}
                  onRemove={() =>
                    confirm(
                      'remove_card',
                      { id: c.id },
                      'Remove saved card?',
                      'This removes the saved payment method. Your payment history stays unchanged.',
                    )
                  }
                />
              ))}
            {!(data.saved_cards || []).some((c: any) => c.user_id === user.id) && (
              <div className="empty-card">
                <CreditCard size={24} />
                <p>No saved cards yet.</p>
              </div>
            )}
          </div>
        </>
      )}
      <section className="panel">
        {table(
          [
            'Receipt',
            'Payment for',
            ...(staff ? ['Member'] : []),
            'Amount',
            'Method',
            'Date',
            'Status',
            'Action',
          ],
          payments.map((p: any) => [
            p.receipt_no,
            p.payment_type,
            ...(staff ? [nameOf(p.user_id)] : []),
            money(p.amount),
            p.method,
            date(p.created_at),
            <div>
              <Badge status={p.status} />
              {cashVerifier(p, data.profiles) && (
                <small className="payment-verifier">
                  Verified by {cashVerifier(p, data.profiles)}
                </small>
              )}
            </div>,
            staff ? (
              <div className="actions">
                {p.needs_review && <span className="badge pending">Refund review</span>}
                {p.status === 'Pending' && p.method === 'Cash' && (
                  <>
                    <Button
                      className="text-button"
                      disabled={busy}
                      onClick={() =>
                        confirm(
                          'verify_payment',
                          { id: p.id, status: 'Verified' },
                          'Verify cash payment?',
                          'Confirm that the front desk has received ' +
                            money(p.amount) +
                            '. The linked membership or booking will activate.',
                        )
                      }
                    >
                      Verify
                    </Button>
                    <Button
                      className="danger-link"
                      disabled={busy}
                      onClick={() =>
                        confirm(
                          'verify_payment',
                          { id: p.id, status: 'Rejected' },
                          'Reject this payment?',
                          'The linked subscription or booking will be marked rejected.',
                        )
                      }
                    >
                      Reject
                    </Button>
                  </>
                )}
                {p.status === 'Rejected' && !p.provider_session_id && (
                  <Button
                    className="danger-link"
                    onClick={() =>
                      confirm(
                        'delete_payment',
                        { id: p.id },
                        'Delete rejected payment?',
                        'This rejected payment record will be permanently removed.',
                      )
                    }
                  >
                    Delete
                  </Button>
                )}
                {p.status === 'Verified' && (
                  <span className="muted">
                    <ShieldCheck size={15} />
                    Protected
                  </span>
                )}
              </div>
            ) : p.status === 'Verified' ? (
              <Button
                className="text-button"
                onClick={() => {
                  setModal({ type: 'receipt', payment: p });
                }}
              >
                View receipt
                <ArrowUpRight size={14} />
              </Button>
            ) : (
              'Awaiting review'
            ),
          ]),
        )}
      </section>
      <div className="notice">
        Cash payments are verified by staff. Online payments activate only after provider
        confirmation.
      </div>
    </>
  );
}
