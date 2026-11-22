
'use client';
import Button from '@/components/ui/Button';
import { useGym } from '@/features/app/GymProvider';
import { Activity, ChevronDown, Dumbbell, Menu, Settings } from 'lucide-react';
/** SIDEBAR LAYOUT: role navigation, collapse control and profile access. */
export default function Sidebar() {
  const {
    user,
    view,
    mobile,
    collapsed,
    filter,
    toggleSidebar,
    staff,
    trainer,
    ops,
    bookings,
    nav,
    title,
    navigate,
  } = useGym();
  return (
    <aside className={'sidebar ' + (mobile ? 'show' : '')}>
      <div className="sidebar-brand-row">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('overview');
          }}
        >
          <div className="brand-icon">
            <Activity size={25} strokeWidth={2.5} />
          </div>
          PULSE<span>GYM & FITNESS</span>
        </a>
        <Button
          className="sidebar-toggle icon-button"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          onClick={toggleSidebar}
        >
          <Menu size={20} />
        </Button>
      </div>
      <div className="workspace">
        <div className="workspace-icon">
          <Dumbbell size={20} />
        </div>
        <div>
          <b>PULSE Fitness</b>
          <small>Kuala Lumpur, MY</small>
        </div>
        <ChevronDown size={14} />
      </div>
      <div className="nav-label">WORKSPACE</div>
      <nav>
        {nav.map(([id, label, Icon]: any) => (
          <Button
            key={id}
            aria-label={label}
            title={label}
            className={view === id ? 'active' : ''}
            onClick={() => navigate(id)}
          >
            <Icon size={19} />
            <span className="nav-text">{label}</span>
            {id === 'bookings' && !ops && (
              <span className="nav-count">
                {bookings.filter((b: any) => b.status === 'Booked').length}
              </span>
            )}
          </Button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <Button
          aria-label="Preferences"
          title="Preferences"
          className={'side-setting ' + (view === 'settings' ? 'active' : '')}
          onClick={() => navigate('settings')}
        >
          <Settings size={18} />
          <span className="nav-text">Preferences</span>
        </Button>
        <div
          className="account"
          onClick={() => user && navigate('profile')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('profile')}
        >
          <div className="avatar">
            {user?.name
              ?.split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2) || 'P'}
          </div>
          <div>
            <b>{user?.name || 'Welcome to PULSE'}</b>
            <small>
              {trainer
                ? 'Trainer workspace'
                : staff
                  ? 'Staff workspace'
                  : user
                    ? 'Member workspace'
                    : 'Start your journey'}
            </small>
          </div>
          <ChevronDown size={14} />
        </div>
      </div>
    </aside>
  );
}
