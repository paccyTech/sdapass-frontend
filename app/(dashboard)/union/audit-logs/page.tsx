'use client';

import { useEffect, useMemo, useState } from 'react';

import RequireRole from '@/components/RequireRole';
import { RoleHero } from '@/components/dashboard/RoleHero';
import type { HeroStat } from '@/components/dashboard/RoleHero';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';
import { fetchAuditLogs, type AuditLogEntry, type AuditLogSummary } from '@/lib/api';
import { useAuthSession } from '@/hooks/useAuthSession';
import type { RoleKey } from '@/lib/rbac';

const heroStats: HeroStat[] = [
  { label: 'Events captured (30d)', value: 'Live', trend: 'Auto-refresh enabled' },
  { label: 'Distinct actors', value: '—', trend: 'Calculated per fetch' },
  { label: 'Retention window', value: '180 days', trend: 'Policy compliant' },
];

const PageShell = ({
  children,
  summary,
}: {
  children: React.ReactNode;
  summary: AuditLogSummary | null;
}) => {
  const uniqueActors = summary ? new Set(summary.logs.map((entry) => entry.userId ?? entry.userName)).size : '—';

  const stats = useMemo(() => {
    return [
      heroStats[0],
      { label: 'Distinct actors', value: typeof uniqueActors === 'number' ? uniqueActors.toString() : '—', trend: 'Union-wide activity' },
      heroStats[2],
    ] satisfies HeroStat[];
  }, [uniqueActors]);

  const shellConfig = useMemo(
    () => ({
      hero: (
        <RoleHero
          role="UNION_ADMIN"
          headline="System audit logs"
          subheadline="Monitor every change across Umuganda—identity, governance, and policy actions—in a single authoritative trail."
          stats={stats}
        />
      ),
    }),
    [stats],
  );

  useDashboardShellConfig(shellConfig);

  return <div style={{ display: 'grid', gap: '1.5rem' }}>{children}</div>;
};

type FilterState = {
  search: string;
  action: string;
  role: RoleKey | '';
};

const tableShell: React.CSSProperties = {
  background: 'var(--surface-primary)',
  borderRadius: '24px',
  boxShadow: '0 20px 42px rgba(24, 76, 140, 0.08)',
  overflow: 'hidden',
  border: '1px solid rgba(15, 59, 114, 0.08)',
};

const headerRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(180px, 2fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(140px, 1fr) minmax(220px, 1.6fr)',
  gap: '1rem',
  padding: '1rem 1.75rem',
  fontSize: '0.78rem',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-soft-accent)',
  background: 'var(--surface-soft)',
  fontWeight: 600,
  borderBottom: '1px solid var(--surface-border)',
};

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: headerRow.gridTemplateColumns,
  gap: '1rem',
  padding: '1.05rem 1.75rem',
  fontSize: '0.9rem',
  color: 'var(--shell-foreground)',
  borderTop: '1px solid var(--surface-border)',
};

const filtersShell: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.85rem',
  alignItems: 'center',
  padding: '1.25rem 1.5rem 0',
  background: 'var(--surface-primary)',
};

const inputStyle: React.CSSProperties = {
  padding: '0.6rem 0.85rem',
  borderRadius: '12px',
  border: '1px solid var(--surface-border)',
  fontSize: '0.9rem',
  fontFamily: 'inherit',
  background: 'var(--surface-soft)',
  color: 'var(--shell-foreground)',
};

