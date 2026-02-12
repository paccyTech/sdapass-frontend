'use client';

import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { TopNavBar } from '../TopNavBar';

import { clearAuthSession } from '@/lib/auth';

import type { RoleKey } from '@/lib/rbac';
import { ROLE_DEFINITIONS } from '@/lib/rbac';
import type { AuthUser } from '@/lib/auth';
import { getRoleNavSections, getRoleSidebarSections } from './roleNavigation';
import { useTheme } from '@/components/theme/ThemeProvider';

export type NavItem = {
  label: string;
  description?: string;
  href?: string;
  icon?: ReactNode;
  badge?: string;
  active?: boolean;
};

export type NavSection = {
  title?: string;
  items: NavItem[];
};

export type SidebarItem = {
  label: string;
  description?: string;
  href?: string;
};

export type SidebarSection = {
  title: string;
  description?: string;
  items: SidebarItem[];
  layout?: 'cards' | 'list';
};

type DashboardShellProps = {
  role: RoleKey;
  hero?: ReactNode;
  children: ReactNode;
  navSections?: NavSection[];
  sidebarSections?: SidebarSection[];
  toolbar?: ReactNode;
  sidebarLogo?: ReactNode;
  currentUser?: AuthUser | null;
};

const useIsMobile = (breakpoint = 1080) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < breakpoint);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [breakpoint]);

  return isMobile;
};

const desktopLayout: CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  gridTemplateColumns: '320px minmax(0, 1fr)',
  background: 'var(--shell-bg)',
  color: 'var(--shell-foreground)',
};

const mobileLayout: CSSProperties = {
  minHeight: '100vh',
  display: 'grid',
  gridTemplateColumns: '1fr',
  background: 'var(--shell-bg)',
  color: 'var(--shell-foreground)',
};

const desktopSidebar: CSSProperties = {
  background: 'linear-gradient(180deg, var(--sidebar-bg) 0%, color-mix(in srgb, var(--sidebar-bg) 95%, var(--surface-soft)) 100%)',
  padding: '2.6rem clamp(1.75rem, 3vw, 2.85rem)',
  display: 'grid',
  gap: '1rem',
  borderRight: '1px solid var(--surface-border)',
  position: 'sticky',
  top: 0,
  height: '100vh',
  overflowY: 'auto',
  boxShadow: 'inset -1px 0 0 color-mix(in srgb, var(--surface-border) 45%, transparent)',
  color: 'var(--shell-foreground)',
};

const mobileSidebar: CSSProperties = {
  background: 'var(--sidebar-bg)',
  padding: '1.85rem clamp(1.2rem, 4vw, 2rem)',
  display: 'grid',
  gap: '1.5rem',
  borderBottom: '1px solid var(--surface-border)',
  boxShadow: '0 24px 46px rgba(24, 76, 140, 0.12)',
  color: 'var(--shell-foreground)',
};

const brandCluster: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.85rem',
};

const brandLogoStyle: CSSProperties = {
  display: 'block',
  width: '60px',
  height: 'auto',
};

const brandStack: CSSProperties = {
  display: 'grid',
  gap: '0.05rem',
};

const brandTitleMain: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '1.02rem',
  letterSpacing: '-0.005em',
  color: '#065f46',
  fontWeight: 400,
  textTransform: 'uppercase',
  lineHeight: 1.1,
};

const brandTitleSub: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: '0.86rem',
  letterSpacing: '0.01em',
  color: '#a3a399ffff',
  fontWeight: 600,
  lineHeight: 1.1,
};

const mainContent: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  backgroundColor: 'var(--shell-bg)',
  padding: '1.5rem 2rem',
  minHeight: '100vh',
};

const navSectionTitle: CSSProperties = {
  textTransform: 'uppercase',
  fontSize: '0.68rem',
  letterSpacing: '0.22em',
  fontFamily: 'var(--font-display)',
  color: 'var(--muted)',
  marginBottom: '0.6rem',
  fontWeight: 600,
};

const navList: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'grid',
  gap: '0.35rem',
};

const navItemStyle = (active?: boolean): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.9rem 1.05rem',
  borderRadius: '16px',
  border: '1px solid transparent',
  background: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
  color: active ? '#3b82f6' : 'var(--muted)',
  transition: 'transform 0.2s ease, background 0.2s ease',
  fontSize: '0.95rem',
});

const navItemLabel = (active?: boolean): CSSProperties => ({
  fontWeight: active ? 700 : 600,
  letterSpacing: '-0.01em',
  fontFamily: 'var(--font-body)',
});

