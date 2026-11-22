import { Activity } from 'lucide-react';
/** FOOTER LAYOUT: brand and timezone caption. */
export default function Footer() {
  return (
    <footer>
      <span className="footer-brand">
        <Activity size={15} />
        PULSE
      </span>
      <span>Built for a stronger you.</span>
      <span>Kuala Lumpur · MYT (UTC+8)</span>
    </footer>
  );
}
