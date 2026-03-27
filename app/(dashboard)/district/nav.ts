import type { NavSection, SidebarSection } from '@/components/dashboard/DashboardShell';

const DISTRICT_NAV_ITEMS = [
  { label: 'Overview', href: '/district/dashboard' },
  { label: 'Manage Churches', href: '/district/churches' },
  { label: 'Attendance Tracker', href: '/district/attendance' },
  { label: 'Church Administrators', href: '/district/church-admins' },
  { label: 'Settings', href: '/district/settings' },
] as const;

export const getDistrictNavSections = (activeHref: string): NavSection[] => [
  {
    items: DISTRICT_NAV_ITEMS.map((item) => ({
      ...item,
      active: item.href === activeHref,
    })),
  },
];

export const DISTRICT_SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: 'Church Oversight',
    description: 'Keep every congregation resourced and compliant.',
    items: [
      {
        label: 'Invite new church admin',
        description: 'Assign a trusted leader to a congregation in your district.',
        href: '/district/church-admins',
      },
      {
        label: 'Review church coverage',
        description: 'Verify every church in your district has an active administrator.',
        href: '/district/church-admins',
      },
    ],
  },
  {
    title: 'Attendance Management',
    description: 'Monitor and approve attendance across all churches.',
    items: [
      {
        label: 'Track attendance',
        description: 'Review and approve attendance submissions from all churches.',
        href: '/district/attendance',
      },
    ],
  },
  {
    title: 'Weekly cadence',
    description: 'Stay ahead of coaching and compliance duties.',
    items: [
      {
        label: 'Dashboard checklist',
        description: 'Track compliance health and prioritize outreach.',
        href: '/district/dashboard',
      },
    ],
  },
  {
    title: 'Account',
    description: 'Manage your personal settings and security.',
    items: [
      {
        label: 'Update profile & security',
        description: 'Change your password and update account information.',
        href: '/district/settings',
      },
    ],
  },
];
