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
  gap: '1.75rem',
};

const cardStyle: CSSProperties = {
  background: 'var(--surface-primary)',
  borderRadius: 20,
  padding: '1.75rem',
  border: '1px solid var(--surface-border)',
  boxShadow: '0 16px 32px rgba(8, 22, 48, 0.12)',
  display: 'grid',
  gap: '1.25rem',
};

const statGridStyle: CSSProperties = {
  display: 'grid',
  gap: '1.25rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
};

const statCardStyle: CSSProperties = {
  ...cardStyle,
  padding: '1.5rem',
  gap: '0.75rem',
  boxShadow: '0 10px 24px rgba(18, 52, 92, 0.12)',
};

const statLabelStyle: CSSProperties = {
  fontSize: '0.8rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  fontWeight: 600,
  margin: 0,
};

const statValueStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '2.3rem',
  margin: 0,
  color: 'var(--shell-foreground)',
};

const statContextStyle: CSSProperties = {
  margin: 0,
  color: 'var(--muted)',
  fontSize: '0.92rem',
};

const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: '1rem',
  alignItems: 'flex-start',
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontSize: '1.55rem',
  color: 'var(--shell-foreground)',
};

const mutedTextStyle: CSSProperties = {
  margin: '0.35rem 0 0',
  color: 'var(--muted)',
  lineHeight: 1.6,
  maxWidth: '620px',
};

const formGridStyle: CSSProperties = {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
};

const labelStyle: CSSProperties = {
  display: 'grid',
  gap: '0.35rem',
  fontWeight: 600,
  color: 'var(--shell-foreground)',
};

const inputStyle: CSSProperties = {
  borderRadius: 12,
  border: '1px solid var(--surface-border)',
  padding: '0.6rem 0.75rem',
  background: 'var(--surface-primary)',
  color: 'var(--shell-foreground)',
  fontSize: '0.95rem',
};

const primaryButtonStyle: CSSProperties = {
  border: 'none',
  borderRadius: 14,
  padding: '0.65rem 1.35rem',
  background: 'linear-gradient(135deg, var(--primary), var(--accent))',
  color: 'var(--on-primary)',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  boxShadow: '0 16px 32px rgba(24, 76, 140, 0.25)',
};

const ghostButtonStyle: CSSProperties = {
  borderRadius: 12,
  border: '1px solid var(--surface-border)',
  padding: '0.55rem 1rem',
  background: 'transparent',
  color: 'var(--shell-foreground)',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
};

const dangerButtonStyle: CSSProperties = {
  ...ghostButtonStyle,
  borderColor: 'color-mix(in srgb, var(--danger) 35%, transparent)',
  color: 'var(--danger)',
};

const tagStyle = (tone: 'accent' | 'danger' | 'muted'): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  borderRadius: 999,
  padding: '0.3rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  background:
    tone === 'accent'
      ? 'color-mix(in srgb, var(--accent) 18%, transparent)'
      : tone === 'danger'
      ? 'color-mix(in srgb, var(--danger) 18%, transparent)'
      : 'color-mix(in srgb, var(--muted) 12%, transparent)',
  color: tone === 'accent' ? 'var(--accent)' : tone === 'danger' ? 'var(--danger)' : 'var(--muted)',
});

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
};

const tableHeaderStyle: CSSProperties = {
  textAlign: 'left',
  fontSize: '0.75rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  padding: '0.75rem 1rem',
};

const tableCellStyle: CSSProperties = {
  padding: '0.85rem 1rem',
  borderTop: '1px solid var(--surface-border)',
  verticalAlign: 'top',
};

const emptyStateStyle: CSSProperties = {
  border: '1px dashed color-mix(in srgb, var(--muted) 30%, transparent)',
  borderRadius: 18,
  padding: '2rem',
  textAlign: 'center',
  color: 'var(--muted)',
  background: 'var(--surface-soft)',
};

const modalBackdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(10, 24, 48, 0.55)',
  display: 'grid',
  placeItems: 'center',
  padding: '2rem',
  zIndex: 90,
};

const modalCardStyle: CSSProperties = {
  ...cardStyle,
  width: 'min(520px, 100%)',
  maxHeight: '90vh',
  overflowY: 'auto',
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
        <section style={statGridStyle}>
          {stats.map((stat) => (
            <article key={stat.label} style={statCardStyle}>
              <p style={statLabelStyle}>{stat.label}</p>
              <p style={statValueStyle}>{stat.value}</p>
              <p style={statContextStyle}>{stat.context}</p>
            </article>
          ))}
        </section>

        {renderStatus()}

        {status === 'loaded' && (
          <>
            <section style={cardStyle}>
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
            </section>

            <section style={cardStyle}>
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
                  <IconBuildingChurch size={36} stroke={1.6} />
                  <p style={{ margin: '0.5rem 0 0' }}>No churches found. Create your first congregation above.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
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
                      {churches.map((church) => {
                        const activeAdmins = adminsByChurch.get(church.id) ?? [];
                        return (
                          <tr key={church.id}>
                            <td style={tableCellStyle}>
                              <div style={{ display: 'grid', gap: '0.35rem' }}>
                                <strong style={{ color: 'var(--shell-foreground)', fontSize: '1rem' }}>{church.name}</strong>
                                <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>ID: {church.id}</span>
                              </div>
                            </td>
                            <td style={tableCellStyle}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--muted)' }}>
                                <IconMapPin size={16} stroke={1.6} />
                                {church.location ?? 'No location set'}
                              </div>
                            </td>
                            <td style={tableCellStyle}>{church._count?.members ?? 0}</td>
                            <td style={tableCellStyle}>{church._count?.sessions ?? 0}</td>
                            <td style={tableCellStyle}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                {activeAdmins.length ? (
                                  activeAdmins.map((admin) => (
                                    <span key={admin.id} style={tagStyle('accent')}>
                                      {admin.firstName} {admin.lastName}
                                    </span>
                                  ))
                                ) : (
                                  <span style={tagStyle('danger')}>Needs administrator</span>
                                )}
                              </div>
                            </td>
                            <td style={tableCellStyle}>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button type="button" style={ghostButtonStyle} onClick={() => openEditForm(church)}>
                                  <IconEdit size={16} stroke={1.8} /> Edit
                                </button>
                                <button type="button" style={dangerButtonStyle} onClick={() => confirmDelete(church)}>
                                  <IconTrash size={16} stroke={1.8} /> Delete
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
            </section>
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
