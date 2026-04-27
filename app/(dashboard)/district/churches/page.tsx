'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';

import { IconBuildingChurch, IconMapPin } from '@tabler/icons-react';

import RequireRole from '@/components/RequireRole';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import {
  fetchChurchAdmins,
  fetchChurches,
  type ChurchAdminSummary,
  type ChurchSummary,
} from '@/lib/api';

const pageWrapperStyle: CSSProperties = {
  display: 'grid',
  gap: '2.5rem',
  maxWidth: '1400px',
  margin: '0 auto',
};

const cardStyle: CSSProperties = {
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  borderRadius: '20px',
  padding: '2rem',
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1)',
  border: '1px solid rgba(226, 232, 240, 0.8)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  position: 'relative',
  overflow: 'hidden',
};

const statGridStyle: CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
};

const statCardStyle: CSSProperties = {
  ...cardStyle,
  padding: '1.75rem',
  gap: '1rem',
  background: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)',
  border: '1px solid rgba(226, 232, 240, 0.6)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
};

const statLabelStyle: CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: '600',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#64748b',
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const statValueStyle: CSSProperties = {
  fontSize: '2.5rem',
  fontWeight: '700',
  margin: 0,
  color: '#1e293b',
  lineHeight: '1.2',
};

const statContextStyle: CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontSize: '0.9rem',
  lineHeight: '1.5',
};

const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: '1rem',
  alignItems: 'flex-start',
  paddingBottom: '1rem',
  borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.75rem',
  fontWeight: '700',
  color: '#1e293b',
  lineHeight: '1.3',
};

const mutedTextStyle: CSSProperties = {
  margin: '0.5rem 0 0',
  color: '#64748b',
  lineHeight: '1.6',
  fontSize: '0.95rem',
};


const primaryButtonStyle: CSSProperties = {
  border: 'none',
  borderRadius: '12px',
  padding: '0.75rem 1.5rem',
  background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
  color: '#ffffff',
  fontWeight: '600',
  fontSize: '0.875rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)',
  transition: 'all 0.2s ease',
};

const tagStyle = (tone: 'accent' | 'danger' | 'muted'): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  borderRadius: '999px',
  padding: '0.3rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: '600',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  background:
    tone === 'accent'
      ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
      : tone === 'danger'
      ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
      : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
  color: tone === 'accent' ? '#1e3a8a' : tone === 'danger' ? '#dc2626' : '#64748b',
  border: `1px solid ${
    tone === 'accent' ? '#93c5fd' : tone === 'danger' ? '#fecaca' : '#cbd5e1'
  }`,
});

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
  fontSize: '0.875rem',
};

const tableHeaderStyle: CSSProperties = {
  textAlign: 'left',
  fontSize: '0.8rem',
  fontWeight: '600',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: '#475569',
  padding: '0.875rem 1rem',
  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
  borderBottom: '2px solid #cbd5e1',
};

const tableCellStyle: CSSProperties = {
  padding: '0.875rem 1rem',
  borderTop: '1px solid rgba(226, 232, 240, 0.8)',
  verticalAlign: 'top',
  transition: 'background-color 0.15s ease',
};

const emptyStateStyle: CSSProperties = {
  border: '1px dashed rgba(148, 163, 184, 0.4)',
  borderRadius: '16px',
  padding: '3rem',
  textAlign: 'center',
  color: '#94a3b8',
  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
};


