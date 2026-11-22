'use client';
import { useGym } from '@/features/app/GymProvider';
import { encodePass } from '@/lib/domain/attendance.mjs';
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
/** BOOKING QR UI: opaque, owner-issued pass; the authenticated server verifies each scan. */
export default function BookingQrPass({ bookingId }: { bookingId: string }) {
  const { getBookingPass } = useGym();
  const [qr, setQr] = useState(''),
    [code, setCode] = useState(''),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    getBookingPass(bookingId)
      .then(async (pass) => {
        const value = encodePass(pass.token);
        const image = await QRCode.toDataURL(value, {
          width: 220,
          margin: 4,
          errorCorrectionLevel: 'M',
          color: { dark: '#000000', light: '#ffffff' },
        });
        if (active) {
          setQr(image);
          setCode(value);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [bookingId]);
  return (
    <section className="booking-pass">
      <h3>Your booking QR pass</h3>
      {qr ? (
        <img
          src={qr}
          width={220}
          height={220}
          alt="Attendance QR code for this confirmed booking"
        />
      ) : (
        <p>{error || 'Generating your pass…'}</p>
      )}
      <p>
        Scan this pass while signed in, or show it to staff or your assigned trainer. Use
        the Check in / Check out controls below as an alternative.
      </p>
      {code && (
        <details>
          <summary>Show pass code</summary>
          <code>{code}</code>
        </details>
      )}
    </section>
  );
}
