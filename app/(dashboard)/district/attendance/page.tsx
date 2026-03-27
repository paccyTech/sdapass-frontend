'use client';

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';

import RequireRole from '@/components/RequireRole';
import { RoleHero, type HeroStat } from '@/components/dashboard/RoleHero';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import {
  fetchAttendance,
  fetchChurches,
  type AttendanceRecordSummary,
  type ChurchSummary,
} from '@/lib/api';

const pageWrapperStyle: CSSProperties = {
  display: 'grid',
  gap: '2rem',
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

const filterGridStyle: CSSProperties = {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
};

const filterLabelStyle: CSSProperties = {
  display: 'grid',
  gap: '0.5rem',
  fontWeight: '600',
  color: '#374151',
  fontSize: '0.9rem',
};

const selectStyle: CSSProperties = {
  borderRadius: '12px',
  border: '1px solid rgba(226, 232, 240, 0.8)',
  padding: '0.75rem 1rem',
  background: '#ffffff',
  color: '#374151',
  fontSize: '0.95rem',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};

const tableWrapperStyle: CSSProperties = {
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
  borderRadius: '12px',
  border: '1px solid rgba(226, 232, 240, 0.6)',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
  fontSize: '0.875rem',
};

const tableHeaderCell: CSSProperties = {
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

const statusBadgeStyle = (status: string): CSSProperties => ({
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
    status === 'APPROVED'
      ? 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
      : status === 'PENDING'
      ? 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
      : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
  color: status === 'APPROVED' ? '#166534' : status === 'PENDING' ? '#92400e' : '#64748b',
  border: `1px solid ${
    status === 'APPROVED' ? '#86efac' : status === 'PENDING' ? '#fcd34d' : '#cbd5e1'
  }`,
});

const emptyStateStyle: CSSProperties = {
  border: '1px dashed rgba(148, 163, 184, 0.4)',
  borderRadius: '16px',
  padding: '3rem',
  textAlign: 'center',
  color: '#94a3b8',
  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
};

const DistrictAttendancePage = () => {
  const { token, user } = useAuthSession();
  const districtId = user?.districtId ?? null;

  const [attendance, setAttendance] = useState<AttendanceRecordSummary[]>([]);
  const [churches, setChurches] = useState<ChurchSummary[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [churchFilter, setChurchFilter] = useState<string>('all');

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
        const [attendanceList, churchList] = await Promise.all([
          fetchAttendance(token, { districtId }),
          fetchChurches(token, { districtId }),
        ]);

        if (!active) {
          return;
        }

        setAttendance(attendanceList ?? []);
        setChurches(churchList ?? []);
        setStatus('loaded');
      } catch (err) {
        if (!active) {
          return;
        }
        console.error('Failed to load attendance data', err);
        const message = err instanceof Error ? err.message : 'Unable to load attendance data at this time.';
        setError(message);
        setStatus('error');
      }
    })();

    return () => {
      active = false;
    };
  }, [token, districtId]);

  const filteredAttendance = useMemo(() => {
    let filtered = attendance;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    if (churchFilter !== 'all') {
      filtered = filtered.filter(record => record.session?.church?.id === churchFilter);
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [attendance, statusFilter, churchFilter]);

  const stats = useMemo(() => {
    const total = attendance.length;
    const approved = attendance.filter(record => record.status === 'APPROVED').length;
    const pending = attendance.filter(record => record.status === 'PENDING').length;

    return [
      {
        label: 'Total Records',
        value: total.toString(),
        context: 'All attendance entries',
      },
      {
        label: 'Approved',
        value: approved.toString(),
        context: `${Math.round((approved / total) * 100)}% approval rate`,
      },
      {
        label: 'Pending',
        value: pending.toString(),
        context: 'Awaiting review',
      },
    ];
  }, [attendance]);

  const renderStatus = () => {
    if (status === 'loading' || status === 'idle') {
      return (
        <div style={cardStyle}>
          <p style={{ margin: 0, color: '#64748b' }}>Loading attendance data…</p>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div style={cardStyle}>
          <h2 style={sectionTitleStyle}>Unable to load attendance</h2>
          <p style={mutedTextStyle}>{error}</p>
          <button 
            type="button" 
            style={{
              borderRadius: '12px',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
              color: '#ffffff',
              fontWeight: '600',
              fontSize: '0.875rem',
              cursor: 'pointer',
              border: 'none',
              boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)',
            }} 
            onClick={() => window.location.reload()}
          >
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
        <RoleHero
          title="District Attendance Tracker"
          subtitle="Monitor and manage attendance records across all churches in your district"
          stats={stats}
        />

        {renderStatus()}

        {status === 'loaded' && (
          <>
            <div style={cardStyle}>
              <header style={sectionHeaderStyle}>
                <div>
                  <h2 style={sectionTitleStyle}>Attendance Records</h2>
                  <p style={mutedTextStyle}>
                    Review and approve attendance submissions from all churches in your district.
                  </p>
                </div>
              </header>

              <div style={filterGridStyle}>
                <label style={filterLabelStyle}>
                  Status
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="all">All Status</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </label>
                <label style={filterLabelStyle}>
                  Church
                  <select 
                    value={churchFilter} 
                    onChange={(e) => setChurchFilter(e.target.value)}
                    style={selectStyle}
                  >
                    <option value="all">All Churches</option>
                    {churches.map((church) => (
                      <option key={church.id} value={church.id}>
                        {church.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {filteredAttendance.length === 0 ? (
                <div style={emptyStateStyle}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11H3m6 0h6m-6 0a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v0m0 6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v0"></path>
                  </svg>
                  <p style={{ margin: '1rem 0 0', fontSize: '1rem', fontWeight: '500' }}>No attendance records found</p>
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
                    {statusFilter !== 'all' || churchFilter !== 'all' 
                      ? 'Try adjusting your filters to see more records.'
                      : 'No attendance has been submitted yet.'}
                  </p>
                </div>
              ) : (
                <div style={tableWrapperStyle}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={tableHeaderCell}>Date</th>
                        <th style={tableHeaderCell}>Church</th>
                        <th style={tableHeaderCell}>Member</th>
                        <th style={tableHeaderCell}>Status</th>
                        <th style={tableHeaderCell}>Submitted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAttendance.map((record, index) => (
                        <tr key={record.id} style={{
                          backgroundColor: index % 2 === 0 ? 'rgba(248, 250, 252, 0.5)' : 'transparent',
                          transition: 'background-color 0.15s ease',
                        }}>
                          <td style={tableCellStyle}>
                            {new Date(record.createdAt).toLocaleDateString()}
                          </td>
                          <td style={tableCellStyle}>
                            {record.session?.church?.name || 'Unknown'}
                          </td>
                          <td style={tableCellStyle}>
                            {record.member?.firstName} {record.member?.lastName}
                          </td>
                          <td style={tableCellStyle}>
                            <span style={statusBadgeStyle(record.status)}>
                              {record.status}
                            </span>
                          </td>
                          <td style={tableCellStyle}>
                            {new Date(record.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
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

export default DistrictAttendancePage;
