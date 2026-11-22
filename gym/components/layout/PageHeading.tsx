'use client';
import Button from '@/components/ui/Button';
import { useGym } from '@/features/app/GymProvider';
import { date } from '@/lib/domain/format';
import { CalendarDays, Download, Plus } from 'lucide-react';
/** PAGE TITLE UI: title, subtitle and page-specific primary action. */
export default function PageHeading() {
  const { user, view, month, open, staff, trainer, plan, title, exportReport } = useGym();
  if (!user) return null;
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">
          {view === 'overview'
            ? 'YOUR FITNESS, IN FOCUS'
            : trainer
              ? 'PULSE / TRAINER WORKSPACE'
              : staff
                ? 'PULSE / STAFF WORKSPACE'
                : 'PULSE / MEMBER WORKSPACE'}
        </div>
        <h1>
          {view === 'overview'
            ? `Let's keep moving, ${user.name.split(' ')[0]}.`
            : title[view]}
          {view === 'overview' && <span className="heading-dot">●</span>}
        </h1>
        <p>
          {view === 'overview'
            ? 'A little progress every day adds up to something great.'
            : view === 'classes'
              ? 'Find your next challenge. Make room for what moves you.'
              : view === 'reports'
                ? 'A clear view of your community, classes and revenue.'
                : 'Everything you need, all in one place.'}
        </p>
      </div>
      <div className="heading-action">
        {view === 'overview' ? (
          <span className="date-chip">
            <CalendarDays size={15} />
            {date(new Date().toISOString(), {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        ) : view === 'trainers' ? (
          <Button className="primary" onClick={() => open('trainer')}>
            <Plus size={16} />
            Add trainer
          </Button>
        ) : view === 'attendance' ? (
          <Button className="primary" onClick={() => open('scanner')}>
            <CalendarDays size={16} />
            Scan attendance QR
          </Button>
        ) : view === 'plans' ? (
          <Button className="primary" onClick={() => open('plan')}>
            <Plus size={16} />
            New plan
          </Button>
        ) : view === 'classes' && staff ? (
          <Button className="primary" onClick={() => open('class')}>
            <Plus size={16} />
            Add schedule
          </Button>
        ) : view === 'progress' ? (
          <Button className="primary" onClick={() => open('fitness')}>
            <Plus size={16} />
            Log workout
          </Button>
        ) : view === 'reports' ? (
          <Button className="secondary" onClick={exportReport}>
            <Download size={15} />
            Export PDF
          </Button>
        ) : null}
      </div>
    </div>
  );
}