const navBadge = (active?: boolean): CSSProperties => ({
  marginLeft: 'auto',
  padding: '0.2rem 0.55rem',
  borderRadius: '999px',
  fontSize: '0.65rem',
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
  background: active
    ? 'color-mix(in srgb, var(--primary) 20%, transparent)'
    : 'color-mix(in srgb, var(--primary) 10%, transparent)',
  color: active ? 'var(--primary)' : 'var(--muted)',
});

const workflowSections: CSSProperties = {
  display: 'grid',
  gap: '1.4rem',
};

const simpleListSection: CSSProperties = {
  display: 'grid',
  gap: '0.5rem',
};

const simpleListItems: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gap: '0.4rem',
};

const simpleListItem: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  color: 'var(--primary)',
  fontWeight: 600,
  textDecoration: 'none',
};

const workflowSection: CSSProperties = {
  display: 'grid',
  gap: '0.9rem',
  padding: '1.35rem',
  borderRadius: '20px',
  background: 'var(--surface-soft)',
  border: '1px solid var(--surface-border)',
  boxShadow: '0 18px 32px rgba(24, 76, 140, 0.08)',
};

const workflowHeader: CSSProperties = {
  display: 'grid',
  gap: '0.35rem',
};

const workflowLead: CSSProperties = {
  fontSize: '0.72rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  fontWeight: 600,
};

const workflowSectionDescription: CSSProperties = {
  margin: 0,
  color: 'var(--muted)',
  lineHeight: 1.5,
  fontSize: '0.9rem',
};

const workflowItems: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gap: '0.8rem',
};

const workflowItem: CSSProperties = {
  display: 'grid',
  gap: '0.35rem',
  padding: '0.95rem 1.1rem',
  borderRadius: '16px',
  background: 'var(--surface-glass)',
  border: '1px solid var(--surface-border)',
  backdropFilter: 'blur(6px)',
};

const workflowItemLabel: CSSProperties = {
  fontWeight: 650,
  color: 'var(--primary)',
  letterSpacing: '-0.01em',
};

const workflowItemDescription: CSSProperties = {
  margin: 0,
  color: 'var(--muted)',
  lineHeight: 1.6,
  fontSize: '0.9rem',
};

const mainArea: CSSProperties = {
  display: 'grid',
  gap: '2.4rem',
  padding: '2.6rem clamp(1.5rem, 5vw, 3.5rem)',
};

// Top bar related styles and components have been moved to TopNavBar.tsx

const profileCluster: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.85rem',
};

const avatarStyle: CSSProperties = {
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  background: 'url(/sda-logo.png) center/cover no-repeat',
  position: 'relative',
  overflow: 'hidden',
};

const avatarInitials: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(24, 76, 140, 0.7)',
  color: '#fff',
  fontWeight: 700,
  fontSize: '1.1rem',
  borderRadius: '50%',
};

const profileText: CSSProperties = {
  display: 'grid',
  gap: '0.2rem',
};

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(4, 8, 18, 0.65)',
  zIndex: 20,
};

const toTitleCase = (value: string) =>
  value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (match) => match.toUpperCase());

