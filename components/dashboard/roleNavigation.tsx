import type { ReactNode } from 'react';

import {
  IconChartHistogram,
  IconClipboardList,
  IconCalendarEvent,
  IconFileCertificate,
  IconFileSearch,
  IconGauge,
  IconIdBadge,
  IconLayoutDashboard,
  IconMap2,
  IconReportAnalytics,
  IconShieldCheck,
  IconUsers,
  IconUsersGroup,
  IconSettings,
} from '@tabler/icons-react';

import type { NavSection, SidebarSection } from './DashboardShell';
import type { RoleKey } from '@/lib/rbac';

export type RoleNavItem = {
  label: string;
  description?: string;
  href: string;
  badge?: string;
  icon?: ReactNode;
};

type RoleNavigationDefinition = {
  navItems?: RoleNavItem[];
  sidebarSections?: SidebarSection[];
};

const ROLE_NAVIGATION: Record<RoleKey, RoleNavigationDefinition> = {
  UNION_ADMIN: {
    navItems: [
      { label: 'Dashboard', description: 'View union overview and stats', href: '/union/dashboard', icon: <IconGauge size={18} stroke={1.6} color="#ff8f3d" /> },
      { label: 'Umuganda Events', description: 'Manage umuganda events', href: '/union/umuganda-events', icon: <IconCalendarEvent size={18} stroke={1.6} color="#ff8f3d" /> },
      { label: 'Reports', description: 'View union reports and analytics', href: '/union/reports', icon: <IconReportAnalytics size={18} stroke={1.6} color="#ff8f3d" /> },
      { label: 'District Pastors', description: 'Manage district pastors', href: '/union/district-pastors', icon: <IconUsersGroup size={18} stroke={1.6} color="#ff8f3d" /> },
      { label: 'Audit Logs', description: 'View audit logs', href: '/union/audit-logs', icon: <IconFileSearch size={18} stroke={1.6} color="#ff8f3d" /> },
      { label: 'System Settings', description: 'Manage system settings', href: '/union/settings', icon: <IconSettings size={18} stroke={1.6} color="#ff8f3d" /> },
    ],
    sidebarSections: [],
  },
  DISTRICT_ADMIN: {
    navItems: [
      { label: 'Overview', description: 'View district overview and stats', href: '/district/dashboard', icon: <IconLayoutDashboard size={18} stroke={1.6} color="#ff8f3d" /> },
      { label: 'Church admins', description: 'Manage church admins and roles', href: '/district/church-admins', icon: <IconUsers size={18} stroke={1.6} color="#ff8f3d" /> },
      { label: 'Manage Churches', description: 'Add and edit church details', href: '/district/churches', icon: <IconMap2 size={18} stroke={1.6} color="#ff8f3d" /> },
      { label: 'Attendance Tracker', description: 'Track attendance records', href: '/district/dashboard#attendance', icon: <IconChartHistogram size={18} stroke={1.6} color="#ff8f3d" /> },
      { label: 'District Reports', description: 'View district reports and analytics', href: '/district/reports', icon: <IconReportAnalytics size={18} stroke={1.6} color="#ff8f3d" /> },
      { label: 'Pass Issuance', description: 'Issue and manage passes', href: '/district/dashboard#passes', icon: <IconIdBadge size={18} stroke={1.6} color="#ff8f3d" /> },
      { label: 'Settings', description: 'Manage your account settings', href: '/district/settings', icon: <IconSettings size={18} stroke={1.6} color="#ff8f3d" /> },
    ],
    sidebarSections: [],
  },
  CHURCH_ADMIN: {
    navItems: [
      { label: 'Dashboard', description: 'View church overview and stats', href: '/church/dashboard', icon: <IconLayoutDashboard size={18} stroke={1.6} color="#ff8f3d" /> },
      { label: 'Members', description: 'Manage church members', href: '/church/members', icon: <IconUsersGroup size={18} stroke={1.6} color="#ff8f3d" /> },
      { label: 'Umuganda Events', description: 'Participate in umuganda events', href: '/church/umuganda-events', icon: <IconCalendarEvent size={18} stroke={1.6} color="#ff8f3d" /> },
      { label: 'Church Reports', description: 'View church reports and analytics', href: '/church/reports', icon: <IconReportAnalytics size={18} stroke={1.6} color="#ff8f3d" /> },
      { label: 'SMS & Email', description: 'Send SMS and email notifications', href: '/church/sms', icon: <IconClipboardList size={18} stroke={1.6} color="#ff8f3d" /> },
      { label: 'Attendance Log', description: 'Log and track attendance', href: '/church/attendance', icon: <IconChartHistogram size={18} stroke={1.6} color="#ff8f3d" /> },
      { label: 'Settings', description: 'Manage your account settings', href: '/church/settings', icon: <IconSettings size={18} stroke={1.6} color="#ff8f3d" /> },
    ],
    sidebarSections: [],
  },
  MEMBER: {
    navItems: [
      { label: 'My Dashboard', href: '/', icon: <IconIdBadge size={18} stroke={1.6} color="#ff8f3d" /> },
      { label: 'My Umuganda Pass', href: '/', icon: <IconFileCertificate size={18} stroke={1.6} color="#ff8f3d" /> },
    ],
  },
  POLICE_VERIFIER: {
    navItems: [
      { label: 'Verify passes', href: '/police/verify', icon: <IconShieldCheck size={18} stroke={1.6} /> },
    ],
    sidebarSections: [
      {
        title: 'Verification tools',
        items: [
          { label: 'Scan QR code', href: '/police/verify' },
          { label: 'Manual lookup', href: '/police/verify#manual' },
        ],
      },
      {
        title: 'Guides',
        items: [
          { label: 'How verification works', href: '/police/verify#guide' },
          { label: 'Escalation contacts', href: '/police/verify#contacts' },
        ],
      },
    ],
  },
};

const isActiveNavItem = (itemHref: string, activeHref: string): boolean => {
  if (itemHref === activeHref) {
    return true;
  }
  if (!itemHref || !activeHref) {
    return false;
  }
  const normalizedItem = itemHref.replace(/\/$/, '');
  const normalizedActive = activeHref.replace(/\/$/, '');
  return normalizedActive.startsWith(`${normalizedItem}/`);
};

export const getRoleNavItems = (role: RoleKey): RoleNavItem[] =>
  ROLE_NAVIGATION[role]?.navItems ?? [];

export const getRoleNavSections = (role: RoleKey, activeHref: string): NavSection[] => {
  const items = getRoleNavItems(role);
  if (!items.length) {
    return [];
  }

  return [
    {
      items: items.map((item) => ({
        ...item,
        active: isActiveNavItem(item.href, activeHref),
      })),
    },
  ];
};

export const getRoleSidebarSections = (role: RoleKey): SidebarSection[] =>
  ROLE_NAVIGATION[role]?.sidebarSections ?? [];

export const getRoleNavigation = (
  role: RoleKey,
  activeHref: string,
): { navSections: NavSection[]; sidebarSections: SidebarSection[] } => ({
  navSections: getRoleNavSections(role, activeHref),
  sidebarSections: getRoleSidebarSections(role),
});
