'use client';
import Button from '@/components/ui/Button';
import { useGym } from '@/features/app/GymProvider';
import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
/** PUBLIC LANDING PAGE UI: gym imagery and sign-in/sign-up calls to action. */
export default function LandingPage() {
  const { open } = useGym();
  const [ready, setReady] = useState<boolean | null>(null);
  useEffect(() => {
    fetch('/api/system')
      .then((r) => r.json())
      .then((s) => setReady(s.ready))
      .catch(() => setReady(false));
  }, []);
  return (
    <>
      {ready === false && (
        <section className="panel mb">
          <h2>Setup in progress</h2>
          <p>
            An administrator needs to finish connecting secure account services before
            registration and sign-in are available.
          </p>
        </section>
      )}
      <section className="hero landing">
        <div className="hero-copy">
          <div className="eyebrow">YOUR STRONGEST CHAPTER</div>
          <h1>
            Built for the
            <br />
            way you move.
          </h1>
          <p>
            Find your community. Build your routine.
            <br />
            Become a little stronger, every day.
          </p>
          <Button
            className="primary"
            disabled={ready !== true}
            onClick={() => open('register')}
          >
            Join PULSE
            <ArrowUpRight size={17} />
          </Button>
          <Button className="hero-link" onClick={() => open('login')}>
            Already a member? Sign in
          </Button>
        </div>
      </section>
      <div className="section-title">
        <h2>A membership that moves with you.</h2>
      </div>
    </>
  );
}
