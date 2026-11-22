import { CheckCircle2, X } from 'lucide-react';
import Button from './Button';
/** FEEDBACK UI: live status announcement and dismiss button. */
export default function Toast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  if (!message) return null;
  return (
    <div className="toast" role="status">
      <CheckCircle2 size={19} />
      <span>{message}</span>
      <Button aria-label="Dismiss message" onClick={onDismiss}>
        <X size={16} />
      </Button>
    </div>
  );
}
