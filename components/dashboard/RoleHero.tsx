'use client';

import type { CSSProperties } from 'react';
import { useMemo } from 'react';

import type { RoleDefinition, RoleKey } from '@/lib/rbac';
import { ROLE_DEFINITIONS } from '@/lib/rbac';

export type HeroStat = {
  label: string;
  value: string;
  trend?: string;
};

type RoleHeroProps = {
  role: RoleKey;
  headline: string;
  subheadline: string;
  stats: HeroStat[];
  actions?: React.ReactNode;
};

const heroShell: CSSProperties = {
  borderRadius: '32px',
  padding: '2.8rem clamp(2rem, 4vw, 3.2rem)',
  background: '#fff',
  display: 'grid',
  gap: '2.4rem',
};

const heroContent: CSSProperties = {
  display: 'grid',
  gap: '2rem',
};

const statsGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '1.35rem',
};

const statTile: CSSProperties = {
  background: 'rgba(24,76,140,0.05)',
  borderRadius: '18px',
  padding: '1.4rem',
};

const statLabel: CSSProperties = {
  textTransform: 'uppercase',
  fontSize: '0.75rem',
  letterSpacing: '0.14em',
  color: 'rgba(24,76,140,0.55)',
  marginBottom: '0.6rem',
};

export const RoleHero = ({ role, headline, subheadline, stats, actions }: RoleHeroProps) => {
  const definition: RoleDefinition | undefined = useMemo(() => ROLE_DEFINITIONS[role], [role]);

  if (!definition) {
    return null;
  }

  return (
    <header style={heroShell}>
      <div style={heroContent}>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 2.3vw + 1rem, 3.2rem)',
              lineHeight: 1.1,
              color: definition.accent.primary,
            }}
          >
            {headline}
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '1.05rem',
              lineHeight: 1.7,
              maxWidth: '680px',
              color: 'rgba(33, 56, 78, 0.78)',
            }}
          >
            {subheadline}
          </p>
        </div>

        <div style={statsGrid}>
          {stats.map((stat) => (
            <article key={stat.label} style={statTile}>
              <span style={statLabel}>{stat.label}</span>
              <strong
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2rem',
                  lineHeight: 1,
                  color: definition.accent.primary,
                }}
              >
                {stat.value}
              </strong>
              {stat.trend && (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'rgba(24,76,140,0.7)' }}>
                  {stat.trend}
                </p>
              )}
            </article>
          ))}
        </div>

        {actions && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};
