'use client';

import { useMemo } from 'react';

import RequireRole from '@/components/RequireRole';
import { RoleHero } from '@/components/dashboard/RoleHero';
import type { HeroStat } from '@/components/dashboard/RoleHero';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';

const heroStats: HeroStat[] = [
  { label: 'Active districts', value: '11', trend: 'Updated 2h ago' },
  { label: 'Registered churches', value: '136', trend: '+12 this quarter' },
  { label: 'Coverage score', value: '97%', trend: 'District pastors assigned' },
];

const listCardStyle = {
  background: 'var(--surface-primary)',
  borderRadius: '24px',
  padding: '2rem',
  boxShadow: '0 20px 42px rgba(24, 76, 140, 0.08)',
  display: 'grid',
  gap: '1rem',
} as const;

const DistrictDirectoryPage = () => {
  const shellConfig = useMemo(
    () => ({
      hero: (
        <RoleHero
          role="UNION_ADMIN"
          headline="View all districts & churches"
          subheadline="Audit coverage across the Union, spot gaps in leadership assignments, and share curated rosters with stakeholders."
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
        <article style={listCardStyle}>
          <header style={{ display: 'grid', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(24,76,140,0.6)' }}>
              District roster
            </span>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.45rem', color: 'var(--primary)' }}>
              Map your coverage
            </h3>
          </header>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.75rem', color: 'var(--muted)' }}>
            <li>• Filter districts by pastor, region, or compliance status.</li>
            <li>• Drill into churches with outstanding attendance submissions.</li>
            <li>• Export contact sheets to share with executive committee.</li>
          </ul>
        </article>

        <article style={listCardStyle}>
          <header style={{ display: 'grid', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(24,76,140,0.6)' }}>
              Smart insights
            </span>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.45rem', color: 'var(--primary)' }}>
              Highlight coverage gaps
            </h3>
          </header>
          <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>
            Surface districts without active pastors, churches not yet registered, and attendance streak risks in real time.
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
            Open directory table
          </button>
        </article>
      </section>
    </RequireRole>
  );
};

export default DistrictDirectoryPage;