const AuditLogsPage = () => {
  const { token } = useAuthSession();
  const [filters, setFilters] = useState<FilterState>({ search: '', action: '', role: '' });
  const [logs, setLogs] = useState<AuditLogSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchAuditLogs(token, {
          search: filters.search.trim() || undefined,
          action: filters.action || undefined,
          role: filters.role || undefined,
          cursor: cursor || undefined,
          limit: 25,
        });
        if (!cancelled) {
          setLogs(result);
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load audit logs';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [token, filters, cursor]);

  const hasData = Boolean(logs?.logs.length);

  return (
    <RequireRole allowed="UNION_ADMIN">
      <PageShell summary={logs}>
        <section style={tableShell}>
          <div style={filtersShell}>
            <input
              style={{ ...inputStyle, minWidth: '220px' }}
              placeholder="Search actor, action, IP or device"
              value={filters.search}
              onChange={(event) => {
                setCursor(null);
                setFilters((prev) => ({ ...prev, search: event.target.value }));
              }}
            />
            <input
              style={{ ...inputStyle, minWidth: '140px' }}
              placeholder="Filter action"
              value={filters.action}
              onChange={(event) => {
                setCursor(null);
                setFilters((prev) => ({ ...prev, action: event.target.value }));
              }}
            />
            <select
              style={{ ...inputStyle, minWidth: '160px' }}
              value={filters.role}
              onChange={(event) => {
                setCursor(null);
                setFilters((prev) => ({ ...prev, role: event.target.value as RoleKey | '' }));
              }}
            >
              <option value="">All roles</option>
              <option value="UNION_ADMIN">Union Admin</option>
              <option value="DISTRICT_ADMIN">District Pastor</option>
              <option value="CHURCH_ADMIN">Church Admin</option>
              <option value="MEMBER">Member</option>
              <option value="POLICE_VERIFIER">Police Verifier</option>
            </select>
            <button
              type="button"
              style={{
                border: 'none',
                borderRadius: '12px',
                padding: '0.6rem 1rem',
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                color: 'var(--on-primary)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onClick={() => {
                setCursor(null);
                setFilters({ search: '', action: '', role: '' });
              }}
            >
              Clear filters
            </button>
          </div>

          <div style={headerRow}>
            <span>Actor</span>
            <span>Role</span>
            <span>Action</span>
            <span>IP address</span>
            <span>Device</span>
          </div>

          <div style={{ minHeight: '320px', display: 'grid' }}>
            {loading && (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.95rem' }}>
                Loading audit trail…
              </div>
            )}

            {!loading && error && (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#B91C1C', fontSize: '0.95rem', fontWeight: 600 }}>
                {error}
              </div>
            )}

            {!loading && !error && !hasData && (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.95rem' }}>
                No audit entries match the current filters.
              </div>
            )}

            {!loading && !error && hasData && (
              <div>
                {logs?.logs.map((entry) => {
                  const timestamp = new Date(entry.createdAt).toLocaleString();
                  const device = entry.userAgent ?? 'Unknown device';
                  const details = entry.action === 'auth.login' && entry.details && 'via' in entry.details ? ` (${entry.details.via})` : '';
                  return (
                    <div key={entry.id} style={rowStyle}>
                      <div style={{ display: 'grid', gap: '0.2rem' }}>
                        <strong style={{ fontSize: '1rem' }}>{entry.userName}</strong>
                        <span style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>{timestamp}</span>
                        {details ? (
                          <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{details}</span>
                        ) : null}
                      </div>
                      <span>{entry.userRole ?? '—'}</span>
                      <span>{entry.action}</span>
                      <span>{entry.ipAddress ?? '—'}</span>
                      <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{device}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <footer
            style={{
              padding: '1rem 1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid rgba(24,76,140,0.08)',
              background: 'rgba(24, 76, 140, 0.04)',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              Showing {logs?.logs.length ?? 0} of {logs?.total ?? 0} events
            </span>
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                type="button"
                style={{ ...inputStyle, cursor: 'pointer', borderRadius: '10px' }}
                disabled={!cursor || loading}
                onClick={() => setCursor(null)}
              >
                Newest
              </button>
              <button
                type="button"
                style={{ ...inputStyle, cursor: 'pointer', borderRadius: '10px' }}
                disabled={!logs?.nextCursor || loading}
                onClick={() => setCursor(logs?.nextCursor ?? null)}
              >
                Load older
              </button>
            </div>
          </footer>
        </section>
      </PageShell>
    </RequireRole>
  );
};

export default AuditLogsPage;
