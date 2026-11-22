import { money } from '@/lib/validation.mjs';
import { Receipt } from 'lucide-react';
/** INVOICE UI: item, membership discount, 6% tax and final total shown separately. */
export default function InvoiceSummary({
  item,
  memberName,
}: {
  item: any;
  memberName: string;
}) {
  return (
    <div className="invoice">
      <div className="invoice-heading">
        <span>
          <Receipt size={16} />
          Invoice
        </span>
        <b>INV-{item.id.slice(0, 8).toUpperCase()}</b>
      </div>
      <div className="invoice-item">
        <div>
          <h3>{item.name}</h3>
          <p>{item.detail}</p>
          <small>
            {item.type === 'Membership' ? 'Membership subscription' : 'Class booking'} ·{' '}
            {memberName}
          </small>
        </div>
        <b>{money(item.subtotal)}</b>
      </div>
      <dl className="invoice-breakdown">
        <div>
          <dt>Subtotal</dt>
          <dd>{money(item.subtotal)}</dd>
        </div>
        <div>
          <dt>
            Membership discount ({item.discount_percent}%){' '}
            {item.discount_plan_name && <small>{item.discount_plan_name}</small>}
          </dt>
          <dd>− {money(item.discount_amount)}</dd>
        </div>
        <div>
          <dt>Tax ({item.tax_rate}%)</dt>
          <dd>{money(item.tax_amount)}</dd>
        </div>
      </dl>
      <div className="invoice-total">
        <span>
          Total due <small>MYR</small>
        </span>
        <strong>{money(item.amount)}</strong>
      </div>
    </div>
  );
}
