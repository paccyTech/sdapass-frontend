'use client';

import { useMemo } from 'react';

import RequireRole from '@/components/RequireRole';
import { RoleHero } from '@/components/dashboard/RoleHero';
import type { HeroStat } from '@/components/dashboard/RoleHero';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';

const heroStats: HeroStat[] = [
  { label: 'Policies tracked', value: '42', trend: 'All current & signed' },
  { label: 'Access reviews (90d)', value: '118', trend: 'Last cycle completed yesterday' },
  { label: 'Open exceptions', value: '2', trend: 'Pending resolution this week' },
];

const cardStyle = {
  background: 'var(--surface-primary)',
  borderRadius: '24px',
  padding: '2rem',
  boxShadow: '0 20px 42px rgba(24, 76, 140, 0.08)',
  display: 'grid',
  gap: '1rem',
} as const;

const PolicyPage = () => {
  const shellConfig = useMemo(
    () => ({
      hero: (
        <RoleHero
          role="UNION_ADMIN"
          headline="Policy & access control"
          subheadline="Codify how Union systems are used, certify permissions, and enforce SDA governance standards across districts."
          stats={heroStats}
        />
      ),
    }),
    [],
  );

  useDashboardShellConfig(shellConfig);

  return (
    <RequireRole allowed="UNION_ADMIN">
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.75rem',
        }}
      >
        <article style={cardStyle}>
          <header style={{ display: 'grid', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(24,76,140,0.6)' }}>
              Control matrix
            </span>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.45rem', color: 'var(--primary)' }}>
              Map role permissions
            </h3>
          </header>
          <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>
            Document which actions each role can perform, align with compliance mandates, and flag exceptions for review.
          </p>
        </article>

        <article style={cardStyle}>
          <header style={{ display: 'grid', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(24,76,140,0.6)' }}>
              Certification cycle
            </span>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.45rem', color: 'var(--primary)' }}>
              Schedule access reviews
            </h3>
          </header>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.75rem', color: 'var(--muted)' }}>
            <li>• Automate quarterly attestations from district leaders.</li>
            <li>• Track members with elevated access for audits.</li>
            <li>• Export evidence packs for denominational oversight.</li>
          </ul>
        </article>
      </section>
    </RequireRole>
  );
};

export default PolicyPage;
