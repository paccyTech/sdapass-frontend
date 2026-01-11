'use client';

import { useMemo } from 'react';

import RequireRole from '@/components/RequireRole';
import { RoleHero } from '@/components/dashboard/RoleHero';
import type { HeroStat } from '@/components/dashboard/RoleHero';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';

const heroStats: HeroStat[] = [
  { label: 'Systems in scope', value: '7', trend: 'Core services managed by union HQ' },
  { label: 'Ownership changes (Q3)', value: '3', trend: 'All completed with approvals' },
  { label: 'Governance score', value: '98%', trend: 'Compliance with SDA policy' },
];

const infoCardStyle = {
  background: 'var(--surface-primary)',
  borderRadius: '24px',
  padding: '2rem',
  boxShadow: '0 20px 42px rgba(24, 76, 140, 0.08)',
  display: 'grid',
  gap: '1rem',
} as const;

const GovernancePage = () => {
  const shellConfig = useMemo(
    () => ({
      hero: (
        <RoleHero
          role="UNION_ADMIN"
          headline="System ownership & governance"
          subheadline="Define who maintains mission-critical infrastructure and verify stewardship stays aligned with Union directives."
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
        <article style={infoCardStyle}>
          <header style={{ display: 'grid', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(24,76,140,0.6)' }}>
              Accountability map
            </span>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.45rem', color: 'var(--primary)' }}>
              Assign stewardship
            </h3>
          </header>
          <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>
            Track who owns messaging, infrastructure, and analytics stacks. Capture back-up stewards and escalation paths per district.
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.6rem', color: 'var(--muted)' }}>
            <li>• Attach supporting documentation and policy references.</li>
            <li>• Auto-notify replacements when tenure ends.</li>
            <li>• Export assignments for quarterly audits.</li>
          </ul>
        </article>

        <article style={infoCardStyle}>
          <header style={{ display: 'grid', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(24,76,140,0.6)' }}>
              Audit readiness
            </span>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.45rem', color: 'var(--primary)' }}>
              Evidence locker
            </h3>
          </header>
          <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>
            Store policy approvals, transition letters, and compliance attestations linked to leadership signatures.
          </p>
          <button
            type="button"
            style={{
              justifySelf: 'flex-start',
              border: 'none',
              borderRadius: '16px',
              padding: '0.7rem 1.3rem',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 18px 32px rgba(24, 76, 140, 0.18)',
            }}
          >
            Log new ownership record
          </button>
        </article>
      </section>
    </RequireRole>
  );
};

export default GovernancePage;
