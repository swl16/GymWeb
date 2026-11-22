'use client';
import Button from '@/components/ui/Button';
import { useGym } from '@/features/app/GymProvider';
import { ChevronRight, Menu, Moon, Sun } from 'lucide-react';
/** HEADER LAYOUT: PULSE branding, breadcrumb and account controls. */
export default function Header() {
  const { user, view, theme, setTheme, mobile, setMobile, open, nav, title, navigate } =
    useGym();
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <Button
          className="mobile-nav-toggle icon-button"
          aria-label="Toggle navigation"
          onClick={() => setMobile(!mobile)}
        >
          <Menu size={22} />
        </Button>
        <a
          className="header-brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('overview');
          }}
        >
          PULSE
        </a>
        <span>Workspace</span>
        <ChevronRight size={13} />
        <b>{title[view]}</b>
      </div>
      <div className="top-actions">
        <Button
          className="icon-button"
          aria-label="Toggle dark mode"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </Button>
        {!user ? (
          <Button className="primary small" onClick={() => open('login')}>
            Sign in
          </Button>
        ) : (
          <Button
            className="top-avatar"
            aria-label="Open profile"
            onClick={() => navigate('profile')}
          >
            {user.name[0]}
          </Button>
        )}
      </div>
    </header>
  );
}
