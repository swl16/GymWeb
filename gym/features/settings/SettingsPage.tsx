'use client';
import Button from '@/components/ui/Button';
import { useGym } from '@/features/app/GymProvider';
import { Check, Moon, Sun } from 'lucide-react';
/** SettingsPage UI: one screen per file; shared state is accessed through useGym. */
export default function SettingsPage() {
  const { user, data, theme, setTheme, accent, setAccent, setModal, open, title } =
    useGym();
  return (
    <section className="panel settings-panel">
      <h2>Make PULSE yours.</h2>
      <p>A workspace that matches your energy.</p>
      {data.is_admin === true && (
        <p>
          <a href="/admin/">Staff administration portal ↗</a>
        </p>
      )}
      <h3>Appearance</h3>
      <div className="tabs">
        {['light', 'dark'].map((t) => (
          <Button
            className={theme === t ? 'selected' : ''}
            key={t}
            onClick={() => setTheme(t)}
          >
            {t === 'light' ? <Sun size={16} /> : <Moon size={16} />}{' '}
            {t === 'light' ? 'Light' : 'Dark'}
          </Button>
        ))}
      </div>
      <h3>Accent color</h3>
      <div className="swatches">
        {['#2D9CDB', '#8B5CF6', '#16A085', '#E96C32'].map((c) => (
          <Button
            key={c}
            aria-label={'Use accent ' + c}
            style={{ background: c }}
            onClick={() => setAccent(c)}
          >
            {accent === c && <Check size={19} />}
          </Button>
        ))}
        <label>
          Custom
          <input
            aria-label="Custom accent color"
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
          />
        </label>
      </div>
    </section>
  );
}
