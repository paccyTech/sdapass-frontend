'use client';

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';

import { IconBuildingChurch, IconEdit, IconMapPin, IconPlus, IconTrash } from '@tabler/icons-react';

import RequireRole from '@/components/RequireRole';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import {
  createChurch,
  deleteChurch,
  fetchChurchAdmins,
  fetchChurches,
  type ChurchAdminSummary,
  type ChurchSummary,
  updateChurch,
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

const formGridStyle: CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
};

const labelStyle: CSSProperties = {
  display: 'grid',
  gap: '0.5rem',
  fontWeight: '600',
  color: '#374151',
  fontSize: '0.9rem',
};

const inputStyle: CSSProperties = {
  borderRadius: '12px',
  border: '1px solid rgba(226, 232, 240, 0.8)',
  padding: '0.75rem 1rem',
  background: '#ffffff',
  color: '#374151',
  fontSize: '0.95rem',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
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

const ghostButtonStyle: CSSProperties = {
  borderRadius: '12px',
  border: '1px solid rgba(226, 232, 240, 0.8)',
  padding: '0.75rem 1.25rem',
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  color: '#475569',
  fontWeight: '600',
  fontSize: '0.875rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.2s ease',
};

const dangerButtonStyle: CSSProperties = {
  ...ghostButtonStyle,
  background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
  borderColor: 'rgba(239, 68, 68, 0.3)',
  color: '#dc2626',
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

const modalBackdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(15, 23, 42, 0.6)',
  display: 'grid',
  placeItems: 'center',
  padding: '2rem',
  zIndex: 90,
  backdropFilter: 'blur(4px)',
};

const modalCardStyle: CSSProperties = {
  ...cardStyle,
  width: 'min(560px, 100%)',
  maxHeight: '90vh',
  overflowY: 'auto',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
};

type ChurchFormState = {
  mode: 'create' | 'edit';
  church: ChurchSummary | null;
  name: string;
  location: string;
  isSubmitting: boolean;
  error: string | null;
  success: string | null;
};

type DeleteState = {
  church: ChurchSummary | null;
  isSubmitting: boolean;
  error: string | null;
};

const initialFormState: ChurchFormState = {
  mode: 'create',
  church: null,
  name: '',
  location: '',
  isSubmitting: false,
  error: null,
  success: null,
};

const initialDeleteState: DeleteState = {
  church: null,
  isSubmitting: false,
  error: null,
};

const ManageChurchesPage = () => {
  const { token, user } = useAuthSession();
  const districtId = user?.districtId ?? null;

  const [churches, setChurches] = useState<ChurchSummary[]>([]);
  const [admins, setAdmins] = useState<ChurchAdminSummary[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<ChurchFormState>(initialFormState);
  const [deleteState, setDeleteState] = useState<DeleteState>(initialDeleteState);

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
        context: total ? `${withAdmin} covered with active admins` : 'Add your first congregation',
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

  const formDisabled = formState.isSubmitting || !token || !districtId;

  const resetForm = useCallback(() => {
    setFormState(initialFormState);
  }, []);

  const openCreateForm = useCallback(() => {
    setFormState((prev) => ({
      ...initialFormState,
      mode: 'create',
      success: null,
      error: null,
    }));
  }, []);

  const openEditForm = useCallback((church: ChurchSummary) => {
    setFormState({
      mode: 'edit',
      church,
      name: church.name,
      location: church.location ?? '',
      isSubmitting: false,
      error: null,
      success: null,
    });
  }, []);

  const handleFormChange = useCallback(
    (field: 'name' | 'location') => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setFormState((prev) => ({ ...prev, [field]: value, error: null, success: null }));
    },
    [],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!token || !districtId) {
        setFormState((prev) => ({ ...prev, error: 'Authentication required to manage churches.' }));
        return;
      }

      const name = formState.name.trim();
      const location = formState.location.trim();

      if (!name) {
        setFormState((prev) => ({ ...prev, error: 'Church name is required.' }));
        return;
      }

      setFormState((prev) => ({ ...prev, isSubmitting: true, error: null, success: null }));

      try {
        if (formState.mode === 'create') {
          const church = await createChurch(token, {
            districtId,
            name,
            location: location || undefined,
          });

          setChurches((prev) => {
            const exists = prev.some((item) => item.id === church.id);
            if (exists) {
              return prev.map((item) => (item.id === church.id ? church : item));
            }
            return [church, ...prev].sort((a, b) => a.name.localeCompare(b.name));
          });

          setFormState({
            ...initialFormState,
            success: `Church “${church.name}” created successfully.`,
          });
        } else if (formState.mode === 'edit' && formState.church) {
          const response = await updateChurch(token, formState.church.id, {
            name,
            location: location || undefined,
          });

          setChurches((prev) => prev.map((item) => (item.id === response.church.id ? response.church : item)));
          setFormState({
            ...initialFormState,
            success: `Updated ${response.church.name}.`,
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save church';
        setFormState((prev) => ({ ...prev, isSubmitting: false, error: message, success: null }));
      }
    },
    [token, districtId, formState],
  );

  const confirmDelete = useCallback((church: ChurchSummary) => {
    setDeleteState({ church, isSubmitting: false, error: null });
  }, []);

  const cancelDelete = useCallback(() => {
    setDeleteState(initialDeleteState);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!token || !deleteState.church) {
      return;
    }

    setDeleteState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      await deleteChurch(token, deleteState.church.id);
      setChurches((prev) => prev.filter((church) => church.id !== deleteState.church?.id));
      setDeleteState(initialDeleteState);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete church';
      setDeleteState((prev) => ({ ...prev, isSubmitting: false, error: message }));
    }
  }, [token, deleteState]);

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
                  <h2 style={sectionTitleStyle}>Create a new church</h2>
                  <p style={mutedTextStyle}>
                    District administrators can register congregations and keep their location details current.
                  </p>
                </div>
                <button type="button" style={ghostButtonStyle} onClick={openCreateForm}>
                  <IconPlus size={18} stroke={1.8} />
                  Reset form
                </button>
              </header>

              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
                <div style={formGridStyle}>
                  <label style={labelStyle}>
                    Church name
                    <input
                      type="text"
                      value={formState.name}
                      onChange={handleFormChange('name')}
                      style={inputStyle}
                      placeholder="e.g. Kigali Central SDA"
                    />
                  </label>
                  <label style={labelStyle}>
                    Location / sector
                    <input
                      type="text"
                      value={formState.location}
                      onChange={handleFormChange('location')}
                      style={inputStyle}
                      placeholder="Optional descriptive address"
                    />
                  </label>
                </div>

                {formState.error ? (
                  <p style={{ ...mutedTextStyle, color: 'var(--danger)' }}>{formState.error}</p>
                ) : null}
                {formState.success ? (
                  <p style={{ ...mutedTextStyle, color: 'var(--accent)' }}>{formState.success}</p>
                ) : null}

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button type="submit" style={primaryButtonStyle} disabled={formDisabled}>
                    <IconBuildingChurch size={18} stroke={1.8} />
                    {formState.mode === 'create' ? 'Create church' : 'Save changes'}
                  </button>
                  {formState.mode === 'edit' ? (
                    <button type="button" style={ghostButtonStyle} onClick={resetForm} disabled={formDisabled}>
                      Cancel edit
                    </button>
                  ) : null}
                </div>
              </form>
            </div>

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
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button 
                                  type="button" 
                                  style={ghostButtonStyle} 
                                  onClick={() => openEditForm(church)}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                                  }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                  </svg>
                                  Edit
                                </button>
                                <button 
                                  type="button" 
                                  style={dangerButtonStyle} 
                                  onClick={() => confirmDelete(church)}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                                  }}
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                  Delete
                                </button>
                              </div>
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

      {formState.mode === 'edit' && formState.church && (
        <div style={modalBackdropStyle}>
          <div style={modalCardStyle}>
            <header style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>Edit {formState.church.name}</h2>
                <p style={mutedTextStyle}>Update the church name or location. Sessions and members stay intact.</p>
              </div>
              <button type="button" style={ghostButtonStyle} onClick={resetForm}>
                Close
              </button>
            </header>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
              <label style={labelStyle}>
                Church name
                <input
                  type="text"
                  value={formState.name}
                  onChange={handleFormChange('name')}
                  style={inputStyle}
                  autoFocus
                />
              </label>
              <label style={labelStyle}>
                Location / sector
                <input
                  type="text"
                  value={formState.location}
                  onChange={handleFormChange('location')}
                  style={inputStyle}
                />
              </label>

              {formState.error ? (
                <p style={{ ...mutedTextStyle, color: 'var(--danger)' }}>{formState.error}</p>
              ) : null}

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button type="submit" style={primaryButtonStyle} disabled={formDisabled}>
                  <IconEdit size={18} stroke={1.8} /> Save changes
                </button>
                <button type="button" style={ghostButtonStyle} onClick={resetForm} disabled={formDisabled}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteState.church && (
        <div style={modalBackdropStyle}>
          <div style={modalCardStyle}>
            <header style={sectionHeaderStyle}>
              <div>
                <h2 style={sectionTitleStyle}>Delete {deleteState.church.name}?</h2>
                <p style={{ ...mutedTextStyle, color: 'var(--danger)' }}>
                  This action removes the church. Members remain in the system but lose their church assignment.
                </p>
              </div>
            </header>

            {deleteState.error ? (
              <p style={{ ...mutedTextStyle, color: 'var(--danger)' }}>{deleteState.error}</p>
            ) : (
              <p style={mutedTextStyle}>
                You can recreate the church later if needed. Consider reassigning administrators before deleting.
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button type="button" style={dangerButtonStyle} onClick={handleDelete} disabled={deleteState.isSubmitting}>
                <IconTrash size={18} stroke={1.8} />
                {deleteState.isSubmitting ? 'Deleting…' : 'Delete church'}
              </button>
              <button type="button" style={ghostButtonStyle} onClick={cancelDelete} disabled={deleteState.isSubmitting}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </RequireRole>
  );
};

export default ManageChurchesPage;
