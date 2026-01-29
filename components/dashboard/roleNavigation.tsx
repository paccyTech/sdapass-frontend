import type { ReactNode } from 'react';

import {
  IconChartHistogram,
  IconClipboardList,
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
      { label: 'Dashboard', href: '/union/dashboard', icon: <IconGauge size={18} stroke={1.6} /> },
      { label: 'Governance', href: '/union/governance', icon: <IconClipboardList size={18} stroke={1.6} /> },
      { label: 'Reports', href: '/union/reports', icon: <IconReportAnalytics size={18} stroke={1.6} /> },
      { label: 'District Pastors', href: '/union/district-pastors', icon: <IconUsersGroup size={18} stroke={1.6} /> },
      { label: 'Policies', href: '/union/policy', icon: <IconFileCertificate size={18} stroke={1.6} /> },
      { label: 'Audit Logs', href: '/union/audit-logs', icon: <IconFileSearch size={18} stroke={1.6} /> },
      { label: 'System Settings', href: '/union/settings', icon: <IconSettings size={18} stroke={1.6} /> },
    ],
    sidebarSections: [],
  },
  DISTRICT_ADMIN: {
    navItems: [
      { label: 'Overview', href: '/district/dashboard', icon: <IconLayoutDashboard size={18} stroke={1.6} /> },
      { label: 'Church Administrators', href: '/district/church-admins', icon: <IconUsers size={18} stroke={1.6} /> },
      { label: 'Manage Churches', href: '/district/churches', icon: <IconMap2 size={18} stroke={1.6} /> },
      { label: 'Attendance Tracker', href: '/district/dashboard#attendance', icon: <IconChartHistogram size={18} stroke={1.6} /> },
      { label: 'District Reports', href: '/district/reports', icon: <IconReportAnalytics size={18} stroke={1.6} /> },
      { label: 'Pass Issuance', href: '/district/dashboard#passes', icon: <IconIdBadge size={18} stroke={1.6} /> },
    ],
    sidebarSections: [],
  },
  CHURCH_ADMIN: {
    navItems: [
      { label: 'Dashboard', href: '/church/dashboard', icon: <IconLayoutDashboard size={18} stroke={1.6} /> },
      { label: 'Members', href: '/church/members', icon: <IconUsersGroup size={18} stroke={1.6} /> },
      { label: 'Church Reports', href: '/church/reports', icon: <IconReportAnalytics size={18} stroke={1.6} /> },
      { label: 'SMS & Email', href: '/church/sms', icon: <IconClipboardList size={18} stroke={1.6} /> },
      { label: 'Attendance Log', href: '/church/attendance', icon: <IconChartHistogram size={18} stroke={1.6} /> },
      { label: 'Volunteer Management', href: '/church/volunteers', icon: <IconUsers size={18} stroke={1.6} /> },
    ],
    sidebarSections: [],
  },
  MEMBER: {
    navItems: [
      { label: 'My Dashboard', href: '/member/dashboard', icon: <IconIdBadge size={18} stroke={1.6} /> },
      { label: 'My Umuganda Pass', href: '/member/pass', icon: <IconFileCertificate size={18} stroke={1.6} /> },
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
