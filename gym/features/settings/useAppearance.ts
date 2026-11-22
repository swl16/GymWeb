'use client';
import { useEffect, useState } from 'react';
/** APPEARANCE STATE: user preferences are separate from authentication and business records. */
export function useAppearance() {
  const [theme, setTheme] = useState('light'),
    [accent, setAccent] = useState('#2D9CDB'),
    [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    setTheme(localStorage.getItem('pulse-theme') || 'light');
    setAccent(localStorage.getItem('pulse-accent') || '#2D9CDB');
    setCollapsed(localStorage.getItem('pulse-sidebar') === 'collapsed');
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.setProperty('--accent', accent);
    localStorage.setItem('pulse-theme', theme);
    localStorage.setItem('pulse-accent', accent);
  }, [theme, accent]);
  function toggleSidebar() {
    setCollapsed((previous) => {
      localStorage.setItem('pulse-sidebar', previous ? 'expanded' : 'collapsed');
      return !previous;
    });
  }
  return { theme, setTheme, accent, setAccent, collapsed, toggleSidebar };
}