const ManageChurchesPage = () => {
  const { token, user } = useAuthSession();
  const districtId = user?.districtId ?? null;

  const [churches, setChurches] = useState<ChurchSummary[]>([]);
  const [admins, setAdmins] = useState<ChurchAdminSummary[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const shellConfig = useMemo(
    () => ({
      hero: null,
    }),
    [],
  );

  useDashboardShellConfig(shellConfig);

  useEffect(() => {
    if (!token || !districtId) {
      return;
    }

    let active = true;
    setStatus('loading');
    setError(null);

    (async () => {
      try {
        const [churchList, adminList] = await Promise.all([
          fetchChurches(token, { districtId }),
          fetchChurchAdmins(token, { districtId }),
        ]);

        if (!active) {
          return;
        }

        setChurches(churchList ?? []);
        setAdmins(adminList ?? []);
        setStatus('loaded');
      } catch (err) {
        if (!active) {
          return;
        }
        console.error('Failed to load churches', err);
        const message = err instanceof Error ? err.message : 'Unable to load churches at this time.';
        setError(message);
        setStatus('error');
      }
    })();

    return () => {
      active = false;
    };
  }, [token, districtId]);

  const adminsByChurch = useMemo(() => {
    const map = new Map<string, ChurchAdminSummary[]>();
    admins.forEach((admin) => {
      if (!admin.churchId) return;
      const list = map.get(admin.churchId) ?? [];
      if (admin.isActive) {
        map.set(admin.churchId, [...list, admin]);
      }
    });
    return map;
  }, [admins]);

  const stats = useMemo(() => {
    const total = churches.length;
    const withAdmin = churches.filter((church) => (adminsByChurch.get(church.id)?.length ?? 0) > 0).length;
    const withoutAdmin = total - withAdmin;
    const totalMembers = churches.reduce((sum, church) => sum + (church._count?.members ?? 0), 0);

    return [
      {
        label: 'Churches in district',
        value: total.toString(),
        context: total ? `${withAdmin} covered with active admins` : 'No congregations yet',
      },
      {
        label: 'Need administrator',
        value: withoutAdmin.toString(),
        context: withoutAdmin === 0 ? 'All churches staffed' : 'Prioritize new admin invitations',
      },
      {
        label: 'Registered members',
        value: totalMembers.toString(),
        context: 'Based on member roster per church',
      },
    ];
  }, [churches, adminsByChurch]);

  const renderStatus = () => {
    if (status === 'loading' || status === 'idle') {
      return (
        <div style={cardStyle}>
          <p style={{ margin: 0, color: 'var(--muted)' }}>Loading churches…</p>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Unable to load churches</h2>
          <p style={mutedTextStyle}>{error}</p>
          <button type="button" style={primaryButtonStyle} onClick={() => window.location.reload()}>
            Retry loading
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <RequireRole allowed="DISTRICT_ADMIN">
      <div style={pageWrapperStyle}>
        {renderStatus()}

        {status === 'loaded' && (
          <>
            <div>
              <header style={sectionHeaderStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>Church directory</h2>
                  <p style={mutedTextStyle}>
                    Review every congregation in your district, their locations, and administrator coverage.
                  </p>
                </div>
              </header>

              {churches.length === 0 ? (
                <div style={emptyStateStyle}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  <p style={{ margin: '1rem 0 0', fontSize: '1rem', fontWeight: '500' }}>No churches found</p>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>Create your first congregation above.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.6)' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={tableHeaderStyle}>Church</th>
                        <th style={tableHeaderStyle}>Location</th>
                        <th style={tableHeaderStyle}>Members</th>
                        <th style={tableHeaderStyle}>Sessions</th>
                        <th style={tableHeaderStyle}>Administrators</th>
                        <th style={tableHeaderStyle}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {churches.map((church, index) => {
                        const activeAdmins = adminsByChurch.get(church.id) ?? [];
                        return (
                          <tr key={church.id} style={{
                            backgroundColor: index % 2 === 0 ? 'rgba(248, 250, 252, 0.5)' : 'transparent',
                            transition: 'background-color 0.15s ease',
                          }}>
                            <td style={tableCellStyle}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '10px',
                                  background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  flexShrink: 0,
                                }}>
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                  </svg>
                                </div>
                                <div>
                                  <div style={{ 
                                    color: '#1e293b', 
                                    fontSize: '1rem', 
                                    fontWeight: '600',
                                    lineHeight: '1.3'
                                  }}>{church.name}</div>
                                </div>
                              </div>
                            </td>
                            <td style={tableCellStyle}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                  <circle cx="12" cy="10" r="3"></circle>
                                </svg>
                                {church.location ?? 'No location set'}
                              </div>
                            </td>
                            <td style={tableCellStyle}>
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.25rem 0.75rem',
                                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                                color: '#1e3a8a',
                                borderRadius: '999px',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                border: '1px solid #93c5fd',
                              }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                  <circle cx="9" cy="7" r="4"></circle>
                                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                                {church._count?.members ?? 0}
                              </div>
                            </td>
                            <td style={tableCellStyle}>
                              <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.25rem 0.75rem',
                                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                color: '#92400e',
                                borderRadius: '999px',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                border: '1px solid #fcd34d',
                              }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                  <line x1="16" y1="2" x2="16" y2="6"></line>
                                  <line x1="8" y1="2" x2="8" y2="6"></line>
                                  <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                                {church._count?.sessions ?? 0}
                              </div>
                            </td>
                            <td style={tableCellStyle}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {activeAdmins.length ? (
                                  activeAdmins.map((admin) => (
                                    <span key={admin.id} style={tagStyle('accent')}>
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                      </svg>
                                      {admin.firstName} {admin.lastName}
                                    </span>
                                  ))
                                ) : (
                                  <span style={tagStyle('danger')}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <line x1="12" y1="8" x2="12" y2="12"></line>
                                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                    </svg>
                                    Needs administrator
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={tableCellStyle}>
                              <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>View only</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

    </RequireRole>
  );
};

export default ManageChurchesPage;
