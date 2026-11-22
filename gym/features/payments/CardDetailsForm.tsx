import { LockKeyhole } from 'lucide-react';
/** The provider collects sensitive card details; PULSE stores only its token and masked metadata. */
export default function CardDetailsForm({
  adding,
  save,
  setSave,
}: {
  adding: boolean;
  save: boolean;
  setSave: (value: boolean) => void;
}) {
  return (
    <>
      <div className="secure-provider">
        <LockKeyhole size={28} />
        <h3>Secure card details</h3>
        <p>
          Continue to the payment provider to enter your cardholder name, number, expiry
          and CVV.
        </p>
      </div>
      {!adding && (
        <label className="save-card-check">
          <input
            type="checkbox"
            checked={save}
            onChange={(e) => setSave(e.target.checked)}
          />
          Save this card for future payments
        </label>
      )}
    </>
  );
}
