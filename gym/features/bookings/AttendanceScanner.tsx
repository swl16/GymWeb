'use client';
import Button from '@/components/ui/Button';
import { useGym } from '@/features/app/GymProvider';
import { parsePass } from '@/lib/domain/attendance.mjs';
import { Camera, CheckCircle2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
/** SCANNER UI: explicit camera start, manual fallback, device cleanup and server-enforced redemption. */
export default function AttendanceScanner() {
  const { redeemPass, ops } = useGym();
  const [direction, setDirection] = useState('in');
  const [value, setValue] = useState(''),
    [error, setError] = useState(''),
    [result, setResult] = useState(''),
    [busy, setBusy] = useState(false),
    [camera, setCamera] = useState(false);
  const video = useRef<HTMLVideoElement>(null),
    controls = useRef<{ stop: () => void } | null>(null),
    lock = useRef(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controls.current?.stop();
    };
  }, []);
  async function redeem(raw: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    setResult('');
    controls.current?.stop();
    setCamera(false);
    try {
      const token = parsePass(raw);
      const response = await redeemPass(token, direction);
      if (mounted.current) setResult(response.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to check in.');
    } finally {
      if (mounted.current) setBusy(false);
      lock.current = false;
    }
  }
  async function start() {
    setError('');
    setCamera(true);
    try {
      const { BrowserQRCodeReader } = await import('@zxing/browser');
      if (!video.current) throw Error('Camera preview unavailable.');
      const reader = new BrowserQRCodeReader();
      const nextControls = await reader.decodeFromVideoDevice(
        undefined,
        video.current,
        (scan, _error, control) => {
          if (scan && mounted.current) {
            control.stop();
            redeem(scan.getText());
          }
        },
      );
      if (mounted.current) controls.current = nextControls;
      else nextControls.stop();
    } catch (e) {
      if (!mounted.current) return;
      setCamera(false);
      setError(
        e instanceof Error ? e.message : 'Camera unavailable. Paste the code below.',
      );
    }
  }
  return (
    <div>
      <div className="eyebrow">PULSE / ATTENDANCE</div>
      <h2>Scan attendance QR</h2>
      <p>
        Use the member’s booking QR code. Members can scan their own pass. Staff and
        assigned trainers can scan member passes.
      </p>
      <label className="stacked-field">
        Action
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          disabled={busy || camera}
        >
          <option value="in">Check in</option>
          <option value="out">Check out</option>
        </select>
      </label>
      <video
        ref={video}
        className={'qr-video ' + (camera ? 'visible' : '')}
        muted
        playsInline
      />
      {!camera && (
        <Button variant="secondary" disabled={busy} onClick={start}>
          <Camera size={16} />
          Start camera
        </Button>
      )}
      {camera && (
        <Button
          variant="secondary"
          onClick={() => {
            controls.current?.stop();
            setCamera(false);
          }}
        >
          Stop camera
        </Button>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          redeem(value);
        }}
      >
        <label className="stacked-field">
          Or paste attendance pass
          <textarea
            value={value}
            required
            placeholder="pulse:attendance:v1:…"
            onChange={(e) => setValue(e.target.value)}
          />
        </label>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        {result && (
          <div className="checkin-success" role="status">
            <CheckCircle2 size={22} />
            {result}
          </div>
        )}
        <div className="modal-actions">
          <Button variant="primary" type="submit" disabled={busy}>
            {busy
              ? 'Checking…'
              : direction === 'out'
                ? 'Record check-out'
                : 'Record check-in'}
          </Button>
        </div>
      </form>
    </div>
  );
}
