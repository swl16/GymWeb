'use client';
import { useGym } from '@/features/app/GymProvider';
import type { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
/** APP LAYOUT: responsive navigation shell. No screen or business logic lives here. */
export default function AppShell({ children }: { children: ReactNode }) {
  const { collapsed, mobile, setMobile } = useGym();
  return (
    <div className={'app ' + (collapsed ? 'sidebar-collapsed' : '')}>
      <Sidebar />
      {mobile && <div className="scrim" onClick={() => setMobile(false)} />}
      <main>
        <Header />
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
