'use client';

import type { CSSProperties } from 'react';

import { ACTION_MATRIX, ORDERED_ROLES, ROLE_DEFINITIONS, type RoleKey } from '@/lib/rbac';

type ActionMatrixProps = {
  emphasisRole?: RoleKey;
};

const wrapperStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.92)',
  borderRadius: '28px',
  padding: '2rem',
  boxShadow: '0 25px 55px rgba(12, 34, 56, 0.15)',
  display: 'grid',
  gap: '1.5rem',
};

const headerStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `minmax(160px, 2fr) repeat(${ORDERED_ROLES.length}, minmax(90px, 1fr))`,
  alignItems: 'center',
  gap: '1px',
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
  color: 'rgba(12,34,56,0.6)',
};

const rowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: `minmax(160px, 2fr) repeat(${ORDERED_ROLES.length}, minmax(90px, 1fr))`,
  alignItems: 'stretch',
  gap: '1px',
};

const actionCell: CSSProperties = {
  padding: '0.85rem 1rem',
  background: 'rgba(12,34,56,0.04)',
  fontWeight: 600,
  fontSize: '0.95rem',
};

const roleHeaderCell = (role: RoleKey, isEmphasis: boolean): CSSProperties => ({
  padding: '0.75rem 0.5rem',
  textAlign: 'center',
  background: isEmphasis ? 'rgba(24,76,140,0.12)' : 'rgba(12,34,56,0.04)',
  borderRadius: '16px',
  fontWeight: 600,
  color: isEmphasis ? ROLE_DEFINITIONS[role].accent.primary : 'rgba(12,34,56,0.65)',
});

const cellStyle = (allowed: boolean, role: RoleKey, isEmphasis: boolean): CSSProperties => {
  if (!allowed) {
    return {
      padding: '0.9rem 0.5rem',
      textAlign: 'center',
      background: 'rgba(12,34,56,0.03)',
      color: 'rgba(12,34,56,0.25)',
      fontWeight: 600,
    };
  }

  const { accent } = ROLE_DEFINITIONS[role];
  return {
    padding: '0.9rem 0.5rem',
    textAlign: 'center',
    fontWeight: 700,
    color: 'white',
    background: `linear-gradient(135deg, ${accent.primary}, ${accent.secondary})`,
    borderRadius: '18px',
    boxShadow: isEmphasis ? '0 16px 32px rgba(24,76,140,0.28)' : '0 12px 24px rgba(24,76,140,0.18)',
  };
};

export const ActionMatrix = ({ emphasisRole }: ActionMatrixProps) => {
  return (
    <section style={wrapperStyle}>
      <header style={{ display: 'grid', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(12,34,56,0.5)' }}>
          RBAC policy snapshot
        </span>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.65rem', color: '#0b1f33' }}>
          Who can perform each action?
        </h3>
        <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>
          Capabilities align tightly to the SDA Umuganda governance flow. Use this matrix to verify permissions before assigning tasks.
        </p>
      </header>

      <div style={headerStyle}>
        <span />
        {ORDERED_ROLES.map((role) => (
          <span
            key={role}
            style={roleHeaderCell(role, role === emphasisRole)}
          >
            {ROLE_DEFINITIONS[role].name}
          </span>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {ACTION_MATRIX.map(({ action, allowedRoles }) => (
          <div key={action} style={rowStyle}>
            <div style={actionCell}>{action}</div>
            {ORDERED_ROLES.map((role) => {
              const allowed = allowedRoles.includes(role);
              return (
                <div key={role} style={cellStyle(allowed, role, role === emphasisRole)}>
                  {allowed ? '✔' : '—'}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
};