export const DashboardShell = ({
  role,
  hero,
  children,
  navSections,
  toolbar,
  sidebarSections,
  sidebarLogo,
  currentUser,
}: DashboardShellProps) => {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname() ?? '';
  const { theme } = useTheme();

  const resolvedNavSections = useMemo(() => {
    if (navSections !== undefined) {
      return navSections;
    }
    return getRoleNavSections(role, pathname);
  }, [navSections, role, pathname]);

  const resolvedSidebarSections = useMemo(() => {
    if (sidebarSections !== undefined) {
      return sidebarSections;
    }
    return getRoleSidebarSections(role);
  }, [sidebarSections, role]);

  useEffect(() => {
    if (!isMobile) {
      setNavOpen(true);
    } else {
      setNavOpen(false);
    }
  }, [isMobile]);

  const sidebarBase = isMobile ? mobileSidebar : desktopSidebar;

  useEffect(() => {
    document.body.classList.add('no-footer');
    return () => {
      document.body.classList.remove('no-footer');
    };
  }, []);

  const fallbackRoleLabel = useMemo(() => toTitleCase(role), [role]);
  const activeRoleDefinition = useMemo(() => ROLE_DEFINITIONS[role], [role]);
  const roleDisplayName = activeRoleDefinition?.name ?? fallbackRoleLabel;

  const profileName = useMemo(() => {
    if (currentUser) {
      const { firstName, lastName, email } = currentUser;
      const name = [firstName, lastName].filter(Boolean).join(' ').trim();
      if (name) {
        return name;
      }
      if (email) {
        return email;
      }
    }
    return roleDisplayName;
  }, [currentUser, roleDisplayName]);

  const profileRoleLabel = useMemo(() => {
    if (currentUser?.role) {
      return ROLE_DEFINITIONS[currentUser.role]?.name ?? toTitleCase(currentUser.role);
    }
    return roleDisplayName;
  }, [currentUser, roleDisplayName]);

  const profileInitials = useMemo(() => {
    const first = currentUser?.firstName?.trim();
    const last = currentUser?.lastName?.trim();

    if (first || last) {
      const firstInitial = first?.charAt(0) ?? '';
      const lastInitial = last?.charAt(0) ?? '';
      const combined = `${firstInitial}${lastInitial}`;
      if (combined.trim()) {
        return combined.toUpperCase();
      }
    }

    if (profileName) {
      const parts = profileName.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
      }
    }

    return fallbackRoleLabel.slice(0, 2).toUpperCase();
  }, [currentUser, profileName, fallbackRoleLabel]);

  const handleLogout = useCallback(() => {
    clearAuthSession();
    if (isMobile) {
      setNavOpen(false);
    }
    router.push('/login');
  }, [router, isMobile]);

  const searchPlaceholder = useMemo(() => {
    if (activeRoleDefinition?.name) {
      return `Search ${activeRoleDefinition.name.toLowerCase()} workspace…`;
    }
    return 'Search records and activity…';
  }, [activeRoleDefinition]);

  const handleNavClick = useCallback(
    (event: ReactMouseEvent<HTMLAnchorElement>, href?: string) => {
      if (!href) {
        return;
      }

      const normalizedTarget = href.replace(/\/$/, '');
      const normalizedCurrent = pathname.replace(/\/$/, '');

      if (normalizedTarget === normalizedCurrent) {
        event.preventDefault();
      }

      if (isMobile) {
        setNavOpen(false);
      }
    },
    [isMobile, pathname],
  );

  const sideNav = (
    <aside
      style={{
        ...sidebarBase,
        position: isMobile ? 'fixed' : 'sticky',
        top: 0,
        left: 0,
        zIndex: isMobile ? 30 : 1,
        width: isMobile ? 'min(84vw, 320px)' : 'auto',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo section - stays at top */}
      <div style={{ flexShrink: 0 }}>
        {sidebarLogo ? (
          sidebarLogo
        ) : (
          <div style={brandCluster}>
            <img 
              src={theme === 'dark' ? '/sda-white-logo.png' : '/sda-logo.png'} 
              alt="SDA Logo" 
              style={brandLogoStyle} 
            />
            <div style={brandStack}>
              <span style={brandTitleMain}>SDA Pass</span>
              <span style={brandTitleSub}>Management</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ height: '2px', background: 'linear-gradient(to right, transparent, rgba(24,76,140,0.12), transparent)', borderRadius: '1px', flexShrink: 0 }} />

      {/* Scrollable navigation section */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        display: 'grid',
        gap: '1.4rem',
        paddingBottom: '1rem'
      }}>
        <nav style={{ display: 'grid', gap: '1.4rem' }}>
          {resolvedNavSections.map((section, index) => (
            <div key={(section.title ?? 'section') + index}>
              {section.title && <p style={navSectionTitle}>{section.title}</p>}
              <ul style={navList}>
                {section.items.map((item) => {
                  const content = (
                    <div style={navItemStyle(item.active)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                        {item.icon && (
                          <span 
                            style={{
                              fontSize: '1.15rem',
                              color: '#ff0000 !important' as any,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '1.5rem',
                              height: '1.5rem'
                            }}
                          >
                            {item.icon}
                          </span>
                        )}
                        <div style={{ display: 'grid', gap: '0.1rem', flex: 1 }}>
                          <span style={navItemLabel(item.active)}>{item.label}</span>
                          {item.description && <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>{item.description}</span>}
                        </div>
                      </div>
                      {item.badge && <span style={navBadge(item.active)}>{item.badge}</span>}
                    </div>
                  );

                  if (item.href) {
                    return (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          onClick={(event) => handleNavClick(event, item.href)}
                          style={{
                            textDecoration: 'none',
                            color: 'inherit',
                            display: 'block',
                          }}
                        >
                          {content}
                        </Link>
                      </li>
                    );
                  }

                  return (
                    <li key={item.label}>
                      <button
                        type="button"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: 0,
                          width: '100%',
                          textAlign: 'left',
                          cursor: 'default',
                        }}
                      >
                        {content}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {resolvedSidebarSections?.length ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ height: '2px', background: 'linear-gradient(to right, transparent, rgba(24,76,140,0.12), transparent)', borderRadius: '1px' }} />
            <div style={workflowSections}>
              {resolvedSidebarSections.map((section) => {
                if (section.layout === 'list') {
                  return (
                    <section key={section.title} style={simpleListSection}>
                      <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1rem', color: 'var(--primary)' }}>
                        {section.title}
                      </h3>
                      <ul style={simpleListItems}>
                        {section.items.map((item) => (
                          <li key={item.label}>
                            {item.href ? (
                              <Link href={item.href} style={simpleListItem}>
                                <span>•</span>
                                <span>{item.label}</span>
                              </Link>
                            ) : (
                              <div style={simpleListItem}>
                                <span>•</span>
                                <span>{item.label}</span>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                }

                return (
                  <section key={section.title} style={workflowSection}>
                    <header style={workflowHeader}>
                      <span style={workflowLead}>{role.replace('_', ' ').toLowerCase()}</span>
                      <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--primary)' }}>
                        {section.title}
                      </h3>
                      {section.description && <p style={workflowSectionDescription}>{section.description}</p>}
                    </header>
                    <ul style={workflowItems}>
                      {section.items.map((item) => {
                        const content = (
                          <div style={workflowItem}>
                            <span style={workflowItemLabel}>{item.label}</span>
                            {item.description && <p style={workflowItemDescription}>{item.description}</p>}
                          </div>
                        );

                        if (item.href) {
                          return (
                            <li key={item.label}>
                              <Link href={item.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                                {content}
                              </Link>
                            </li>
                          );
                        }

                        return <li key={item.label}>{content}</li>;
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {/* Logout container - sticks to bottom */}
      <div
        style={{
          flexShrink: 0,
          display: 'grid',
          gap: '0.65rem',
          paddingTop: '1rem',
        }}
      >
        <div style={{ height: '2px', background: 'linear-gradient(to right, transparent, rgba(24,76,140,0.12), transparent)', borderRadius: '1px' }} />
        <button
          type="button"
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            justifyContent: 'center',
            border: '1px solid var(--danger)',
            borderRadius: '16px',
            background: 'transparent',
            color: 'var(--danger)',
            fontWeight: 650,
            padding: '0.85rem 1.2rem',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease',
            boxShadow: 'none',
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.background = 'rgba(24,76,140,0.05)';
            event.currentTarget.style.transform = 'translateY(-1px)';
            event.currentTarget.style.boxShadow = '0 4px 8px rgba(24,76,140,0.1)';
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = 'transparent';
            event.currentTarget.style.transform = 'translateY(0)';
            event.currentTarget.style.boxShadow = 'none';
          }}
          onMouseDown={(event) => {
            event.currentTarget.style.transform = 'translateY(0)';
            event.currentTarget.style.boxShadow = 'none';
          }}
        >
          <span aria-hidden="true" style={{ fontSize: '1.05rem' }}>
            ⏻
          </span>
          <span style={{ letterSpacing: '0.02em' }}>Log out</span>
        </button>
        {currentUser?.email ? (
          <p
            style={{
              margin: 0,
              textAlign: 'center',
              fontSize: '0.8rem',
              color: 'rgba(82,96,109,0.72)',
              letterSpacing: '0.04em',
            }}
          >
            Signed in as {currentUser.email}
          </p>
        ) : null}
      </div>
    </aside>
  );

  return (
    <div style={isMobile ? mobileLayout : desktopLayout}>
      {isMobile && navOpen && <div style={overlayStyle} onClick={() => setNavOpen(false)} />}
      {!isMobile ? sideNav : navOpen ? sideNav : null}

      <main style={{
        gridColumn: '2 / -1',
        display: 'grid',
        gridTemplateRows: 'auto 1fr',
        height: '100vh',
        overflow: 'hidden'
      }}>
        <TopNavBar role={role} currentUser={currentUser} />
        <div style={{
          overflowY: 'auto',
          padding: '1.5rem 2rem',
          backgroundColor: 'var(--shell-bg)'
        }}>
          {toolbar && <div style={{ marginBottom: '1rem' }}>{toolbar}</div>}
          <div style={{ 
            maxWidth: '100%', 
            width: '100%',
            margin: 0,
            padding: 0
          }}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
