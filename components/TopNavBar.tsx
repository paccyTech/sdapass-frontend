'use client';

import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BarChart2,
  Building2,
  CheckCircle,
  Church,
  ClipboardList,
  Flag,
  Home,
  Landmark,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  User,
  UserCheck,
  Users,
} from 'lucide-react';

import { type RoleKey, ROLE_DEFINITIONS } from '@/lib/rbac';
import type { AuthUser } from '@/lib/auth';
import { useAuthSession } from '@/hooks/useAuthSession';
import { fetchChurchDetail, fetchChurches, fetchDistrictDetail, fetchDistricts } from '@/lib/api';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const navContainer: CSSProperties = {
  position: 'sticky',
  top: 0,
  left: 0,
  right: 0,
  height: '64px',
  backgroundColor: 'var(--shell-bg)',
  borderBottom: '1px solid var(--surface-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 2rem',
  zIndex: 40,
  width: '100%',
  boxSizing: 'border-box',
  boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
  color: 'var(--shell-foreground)',
};

const roleBadge: Record<RoleKey, CSSProperties> = {
  UNION_ADMIN: {
    color: 'var(--shell-foreground)',
    fontSize: '0.85rem',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  DISTRICT_ADMIN: {
    color: 'var(--shell-foreground)',
    fontSize: '0.85rem',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  CHURCH_ADMIN: {
    color: 'var(--shell-foreground)',
    fontSize: '0.85rem',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  MEMBER: {
    color: 'var(--shell-foreground)',
    fontSize: '0.85rem',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  POLICE_VERIFIER: {
    color: 'var(--shell-foreground)',
    fontSize: '0.85rem',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
};

const roleInfoContainer: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  marginRight: 'auto',
};

const userMenuButton: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  background: 'none',
  border: 'none',
  padding: '0.5rem',
  borderRadius: '0.5rem',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  color: 'var(--shell-foreground)',
};

const userAvatar: CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  backgroundColor: 'var(--primary)',
  color: 'var(--on-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 600,
  fontSize: '0.9rem',
  flexShrink: 0,
};

const userInfo: CSSProperties = {
  textAlign: 'left',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
};

const notificationPopover: CSSProperties = {
  position: 'absolute',
  right: 0,
  top: 'calc(100% + 0.5rem)',
  backgroundColor: 'var(--surface-primary)',
  borderRadius: '0.75rem',
  boxShadow: '0 12px 30px rgba(15, 23, 42, 0.18)',
  border: '1px solid var(--surface-border)',
  minWidth: '320px',
  zIndex: 60,
  overflow: 'hidden',
  display: 'grid',
};

const notificationHeader: CSSProperties = {
  padding: '0.85rem 1rem',
  borderBottom: '1px solid var(--surface-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  color: 'var(--shell-foreground)',
  fontWeight: 600,
  fontSize: '0.95rem',
};

const notificationItem: CSSProperties = {
  padding: '0.85rem 1rem',
  borderBottom: '1px solid var(--surface-border)',
  display: 'grid',
  gap: '0.3rem',
  color: 'var(--shell-foreground)',
};

const notificationEmpty: CSSProperties = {
  padding: '1.2rem 1.4rem',
  textAlign: 'center',
  color: 'var(--muted)',
  fontSize: '0.9rem',
};

const userName: CSSProperties = {
  fontWeight: 600,
  color: 'var(--shell-foreground)',
  fontSize: '0.9375rem',
  lineHeight: 1.2,
};

const userRole: CSSProperties = {
  color: 'var(--muted)',
  fontSize: '0.8125rem',
  lineHeight: 1.2,
};

const dropdownMenu: CSSProperties = {
  position: 'absolute',
  right: '1rem',
  top: 'calc(100% + 0.5rem)',
  backgroundColor: 'var(--surface-primary)',
  borderRadius: '0.5rem',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  minWidth: '200px',
  overflow: 'hidden',
  zIndex: 50,
  border: '1px solid var(--surface-border)',
  color: 'var(--shell-foreground)',
};

const dropdownItem: CSSProperties = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  width: '100%',
  background: 'none',
  border: 'none',
  color: 'var(--shell-foreground)',
  fontSize: '0.9375rem',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
};

type MenuLinkItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

type MenuDivider = {
  type: 'divider';
};

type MenuItem = MenuLinkItem | MenuDivider;

const isMenuLink = (item: MenuItem): item is MenuLinkItem => 'href' in item;

const getUserMenuItems = (role: RoleKey): MenuItem[] => {
  const baseItems: MenuItem[] = [
    { label: 'Profile', href: '/profile', icon: <User size={18} /> },
    { label: 'Settings', href: '/settings', icon: <Settings size={18} /> },
    { type: 'divider' },
  ];

  const roleSpecificItems: Record<RoleKey, MenuLinkItem[]> = {
    UNION_ADMIN: [
      { label: 'Union Dashboard', href: '/union', icon: <BarChart2 size={18} /> },
      { label: 'Manage Admins', href: '/union/admins', icon: <Users size={18} /> },
    ],
    DISTRICT_ADMIN: [
      { label: 'District Dashboard', href: '/district', icon: <BarChart2 size={18} /> },
      { label: 'Manage Churches', href: '/district/churches', icon: <Home size={18} /> },
    ],
    CHURCH_ADMIN: [
      { label: 'Church Dashboard', href: '/church', icon: <BarChart2 size={18} /> },
      { label: 'Manage Members', href: '/church/members', icon: <Users size={18} /> },
    ],
    MEMBER: [
      { label: 'My Profile', href: '/member/profile', icon: <User size={18} /> },
      { label: 'My Attendance', href: '/member/attendance', icon: <CheckCircle size={18} /> },
    ],
    POLICE_VERIFIER: [
      { label: 'Verification Portal', href: '/verify', icon: <Search size={18} /> },
      { label: 'Verification History', href: '/verify/history', icon: <ClipboardList size={18} /> },
    ],
  };

  return [
    ...baseItems,
    ...(roleSpecificItems[role] ?? []),
    { type: 'divider' },
    { label: 'Sign out', href: '/logout', icon: <LogOut size={18} /> },
  ];
};

type TopNavBarProps = {
  role: RoleKey;
  currentUser?: AuthUser | null;
};

const getRoleDisplayInfo = (role: RoleKey) => {
  switch (role) {
    case 'UNION_ADMIN':
      return {
        title: 'Union Administrator',
        icon: <Landmark size={20} />,
      };
    case 'DISTRICT_ADMIN':
      return {
        title: 'District Administrator',
        icon: <Building2 size={20} />,
      };
    case 'CHURCH_ADMIN':
      return {
        title: 'Church Administrator',
        icon: <Church size={20} />,
      };
    case 'MEMBER':
      return {
        title: 'Church Member',
        icon: <UserCheck size={20} />,
      };
    case 'POLICE_VERIFIER':
      return {
        title: 'Police Verifier',
        icon: <ShieldCheck size={20} />,
      };
    default:
      return {
        title: 'User',
        icon: <User size={20} />,
      };
  }
};

export const TopNavBar = ({ role, currentUser }: TopNavBarProps) => {
  const menuItems = getUserMenuItems(role);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'EN' | 'FR' | 'RW'>('EN');
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const notificationsMenuRef = useRef<HTMLDivElement>(null);
  const { token, user: sessionUser } = useAuthSession();
  const effectiveUser = currentUser ?? sessionUser ?? null;
  const churchId = effectiveUser?.churchId ?? null;
  const districtId = effectiveUser?.districtId ?? null;

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
      if (languageMenuRef.current && !languageMenuRef.current.contains(target)) {
        setIsLanguageMenuOpen(false);
      }
      if (notificationsMenuRef.current && !notificationsMenuRef.current.contains(target)) {
        setIsNotificationsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getInitials = () => {
    if (!effectiveUser) return 'U';
    const { firstName, lastName } = effectiveUser;
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    if (lastName) return lastName[0].toUpperCase();
    return 'U';
  };

  const roleDisplay = getRoleDisplayInfo(role);
  const languageOptions = [
    { code: 'EN', label: 'English', flag: <Flag size={16} /> },
    { code: 'FR', label: 'French', flag: <Flag size={16} /> },
    { code: 'RW', label: 'Kinyarwanda', flag: <Flag size={16} /> },
  ] as const;
  const activeLanguage = languageOptions.find((lang) => lang.code === selectedLanguage) ?? languageOptions[0];

  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOrgName() {
      if (!token) {
        if (isMounted) {
          setOrgName(null);
        }
        return;
      }

      try {
        if (role === 'CHURCH_ADMIN') {
          if (churchId) {
            const church = await fetchChurchDetail(token, churchId);
            if (isMounted) {
              setOrgName(church?.name ?? null);
            }
            return;
          }

          const churches = await fetchChurches(token);
          if (isMounted) {
            setOrgName(churches?.[0]?.name ?? null);
          }
          return;
        }

        if (role === 'DISTRICT_ADMIN') {
          if (districtId) {
            const district = await fetchDistrictDetail(token, districtId);
            if (isMounted) {
              setOrgName(district?.name ?? null);
            }
            return;
          }

          const districts = await fetchDistricts(token);
          if (isMounted) {
            setOrgName(districts?.[0]?.name ?? null);
          }
          return;
        }

        if (isMounted) {
          setOrgName(null);
        }
      } catch (error) {
        console.error('Failed to load organisation name for top bar', error);
        if (isMounted) {
          setOrgName(null);
        }
      }
    }

    loadOrgName();

    return () => {
      isMounted = false;
    };
  }, [role, churchId, districtId, token]);

  const badgeLabel = useMemo(() => {
    if (role === 'UNION_ADMIN') {
      return 'RWANDA UNION MISSION';
    }

    if (role === 'CHURCH_ADMIN') {
      if (orgName && orgName.trim()) {
        return orgName;
      }
      return 'No church assigned';
    }

    if (role === 'DISTRICT_ADMIN') {
      if (orgName && orgName.trim()) {
        return orgName;
      }
      return 'No district assigned';
    }

    return roleDisplay.title;
  }, [role, orgName, roleDisplay.title]);

  const notifications = useMemo(
    () => [
      {
        id: 'notif-1',
        title: 'Attendance summary ready',
        detail: 'This week’s district attendance has been compiled.',
        time: '2h ago',
      },
      {
        id: 'notif-2',
        title: 'Follow-up reminder',
        detail: '3 churches have pending visit reports to review.',
        time: 'Yesterday',
      },
    ],
    [],
  );

  return (
    <header style={navContainer}>
      <div style={roleInfoContainer}>
        <span style={{ fontSize: '1.25rem', color: 'var(--shell-foreground)' }}>{roleDisplay.icon}</span>
        <div style={roleBadge[role]}>{badgeLabel}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative' }} ref={languageMenuRef}>
          <button
            onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
            style={{
              background: 'var(--surface-soft)',
              border: '1px solid var(--surface-border)',
              borderRadius: '9999px',
              padding: '0.35rem 0.9rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: 'var(--shell-foreground)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
            aria-haspopup="true"
            aria-expanded={isLanguageMenuOpen}
          >
            <span role="img" aria-hidden="true" style={{ fontSize: '1rem' }}>
              {activeLanguage.flag}
            </span>
            {activeLanguage.code}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: isLanguageMenuOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {isLanguageMenuOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                marginTop: '0.35rem',
                backgroundColor: 'var(--surface-primary)',
                borderRadius: '0.5rem',
                boxShadow: '0 8px 20px rgba(15, 23, 42, 0.12)',
                minWidth: '180px',
                border: '1px solid var(--surface-border)',
                zIndex: 60,
                overflow: 'hidden',
              }}
            >
              {languageOptions.map((language) => (
                <button
                  key={language.code}
                  onClick={() => {
                    setSelectedLanguage(language.code);
                    setIsLanguageMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    background: language.code === selectedLanguage ? 'var(--surface-soft)' : 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    color: 'var(--shell-foreground)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{ fontSize: '1rem' }} aria-hidden="true">
                    {language.flag}
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {language.label}
                  </span>
                  {language.code === selectedLanguage && (
                    <span style={{ marginLeft: 'auto', color: 'var(--accent)', fontSize: '0.8rem' }}>Selected</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <ThemeToggle />

        <div style={{ position: 'relative' }} ref={notificationsMenuRef}>
          <button
            onClick={() => {
              setIsNotificationsOpen((prev) => !prev);
              setHasNotifications(false);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '9999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              transition: 'background-color 0.2s ease',
              color: 'var(--shell-foreground)',
            }}
            aria-label="Notifications"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {hasNotifications && (
              <span style={{
                position: 'absolute',
                top: '0.25rem',
                right: '0.25rem',
                width: '0.5rem',
                height: '0.5rem',
                backgroundColor: 'var(--danger)',
                borderRadius: '50%',
                border: '2px solid var(--shell-bg)'
              }} />
            )}
          </button>
          {isNotificationsOpen && (
            <div style={notificationPopover}>
              <div style={notificationHeader}>
                <span>Notifications</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsNotificationsOpen(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--muted)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div key={notification.id} style={notificationItem}>
                    <div style={{ fontWeight: 600 }}>{notification.title}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{notification.detail}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{notification.time}</div>
                  </div>
                ))
              ) : (
                <div style={notificationEmpty}>You’re all caught up. No new notifications.</div>
              )}
            </div>
          )}
        </div>

        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            style={userMenuButton}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
          >
            <div style={userAvatar}>
              {getInitials()}
            </div>
            <div style={userInfo}>
              <span style={userName}>
                {effectiveUser?.firstName || 'User'}
              </span>
              <span style={userRole}>
                {ROLE_DEFINITIONS[role]?.name || role}
              </span>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transition: 'transform 0.2s ease',
                transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0)',
              }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {isMenuOpen && (
            <div style={dropdownMenu}>
              <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--surface-border)' }}>
                <div style={userName}>{effectiveUser?.firstName} {effectiveUser?.lastName}</div>
                <div style={{
                  ...userRole,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginTop: '0.25rem',
                }}>
                  <span style={roleBadge[role]}>{ROLE_DEFINITIONS[role]?.name || role}</span>
                </div>
              </div>
              
              <div style={{ padding: '0.5rem 0' }}>
                {menuItems.map((item, index) => {
                  if (!isMenuLink(item)) {
                    return (
                      <div
                        key={`divider-${index}`}
                        style={{ height: '1px', backgroundColor: 'var(--surface-border)', margin: '0.5rem 0' }}
                      />
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{
                        ...dropdownItem,
                        textDecoration: 'none',
                        color: item.label === 'Sign out' ? 'var(--danger)' : 'var(--shell-foreground)',
                      }}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
