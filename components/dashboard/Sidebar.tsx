'use client';

import { usePathname } from 'next/navigation';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import type { SidebarSection } from './DashboardShell';

const sidebarStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '2rem',
  padding: '1.5rem',
  background: 'var(--sidebar-bg)',
  borderRight: '1px solid var(--surface-border)',
  height: '100%',
  overflowY: 'auto',
  width: '280px',
  position: 'sticky',
  top: 0,
};

const sectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const sectionTitleStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--muted)',
  padding: '0 0.5rem',
  marginBottom: '0.25rem',
};

const linkStyle = (isActive: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem 1rem',
  borderRadius: '0.5rem',
  color: isActive ? 'var(--primary)' : 'var(--text)',
  backgroundColor: isActive ? 'rgba(24, 76, 140, 0.1)' : 'transparent',
  fontWeight: isActive ? 600 : 500,
  textDecoration: 'none',
  transition: 'all 0.2s ease',
});

const linkHoverStyle = `
  .sidebar-link:hover {
    background-color: rgba(24, 76, 140, 0.08);
  }
`;

interface SidebarProps {
  sections: SidebarSection[];
}

export function Sidebar({ sections }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <style>{linkHoverStyle}</style>
      <aside style={sidebarStyle}>
      {sections.map((section) => (
        <div key={section.title} style={sectionStyle}>
          <div style={sectionTitleStyle}>{section.title}</div>
          <div style={{ display: 'grid', gap: '0.25rem' }}>
            {section.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href || '#'}
                  className="sidebar-link"
                  style={linkStyle(isActive)}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
    </>
  );
}
