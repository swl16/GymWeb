import Button from '@/components/ui/Button';
import type { SavedCard } from '@/lib/domain/models';
import { CreditCard, Trash2 } from 'lucide-react';
/** SAVED CARD UI: masked details only, with a separately confirmed removal action. */
export default function SavedCardTile({
  card,
  memberName,
  onRemove,
}: {
  card: SavedCard;
  memberName: string;
  onRemove: () => void;
}) {
  return (
    <article className="saved-card-tile">
      <div>
        <CreditCard size={23} />
        <b>{card.brand}</b>
        <Button
          className="icon-button card-remove"
          aria-label={'Remove saved card ending ' + card.last4}
          onClick={onRemove}
        >
          <Trash2 size={15} />
        </Button>
      </div>
      <strong>•••• &nbsp;•••• &nbsp;•••• &nbsp;{card.last4}</strong>
      <footer>
        <span>{card.holder || memberName}</span>
        <span>
          {String(card.exp_month).padStart(2, '0')}/{String(card.exp_year).slice(-2)}
        </span>
      </footer>
    </article>
  );
}
