'use client';

import { useCallback, useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';

import RequireRole from '@/components/RequireRole';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import {
  createChurchAdmin,
  deleteChurchAdmin,
  fetchChurchAdmins,
  fetchChurches,
  updateChurchAdmin,
  type ChurchAdminSummary,
  type ChurchSummary,
} from '@/lib/api';

const formatRelativeTime = (date: Date) => {
  const diff = Date.now() - date.getTime();
  if (Number.isNaN(diff) || diff < 0) {
    return 'just now';
  }
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'moments ago';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const Section = ({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section
    style={{
      background: 'var(--surface-primary)',
      borderRadius: 20,
      padding: '1.8rem',
      border: '1px solid var(--surface-border)',
      boxShadow: '0 18px 32px rgba(8, 22, 48, 0.12)',
      display: 'grid',
      gap: '1.25rem',
    }}
  >
    <header
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}
    >
      <div style={{ display: 'grid', gap: '0.5rem', maxWidth: 'min(520px, 100%)' }}>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: '1.65rem',
            color: 'var(--shell-foreground)',
          }}
        >
          {title}
        </h2>
        {description ? (
          <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>{description}</p>
        ) : null}
      </div>
      {actions ? <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>{actions}</div> : null}
    </header>
    {children}
  </section>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>
    {label}
    {children}
  </label>
);

const Input = ({ style, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { style?: CSSProperties }) => (
  <input
    {...props}
    style={{
      borderRadius: 12,
      border: '1px solid var(--surface-border)',
      padding: '0.6rem 0.8rem',
      fontSize: '0.95rem',
      fontFamily: 'inherit',
      background: 'var(--surface-primary)',
      color: 'var(--shell-foreground)',
      ...(style ?? {}),
    }}
  />
);

const Select = ({ style, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { style?: CSSProperties }) => (
  <select
    {...props}
    style={{
      borderRadius: 12,
      border: '1px solid var(--surface-border)',
      padding: '0.6rem 0.8rem',
      fontSize: '0.95rem',
      fontFamily: 'inherit',
      background: 'var(--surface-primary)',
      color: 'var(--shell-foreground)',
      ...(style ?? {}),
    }}
  />
);

const Button = ({
  tone = 'primary',
  style,
  ...buttonProps
}: { tone?: 'primary' | 'ghost' | 'danger' } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const background =
    tone === 'primary'
      ? 'linear-gradient(135deg, var(--primary), var(--accent))'
      : tone === 'danger'
      ? 'var(--danger)'
      : 'transparent';
  const border = tone === 'primary' || tone === 'danger' ? 'none' : '1px solid var(--surface-border)';
  const color = tone === 'ghost' ? 'var(--shell-foreground)' : 'var(--on-primary)';
  const boxShadow =
    tone === 'primary'
      ? '0 14px 32px rgba(8, 22, 48, 0.18)'
      : tone === 'danger'
      ? '0 12px 24px color-mix(in srgb, var(--danger) 28%, transparent)'
      : 'none';

  return (
    <button
      {...buttonProps}
      style={{
        borderRadius: 14,
        border,
        background,
        color,
        padding: '0.55rem 1.15rem',
        fontWeight: 600,
        boxShadow,
        opacity: buttonProps.disabled ? 0.65 : 1,
        cursor: buttonProps.disabled ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s ease, transform 0.2s ease',
        colorAdjust: 'exact',
        ...(style ?? {}),
      }}
    />
  );
};

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(4,12,24,0.55)',
      display: 'grid',
      placeItems: 'center',
      padding: '2rem',
      zIndex: 90,
    }}
    role="dialog"
    aria-modal
  >
    <div
      style={{
        background: 'var(--surface-primary)',
        borderRadius: 20,
        width: 'min(520px, 100%)',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.6rem',
        display: 'grid',
        gap: '1rem',
        border: '1px solid var(--surface-border)',
        boxShadow: '0 20px 45px rgba(8, 22, 48, 0.2)',
      }}
    >
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--shell-foreground)' }}>{title}</h3>
        <Button type="button" tone="ghost" onClick={onClose}>
          Close
        </Button>
      </header>
      {children}
    </div>
  </div>
);

const statusPill = (isActive: boolean): CSSProperties => ({
  padding: '0.35rem 0.75rem',
  borderRadius: '999px',
  background: isActive
    ? 'color-mix(in srgb, var(--accent) 18%, transparent)'
    : 'color-mix(in srgb, var(--danger) 18%, transparent)',
  color: isActive ? 'var(--accent)' : 'var(--danger)',
  fontWeight: 600,
  fontSize: '0.75rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
});

const filterToolbarStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
};

const searchFieldStyle: CSSProperties = {
  minWidth: '220px',
  flex: '1 1 220px',
  padding: '0.6rem 2.4rem 0.6rem 0.85rem',
  borderRadius: 12,
  border: '1px solid var(--surface-border)',
  background: 'var(--surface-primary)',
  color: 'var(--shell-foreground)',
};

const contactListStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
};

const contactChipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.4rem 0.75rem',
  borderRadius: 999,
  background: 'var(--surface-soft)',
  color: 'var(--shell-foreground)',
  fontSize: '0.85rem',
  textDecoration: 'none',
};

const quickGridStyle: CSSProperties = {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
};

const quickCardStyle: CSSProperties = {
  borderRadius: 18,
  border: '1px solid var(--surface-border)',
  padding: '1.2rem 1.4rem',
  background: 'var(--surface-primary)',
  display: 'grid',
  gap: '0.5rem',
};

const quickIconWrapper: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 14,
  background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 18%, transparent), color-mix(in srgb, var(--accent) 14%, transparent))',
  display: 'grid',
  placeItems: 'center',
};

type IconProps = {
  size?: number;
  stroke?: string;
};

const IconCompass = ({ size = 20, stroke = 'var(--shell-foreground)' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8l4 2-4 6-4-2z" />
    <circle cx="12" cy="12" r="1" fill={stroke} />
  </svg>
);

const IconClipboard = ({ size = 20, stroke = 'var(--shell-foreground)' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="6" y="4" width="12" height="16" rx="2" />
    <path d="M9 4V3h6v1" />
    <path d="M9 9h6" />
    <path d="M9 13h6" />
  </svg>
);

const IconUsers = ({ size = 20, stroke = 'var(--shell-foreground)' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="9" cy="8" r="3" />
    <circle cx="17" cy="10" r="3" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="M13.5 20a4.5 4.5 0 0 1 9 0" />
  </svg>
);

const IconMail = ({ size = 16, stroke = 'var(--shell-foreground)' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </svg>
);

const IconPhone = ({ size = 16, stroke = 'var(--shell-foreground)' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M5 3h4l2 5-3 2a12 12 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2 18 18 0 0 1-18-18 2 2 0 0 1 2-2z" />
  </svg>
);

const IconChurch = ({ size = 16, stroke = 'var(--shell-foreground)' }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={stroke}
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M12 3v18" />
    <path d="M9 6h6" />
    <path d="M5 21V11l7-4 7 4v10" />
    <path d="M9 21v-6h6v6" />
  </svg>
);

const ContactChip = ({ icon, label, href, variant = 'default' }: { icon: ReactNode; label: string; href?: string; variant?: 'default' | 'accent' }) => {
  const style: CSSProperties = {
    ...contactChipStyle,
    background:
      variant === 'accent'
        ? 'color-mix(in srgb, var(--primary) 16%, transparent)'
        : contactChipStyle.background,
  };

  const content = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
      {icon}
      <span>{label}</span>
    </span>
  );

  if (href) {
    return (
      <a href={href} style={style}>
        {content}
      </a>
    );
  }

  return <span style={style}>{content}</span>;
};

const DistrictChurchAdminsPage = () => {
  const { token, user } = useAuthSession();
  const districtId = user?.districtId ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [admins, setAdmins] = useState<ChurchAdminSummary[]>([]);
  const [churches, setChurches] = useState<ChurchSummary[]>([]);
  const [filterChurch, setFilterChurch] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [createForm, setCreateForm] = useState(() => ({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    churchId: '',
    isSubmitting: false,
    tempPassword: null as string | null,
  }));

  const [editForm, setEditForm] = useState({
    admin: null as ChurchAdminSummary | null,
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    churchId: '',
    isActive: true,
    isSubmitting: false,
  });

  const [deleteState, setDeleteState] = useState({ admin: null as ChurchAdminSummary | null, isSubmitting: false });

  const loadData = useCallback(async () => {
    if (!token || !districtId) {
      setAdmins([]);
      setChurches([]);
      setIsLoading(false);
      return;
    }
    try {
      const [adminList, churchList] = await Promise.all([
        fetchChurchAdmins(token, { districtId }),
        fetchChurches(token, { districtId }),
      ]);
      setAdmins(adminList);
      setChurches(churchList);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load church admins';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token, districtId]);

  useEffect(() => {
    setIsLoading(true);
    loadData();
  }, [loadData]);

  const sortedChurches = useMemo(
    () => churches.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [churches],
  );

  const adminTally = useMemo(() => {
    const activeCount = admins.filter((admin) => admin.isActive).length;
    const pendingCount = admins.length - activeCount;
    return { activeCount, pendingCount };
  }, [admins]);

  const assignedChurchCount = useMemo(() => {
    const unique = new Set<string>();
    admins.forEach((admin) => {
      if (admin.isActive && admin.churchId) {
        unique.add(admin.churchId);
      }
    });
    return unique.size;
  }, [admins]);

  const coverageRate = useMemo(
    () => (churches.length ? Math.round((assignedChurchCount / churches.length) * 100) : 0),
    [assignedChurchCount, churches.length],
  );

  const unassignedChurches = Math.max(churches.length - assignedChurchCount, 0);

  const latestActivity = useMemo(() => {
    if (!admins.length) {
      return null;
    }
    const timestamp = admins.reduce((latest, admin) => {
      const created = new Date(admin.createdAt).getTime();
      if (Number.isNaN(created)) {
        return latest;
      }
      return Math.max(latest, created);
    }, 0);
    return timestamp ? new Date(timestamp) : null;
  }, [admins]);

  const quickPointers = useMemo(
    () => [
      {
        icon: IconCompass,
        title: 'Follow up on pending invites',
        body:
          adminTally.pendingCount > 0
            ? `Reach out to ${adminTally.pendingCount} leader${adminTally.pendingCount === 1 ? '' : 's'} who have not activated their accounts.`
            : 'All church admins are active—great work!',
      },
      {
        icon: IconClipboard,
        title: 'Audit church coverage',
        body:
          unassignedChurches > 0
            ? `${unassignedChurches} church${unassignedChurches === 1 ? '' : 'es'} currently lack an active administrator.`
            : 'Every registered church has an active administrator.',
      },
      {
        icon: IconUsers,
        title: 'Plan a coaching cadence',
        body: 'Schedule 1:1 check-ins with new administrators to ensure smooth onboarding and compliance.',
      },
    ],
    [adminTally.pendingCount, unassignedChurches],
  );

  const filteredAdmins = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return admins.filter((admin) => {
      if (filterChurch && admin.churchId !== filterChurch) {
        return false;
      }
      if (!normalizedSearch) {
        return true;
      }
      const haystack = [
        admin.firstName,
        admin.lastName,
        admin.email ?? '',
        admin.phoneNumber ?? '',
        admin.church?.name ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [admins, filterChurch, searchTerm]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleOpenInvite = () => {
    setCreateForm({
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      churchId: '',
      isSubmitting: false,
      tempPassword: null,
    });
    setCreateOpen(true);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    setCreateForm((prev) => ({ ...prev, isSubmitting: true, tempPassword: null }));
    try {
      const { initialPassword } = await createChurchAdmin(token, {
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        phoneNumber: createForm.phoneNumber,
        email: createForm.email,
        churchId: createForm.churchId,
      });
      setCreateForm((prev) => ({ ...prev, tempPassword: initialPassword }));
      showToast('success', 'Church admin created. Share the temporary password securely.');
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create church admin';
      showToast('error', message);
    } finally {
      setCreateForm((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const openEdit = (admin: ChurchAdminSummary) => {
    setEditForm({
      admin,
      firstName: admin.firstName,
      lastName: admin.lastName,
      phoneNumber: admin.phoneNumber,
      email: admin.email ?? '',
      churchId: admin.churchId ?? '',
      isActive: admin.isActive,
      isSubmitting: false,
    });
    setEditOpen(true);
  };

  const handleEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !editForm.admin) return;
    setEditForm((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await updateChurchAdmin(token, editForm.admin.id, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        phoneNumber: editForm.phoneNumber,
        email: editForm.email || undefined,
        churchId: editForm.churchId || undefined,
        isActive: editForm.isActive,
      });
      showToast('success', 'Church admin updated.');
      setEditOpen(false);
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update church admin';
      showToast('error', message);
    } finally {
      setEditForm((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const openDelete = (admin: ChurchAdminSummary) => {
    setDeleteState({ admin, isSubmitting: false });
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!token || !deleteState.admin) return;
    setDeleteState((prev) => ({ ...prev, isSubmitting: true }));
    try {
      await deleteChurchAdmin(token, deleteState.admin.id);
      showToast('success', 'Church admin removed.');
      setDeleteOpen(false);
      await loadData();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not remove church admin';
      showToast('error', message);
      setDeleteState((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

  const shellConfig = useMemo(
    () => ({}),
    [],
  );

  useDashboardShellConfig(shellConfig);

  return (
    <RequireRole allowed="DISTRICT_ADMIN">
      {!districtId ? (
        <Section title="District assignment required">
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            Your account is not linked to a district yet. Ask your union administrator to assign one before managing church admins.
          </p>
        </Section>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <Section
            title="Quick cadence"
            description="Keep administrators supported and accountable with ready-to-run workflows."
          >
            <div style={quickGridStyle}>
              {quickPointers.map(({ icon: Icon, title, body }) => (
                <article key={title} style={quickCardStyle}>
                  <span style={quickIconWrapper}>
                    <Icon />
                  </span>
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', color: 'var(--shell-foreground)' }}>{title}</strong>
                  <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.6 }}>{body}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section
            title="Church administrators"
            description="Assign, coach, and audit the leaders stewarding each congregation in your district."
            actions={
              <Button type="button" onClick={handleOpenInvite}>
                Invite church admin
              </Button>
            }
          >
            <div style={filterToolbarStyle}>
              <Select
                value={filterChurch}
                onChange={(event) => setFilterChurch(event.target.value)}
                style={{ minWidth: '220px' }}
              >
                <option value="">All churches</option>
                {sortedChurches.map((church) => (
                  <option key={church.id} value={church.id}>
                    {church.name}
                  </option>
                ))}
              </Select>
              <Input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, email, or phone"
                style={searchFieldStyle}
              />
              {(filterChurch || searchTerm) && (
                <Button
                  type="button"
                  tone="ghost"
                  onClick={() => {
                    setFilterChurch('');
                    setSearchTerm('');
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>

            {toast && (
              <div
                style={{
                  padding: '0.9rem 1.1rem',
                  borderRadius: 12,
                  background:
                    toast.type === 'success'
                      ? 'color-mix(in srgb, var(--accent) 18%, transparent)'
                      : 'color-mix(in srgb, var(--danger) 18%, transparent)',
                  border:
                    toast.type === 'success'
                      ? '1px solid color-mix(in srgb, var(--accent) 32%, transparent)'
                      : '1px solid color-mix(in srgb, var(--danger) 32%, transparent)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <span
                  style={{
                    color: toast.type === 'success' ? 'var(--accent)' : 'var(--danger)',
                    fontWeight: 600,
                  }}
                >
                  {toast.message}
                </span>
                <Button type="button" tone="ghost" onClick={() => setToast(null)}>
                  Dismiss
                </Button>
              </div>
            )}

            {isLoading ? (
              <p style={{ margin: 0, color: 'var(--muted)' }}>Loading church administrators…</p>
            ) : error ? (
              <div style={{ display: 'grid', gap: '0.6rem' }}>
                <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{error}</span>
                <Button type="button" onClick={loadData}>
                  Retry
                </Button>
              </div>
            ) : filteredAdmins.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--muted)' }}>No church admins match your filters. Adjust your search or invite someone new.</p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {filteredAdmins.map((admin) => (
                  <article
                    key={admin.id}
                    style={{
                      border: '1px solid var(--surface-border)',
                      borderRadius: 18,
                      padding: '1.4rem 1.5rem',
                      display: 'grid',
                      gap: '0.9rem',
                      background: 'var(--surface-soft)',
                    }}
                  >
                    <header
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '1rem',
                      }}
                    >
                      <div style={{ display: 'grid', gap: '0.35rem' }}>
                        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: 'var(--shell-foreground)' }}>
                          {admin.firstName} {admin.lastName}
                        </strong>
                        <span style={{ color: 'var(--muted)' }}>{admin.church?.name ?? 'Unassigned church'}</span>
                      </div>
                      <span style={statusPill(admin.isActive)}>{admin.isActive ? 'Active' : 'Suspended'}</span>
                    </header>

                    <div style={contactListStyle}>
                      {admin.email ? (
                        <ContactChip icon={<IconMail size={14} />} href={`mailto:${admin.email}`} label={admin.email} />
                      ) : null}
                      {admin.phoneNumber ? (
                        <ContactChip icon={<IconPhone size={14} />} href={`tel:${admin.phoneNumber}`} label={admin.phoneNumber} />
                      ) : null}
                      <ContactChip
                        icon={<IconChurch size={14} />}
                        label={admin.church?.name ?? 'Awaiting assignment'}
                        variant="accent"
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                      <Button type="button" tone="ghost" onClick={() => openEdit(admin)}>
                        Edit admin
                      </Button>
                      <Button type="button" tone="danger" onClick={() => openDelete(admin)}>
                        Remove admin
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Section>
        </div>
      )}

      {createOpen && (
        <Modal title="Invite church admin" onClose={() => setCreateOpen(false)}>
          <form
            style={{ display: 'grid', gap: '0.9rem' }}
            onSubmit={handleCreate}
          >
            <div style={{ display: 'grid', gap: '0.6rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <Field label="First name">
                <Input
                  required
                  value={createForm.firstName}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, firstName: event.target.value }))}
                />
              </Field>
              <Field label="Last name">
                <Input
                  required
                  value={createForm.lastName}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, lastName: event.target.value }))}
                />
              </Field>
              <Field label="Phone number">
                <Input
                  required
                  value={createForm.phoneNumber}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
                />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                />
              </Field>
              <Field label="Assign church">
                <Select
                  name="churchId"
                  value={createForm.churchId}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, churchId: event.target.value }))}
                  required
                >
                  <option value="">Select church</option>
                  {sortedChurches.map((church) => (
                    <option key={church.id} value={church.id}>
                      {church.name}
                    </option>
                  ))}
                </Select>
              </Field>

              {createForm.tempPassword ? (
                <div
                  style={{
                    padding: '0.9rem 1rem',
                    borderRadius: 12,
                    background: 'var(--surface-soft)',
                    border: '1px solid var(--surface-border)',
                    display: 'grid',
                    gap: '0.35rem',
                  }}
                >
                  <strong style={{ color: 'var(--accent)' }}>Temporary password generated</strong>
                  <code style={{ fontSize: '1rem', fontWeight: 600 }}>{createForm.tempPassword}</code>
                  <p style={{ margin: 0, color: 'var(--muted)' }}>Share this securely with the new administrator—they will be prompted to reset on first login.</p>
                </div>
              ) : null}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button type="button" tone="ghost" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createForm.isSubmitting}>
                  {createForm.isSubmitting ? 'Inviting…' : 'Send invite'}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {editOpen && editForm.admin && (
        <Modal title="Edit church admin" onClose={() => setEditOpen(false)}>
          <form style={{ display: 'grid', gap: '0.85rem' }} onSubmit={handleEdit}>
            <Field label="First name">
              <Input required value={editForm.firstName} onChange={(event) => setEditForm((prev) => ({ ...prev, firstName: event.target.value }))} />
            </Field>
            <Field label="Last name">
              <Input required value={editForm.lastName} onChange={(event) => setEditForm((prev) => ({ ...prev, lastName: event.target.value }))} />
            </Field>
            <Field label="Phone number">
              <Input required value={editForm.phoneNumber} onChange={(event) => setEditForm((prev) => ({ ...prev, phoneNumber: event.target.value }))} />
            </Field>
            <Field label="Email">
              <Input type="email" value={editForm.email} onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))} />
            </Field>
            <Field label="Church assignment">
              <Select value={editForm.churchId} onChange={(event) => setEditForm((prev) => ({ ...prev, churchId: event.target.value }))}>
                <option value="">Unassigned</option>
                {sortedChurches.map((church) => (
                  <option key={church.id} value={church.id}>
                    {church.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={editForm.isActive ? 'active' : 'inactive'} onChange={(event) => setEditForm((prev) => ({ ...prev, isActive: event.target.value === 'active' }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </Field>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Button type="button" tone="ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editForm.isSubmitting}>
                {editForm.isSubmitting ? 'Saving…' : 'Update admin'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {deleteOpen && deleteState.admin && (
        <Modal title="Remove church admin" onClose={() => setDeleteOpen(false)}>
          <p style={{ margin: 0, color: 'var(--muted)' }}>
            This will remove {deleteState.admin!.firstName} {deleteState.admin!.lastName} from their role. You can re-invite them later if needed.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Button type="button" tone="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" tone="danger" disabled={deleteState.isSubmitting} onClick={handleDelete}>
              {deleteState.isSubmitting ? 'Removing…' : 'Remove admin'}
            </Button>
          </div>
        </Modal>
      )}
    </RequireRole>
  );
};

export default DistrictChurchAdminsPage;
