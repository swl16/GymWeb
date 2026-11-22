import type { LucideIcon } from 'lucide-react';
/** STAT CARD UI: label, numeric value, icon and explanatory caption. */
export function stat(
  label: string,
  value: any,
  detail: string,
  Icon: LucideIcon,
  tone = 'blue',
) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span>{label}</span>
        <div className={'stat-icon ' + tone}>
          <Icon size={18} />
        </div>
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

export default function StatCard({
  label,
  value,
  detail,
  icon,
  tone = 'blue',
}: {
  label: string;
  value: React.ReactNode;
  detail: string;
  icon: LucideIcon;
  tone?: string;
}) {
  return stat(label, value, detail, icon, tone);
}
