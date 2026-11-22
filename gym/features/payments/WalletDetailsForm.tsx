import { Wallet } from 'lucide-react';
export default function WalletDetailsForm() {
  return (
    <div className="secure-provider">
      <Wallet size={28} />
      <h3>Approve with GrabPay</h3>
      <p>
        You will be redirected to the provider and approve payment in your wallet. PULSE
        never collects your wallet PIN.
      </p>
    </div>
  );
}
