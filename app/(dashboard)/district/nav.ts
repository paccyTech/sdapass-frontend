import type { NavSection, SidebarSection } from '@/components/dashboard/DashboardShell';

const DISTRICT_NAV_ITEMS = [
  { label: 'Overview', href: '/district/dashboard' },
  { label: 'Church Administrators', href: '/district/church-admins' },
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
];
