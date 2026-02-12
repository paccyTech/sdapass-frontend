"use client";

import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiChevronLeft, FiChevronRight, FiUploadCloud, FiDownload, FiInfo } from 'react-icons/fi';
import { useAuthSession } from '@/hooks/useAuthSession';
import { deleteMember as deleteMemberApi, fetchChurchMembers } from '@/lib/api';
import { PasswordInput } from '@/components/ui/PasswordInput';

interface Member {
  id: string;
  name: string;
  email: string;
  nationalId: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
}

const statusStyles: Record<Member['status'], CSSProperties> = {
  active: {
    backgroundColor: 'rgba(72, 187, 120, 0.1)',
    color: '#2f855a',
    border: '1px solid rgba(72, 187, 120, 0.3)',
    padding: '0.25rem 0.75rem',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  inactive: {
    backgroundColor: 'rgba(245, 101, 101, 0.1)',
    color: '#c53030',
    border: '1px solid rgba(245, 101, 101, 0.3)',
    padding: '0.25rem 0.75rem',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  pending: {
    backgroundColor: 'rgba(237, 137, 54, 0.1)',
    color: '#c05621',
    border: '1px solid rgba(237, 137, 54, 0.3)',
    padding: '0.25rem 0.75rem',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
};

const fieldErrorStyle: CSSProperties = {
  margin: '0.2rem 0 0',
  color: '#b42318',
  fontSize: '0.75rem',
  fontWeight: 500,
};

const buttonBase: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  borderRadius: '10px',
  border: 'none',
  padding: '0.6rem 1.1rem',
  fontWeight: 500,
  fontSize: '0.9rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  whiteSpace: 'nowrap',
  minWidth: 'fit-content',
};

const primaryButton: CSSProperties = {
  ...buttonBase,
  backgroundColor: '#1a365d',
  color: 'white',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: '#2c5282',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  },
  '&:active': {
    transform: 'translateY(0)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};

const secondaryButton: CSSProperties = {
  ...buttonBase,
  backgroundColor: 'white',
  color: '#1a365d',
  border: '1px solid #cbd5e0',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: '#f7fafc',
    borderColor: '#a0aec0',
    transform: 'translateY(-1px)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
};

const iconButton: CSSProperties = {
  ...buttonBase,
  padding: '0.5rem',
  borderRadius: '8px',
  backgroundColor: 'transparent',
  color: '#718096',
  transition: 'all 0.2s ease',
};

const iconButtonHover = {
  backgroundColor: 'rgba(26, 54, 93, 0.05)',
  color: '#1a365d',
};

const bannerStyles: Record<'info' | 'success' | 'error', CSSProperties> = {
  info: {
    background: 'rgba(26, 54, 93, 0.05)',
    border: '1px solid rgba(26, 54, 93, 0.1)',
    color: '#1a365d',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  success: {
    background: 'rgba(72, 187, 120, 0.1)',
    border: '1px solid rgba(72, 187, 120, 0.3)',
    color: '#2f855a',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
  error: {
    background: 'rgba(245, 101, 101, 0.1)',
    border: '1px solid rgba(245, 101, 101, 0.3)',
    color: '#c53030',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.9rem',
    fontWeight: 500,
  },
};

export default function ChurchMembersPage() {
  const router = useRouter();
  const { token, user } = useAuthSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const membersPerPage = 10;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importing, setImporting] = useState(false);
  const [actionBanner, setActionBanner] = useState<{ tone: 'info' | 'success' | 'error'; text: string } | null>(null);
  const [showImportInfo, setShowImportInfo] = useState(false);

  // Fetch members from backend
  useEffect(() => {
    if (!token) return;
    if (!user || !user.churchId) {
      setMembers([]);
      setLoading(false);
      return;
    }
    const churchId = user.churchId;
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const data = await fetchChurchMembers(token, { churchId });
        const formatted: Member[] = data.map((m) => ({
          id: m.id,
          name: `${m.firstName} ${m.lastName}`,
          email: m.email ?? '-',
          nationalId: m.nationalId,
          phone: m.phoneNumber,
          status: m.memberPass?.token ? 'active' : 'pending',
        }));
        setMembers(formatted);
      } catch (error) {
        console.error('Error fetching members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [token, user]);

  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.nationalId.includes(searchTerm) ||
    member.phone.includes(searchTerm)
  );

  // Get current members
  const indexOfLastMember = currentPage * membersPerPage;
  const indexOfFirstMember = indexOfLastMember - membersPerPage;
  const currentMembers = filteredMembers.slice(indexOfFirstMember, indexOfLastMember);
  const totalPages = Math.ceil(filteredMembers.length / membersPerPage);

  // Modal state for add member
  const [addOpen, setAddOpen] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Record<string, boolean>>({});
  const [addForm, setAddForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    nationalId: '',
    password: '',
    confirmPassword: '',
    isSubmitting: false,
    error: '',
    success: '',
  });
  const [addFormErrors, setAddFormErrors] = useState<{ nationalId?: string }>({});

  const handleAddMember = () => {
    setAddForm({
      firstName: '',
      lastName: '',
      phoneNumber: '',
      email: '',
      nationalId: '',
      password: '',
      confirmPassword: '',
      isSubmitting: false,
      error: '',
      success: '',
    });
    setAddFormErrors({});
    setAddOpen(true);
  };

  const handleNationalIdChange = (value: string) => {
    setAddForm((prev) => ({ ...prev, nationalId: value }));

    if (!value.trim()) {
      setAddFormErrors((prev) => ({ ...prev, nationalId: 'National ID is required.' }));
      return;
    }

    setAddFormErrors((prev) => ({ ...prev, nationalId: undefined }));
  };

  const handleExportMembers = () => {
    if (!members.length) {
      setActionBanner({ tone: 'info', text: 'No members available to export yet.' });
      return;
    }

    const header = ['First Name', 'Last Name', 'Phone Number', 'Email', 'National ID', 'Status'];
    const lines = members.map((member) => {
      const [firstName, ...rest] = member.name.split(' ');
      const lastName = rest.join(' ');
      const clean = (value: string) => {
        const needsQuotes = value.includes(',') || value.includes('"') || value.includes('\n');
        const escaped = value.replace(/"/g, '""');
        return needsQuotes ? `"${escaped}"` : escaped;
      };
      return [
        clean(firstName ?? ''),
        clean(lastName ?? ''),
        clean(member.phone ?? ''),
        clean(member.email ?? ''),
        clean(member.nationalId ?? ''),
        clean(member.status),
      ].join(',');
    });

    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `church-members-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setActionBanner({ tone: 'success', text: `Exported ${members.length} member${members.length === 1 ? '' : 's'} to CSV.` });
  };

  const triggerImportDialog = () => {
    setActionBanner(null);
    fileInputRef.current?.click();
  };

  const handleDownloadTemplate = () => {
    const templateRows = [
      ['First Name', 'Last Name', 'Phone Number', 'Email', 'National ID'],
      ['Jane', 'Doe', '0780000000', 'janedoe@example.com', '1234567890123456'],
    ];
    const csv = templateRows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'church-members-import-template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const parseCsvLine = (line: string) => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  };

  const normalizeKey = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '');

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    event.target.value = '';

    if (!token || !user?.churchId) {
      setActionBanner({ tone: 'error', text: 'You must be signed in as a church admin to import members.' });
      return;
    }

    setImporting(true);
    setActionBanner({ tone: 'info', text: `Importing members from ${file.name}…` });

    try {
      const text = await file.text();
      const rawLines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

      if (!rawLines.length) {
        setActionBanner({ tone: 'error', text: 'The uploaded file is empty.' });
        return;
      }

      const headerValues = parseCsvLine(rawLines[0]);
      const headerIndex: Record<string, number> = {};
      headerValues.forEach((value, index) => {
        const key = normalizeKey(value);
        if (key) {
          headerIndex[key] = index;
        }
      });

      const requiredKeys: Array<'firstname' | 'lastname' | 'phonenumber' | 'nationalid'> = [
        'firstname',
        'lastname',
        'phonenumber',
        'nationalid',
      ];

      const missingHeaders = requiredKeys.filter((key) => headerIndex[key] === undefined);
      if (missingHeaders.length) {
        setActionBanner({
          tone: 'error',
          text: `Missing required columns in CSV: ${missingHeaders.join(', ')}.`,
        });
        return;
      }

      const rows = rawLines.slice(1);
      if (!rows.length) {
        setActionBanner({ tone: 'error', text: 'No member rows were found in the uploaded file.' });
        return;
      }

      const { createMember } = await import('@/lib/api');
      const existingNationalIds = new Set(members.map((member) => member.nationalId));
      const createdMembers: Member[] = [];
      const failures: { line: number; reason: string }[] = [];

      for (let i = 0; i < rows.length; i += 1) {
        const lineNumber = i + 2; // account for header row
        const raw = rows[i];
        if (!raw.trim()) {
          continue;
        }

        const columns = parseCsvLine(raw);
        const valueFor = (key: string) => {
          const index = headerIndex[key];
          if (index === undefined) {
            return '';
          }
          const original = columns[index] ?? '';
          return original.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
        };

        const nationalId = valueFor('nationalid');
        const firstName = valueFor('firstname');
        const lastName = valueFor('lastname');
        const phoneNumber = valueFor('phonenumber');
        const email = valueFor('email');
        if (!nationalId || !firstName || !lastName || !phoneNumber) {
          failures.push({ line: lineNumber, reason: 'Missing required fields' });
          continue;
        }

        if (existingNationalIds.has(nationalId)) {
          failures.push({ line: lineNumber, reason: 'Member with this national ID already exists' });
          continue;
        }

        let passwordBase = firstName.replace(/\s+/g, '');
        if (!passwordBase) {
          passwordBase = 'member';
        }

        if (passwordBase.length < 3) {
          const padCharacter = passwordBase[passwordBase.length - 1] ?? 'm';
          passwordBase = passwordBase.padEnd(3, padCharacter);
        }

        let generatedPassword = `${passwordBase}@2026`;
        if (generatedPassword.length < 8) {
          generatedPassword = generatedPassword.padEnd(8, '6');
        }

        try {
          const { member } = await createMember(token, {
            nationalId,
            firstName,
            lastName,
            phoneNumber,
            email: email || undefined,
            password: generatedPassword,
          });

          existingNationalIds.add(member.nationalId);
          createdMembers.push({
            id: member.id,
            name: `${member.firstName} ${member.lastName}`.trim(),
            email: member.email ?? '-',
            nationalId: member.nationalId,
            phone: member.phoneNumber,
            status: member.memberPass?.token ? 'active' : 'pending',
          });
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Unknown error creating member';
          failures.push({ line: lineNumber, reason: message });
        }
      }

      if (createdMembers.length) {
        setMembers((prev) => [...prev, ...createdMembers]);
        setCurrentPage(1);
      }

      if (failures.length && !createdMembers.length) {
        const preview = failures
          .slice(0, 5)
          .map((failure) => `row ${failure.line}: ${failure.reason}`)
          .join(' • ');
        setActionBanner({
          tone: 'error',
          text: `No members were imported. Issues found at ${preview}${failures.length > 5 ? ' …' : ''}`,
        });
        return;
      }

      const summaryParts = [`Imported ${createdMembers.length} member${createdMembers.length === 1 ? '' : 's'}. Passwords default to FirstName@2026.`];
      if (failures.length) {
        const preview = failures
          .slice(0, 5)
          .map((failure) => `row ${failure.line}: ${failure.reason}`)
          .join(' • ');
        summaryParts.push(`Skipped ${failures.length} row${failures.length === 1 ? '' : 's'} (${preview}${failures.length > 5 ? ' …' : ''}).`);
        setActionBanner({ tone: 'error', text: summaryParts.join(' ') });
      } else {
        setActionBanner({ tone: 'success', text: summaryParts.join(' ') });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to process the uploaded file.';
      setActionBanner({ tone: 'error', text: message });
    } finally {
      setImporting(false);
    }
  };

  async function handleCreateMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !user?.churchId) return;
    setAddForm((prev) => ({ ...prev, isSubmitting: true, error: '', success: '' }));
    try {
      const trimmedFirstName = addForm.firstName.trim();
      const trimmedLastName = addForm.lastName.trim();
      const trimmedPhone = addForm.phoneNumber.trim();
      const trimmedEmail = addForm.email.trim();
      const normalizedNationalId = addForm.nationalId.trim();
      const trimmedPassword = addForm.password.trim();
      const trimmedConfirm = addForm.confirmPassword.trim();

      if (!trimmedFirstName || !trimmedLastName || !trimmedPhone || !normalizedNationalId) {
        setAddFormErrors((prev) => ({ ...prev, nationalId: 'National ID is required.' }));
        throw new Error('First name, last name, phone number, and national ID are required.');
      }

      if (trimmedPassword.length < 8) {
        throw new Error('Password must be at least 8 characters.');
      }

      if (trimmedPassword !== trimmedConfirm) {
        throw new Error('Passwords do not match.');
      }

      const { member } = await (await import('@/lib/api')).createMember(token, {
        nationalId: normalizedNationalId,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        phoneNumber: trimmedPhone,
        email: trimmedEmail || undefined,
        password: trimmedPassword,
      });
      setMembers((prev) => [
        ...prev,
        {
          id: member.id,
          name: `${member.firstName} ${member.lastName}`,
          email: member.email ?? '-',
          nationalId: member.nationalId,
          phone: member.phoneNumber,
          status: member.memberPass?.token ? 'active' : 'pending',
        },
      ]);
      setAddForm((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
        success: `Member ${member.firstName} ${member.lastName} created. Password set successfully.`,
      }));
      setAddFormErrors({});
    } catch (err: any) {
      setAddForm((prev) => ({ ...prev, error: err.message || 'Could not create member' }));
    } finally {
      setAddForm((prev) => ({ ...prev, isSubmitting: false }));
    }
  }

  const handleEditMember = (id: string) => {
    // Navigate to edit member form
    router.push(`/church/members/${id}/edit`);
  };

  const handleDeleteMember = async (id: string) => {
    if (!token || !user?.churchId) return;

    if (!confirm('Are you sure you want to delete this member?')) {
      return;
    }

    try {
      setDeletingIds((prev) => ({ ...prev, [id]: true }));
      await deleteMemberApi(token, id);
      setMembers((prev) => prev.filter((member) => member.id !== id));
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Could not delete member. Please try again.');
    } finally {
      setDeletingIds((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <div>Loading members...</div>
      </div>
    );
  }

  return (
    <>
      <input
        type="file"
        accept=".csv,text/csv"
        ref={fileInputRef}
        onChange={handleImportFile}
        style={{ display: 'none' }}
      />
      {addOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(4,12,24,0.55)', display: 'grid', placeItems: 'center', zIndex: 100,
        }}>
          <div style={{ background: '#ffffff', borderRadius: 20, width: 'min(520px, 100%)', maxHeight: '90vh', overflowY: 'auto', padding: '1.6rem', display: 'grid', gap: '1rem', border: '1px solid var(--surface-border)', boxShadow: '0 20px 45px rgba(8, 22, 48, 0.18)' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--shell-foreground)' }}>Add Member</h3>
              <button 
                type="button" 
                style={{
                  ...iconButton,
                  padding: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(26, 54, 93, 0.05)';
                  e.currentTarget.style.color = '#1a365d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#718096';
                }}
                onClick={() => setAddOpen(false)}
              >
                Close
              </button>
            </header>
            <form style={{ display: 'grid', gap: '0.9rem' }} onSubmit={handleCreateMember}>
              <div style={{ display: 'grid', gap: '0.6rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>
                  First name
                  <input required value={addForm.firstName} onChange={e => setAddForm(f => ({ ...f, firstName: e.target.value }))} style={{ borderRadius: 12, border: '1px solid var(--surface-border)', padding: '0.6rem 0.8rem', fontSize: '0.95rem', background: 'var(--surface-primary)', color: 'var(--shell-foreground)' }} />
                </label>
                <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>
                  Last name
                  <input required value={addForm.lastName} onChange={e => setAddForm(f => ({ ...f, lastName: e.target.value }))} style={{ borderRadius: 12, border: '1px solid var(--surface-border)', padding: '0.6rem 0.8rem', fontSize: '0.95rem', background: 'var(--surface-primary)', color: 'var(--shell-foreground)' }} />
                </label>
                <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>
                  Phone number
                  <input required value={addForm.phoneNumber} onChange={e => setAddForm(f => ({ ...f, phoneNumber: e.target.value }))} style={{ borderRadius: 12, border: '1px solid var(--surface-border)', padding: '0.6rem 0.8rem', fontSize: '0.95rem', background: 'var(--surface-primary)', color: 'var(--shell-foreground)' }} />
                </label>
                <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>
                  Email
                  <input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} style={{ borderRadius: 12, border: '1px solid var(--surface-border)', padding: '0.6rem 0.8rem', fontSize: '0.95rem', background: 'var(--surface-primary)', color: 'var(--shell-foreground)' }} />
                </label>
                <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>
                  National ID
                  <input
                    required
                    value={addForm.nationalId}
                    onChange={e => handleNationalIdChange(e.target.value)}
                    inputMode="text"
                    aria-invalid={Boolean(addFormErrors.nationalId)}
                    style={{ borderRadius: 12, border: '1px solid var(--surface-border)', padding: '0.6rem 0.8rem', fontSize: '0.95rem', background: 'var(--surface-primary)', color: 'var(--shell-foreground)' }}
                  />
                  {addFormErrors.nationalId && <span style={fieldErrorStyle}>{addFormErrors.nationalId}</span>}
                </label>
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  <PasswordInput
                    label="Password"
                    required
                    minLength={8}
                    value={addForm.password}
                    onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                    style={{ 
                      borderRadius: 12, 
                      border: '1px solid var(--surface-border)', 
                      background: 'var(--surface-primary)', 
                      color: 'var(--shell-foreground)',
                      width: '100%'
                    }}
                  />
                </div>
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  <PasswordInput
                    label="Confirm password"
                    required
                    minLength={8}
                    value={addForm.confirmPassword}
                    onChange={e => setAddForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    style={{ 
                      borderRadius: 12, 
                      border: '1px solid var(--surface-border)', 
                      background: 'var(--surface-primary)', 
                      color: 'var(--shell-foreground)',
                      width: '100%'
                    }}
                  />
                </div>
              </div>
              {addForm.error && (
                <div style={{ padding: '0.9rem 1rem', borderRadius: 12, background: 'rgba(135,32,58,0.1)', border: '1px solid rgba(135,32,58,0.25)', color: '#87203a' }}>
                  <strong>Unable to create member</strong>
                  <p style={{ margin: '0.35rem 0 0' }}>{addForm.error}</p>
                </div>
              )}
              {addForm.success && (
                <div style={{ padding: '0.9rem 1rem', borderRadius: 12, background: 'rgba(31,157,119,0.12)', border: '1px solid rgba(31,157,119,0.32)', color: '#1f9d77' }}>
                  <strong>Member created</strong>
                  <p style={{ margin: '0.35rem 0 0' }}>{addForm.success}</p>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  style={{
                    borderRadius: 14,
                    border: '1px solid var(--surface-border)',
                    background: 'transparent',
                    color: 'var(--shell-foreground)',
                    padding: '0.55rem 1.15rem',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={addForm.isSubmitting} style={{ 
                  borderRadius: 14, 
                  border: 'none', 
                  background: '#1a365d', 
                  color: 'white', 
                  padding: '0.55rem 1.15rem', 
                  fontWeight: 600, 
                  fontSize: '0.95rem', 
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  cursor: addForm.isSubmitting ? 'not-allowed' : 'pointer', 
                  opacity: addForm.isSubmitting ? 0.65 : 1,
                  transition: 'all 0.2s ease',
                  ':hover': {
                    backgroundColor: '#2c5282',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                  },
                  ':active': {
                    transform: 'translateY(0)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }
                }}>
                  {addForm.isSubmitting ? 'Creating…' : 'Create member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showImportInfo && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(4,12,24,0.55)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 90,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              width: 'min(540px, 100%)',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 20,
              background: '#ffffff',
              border: '1px solid var(--surface-border)',
              padding: '1.75rem',
              display: 'grid',
              gap: '1.1rem',
              boxShadow: '0 24px 55px rgba(8,22,48,0.28)'
            }}
          >
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ display: 'grid', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)' }}>Import help</span>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--shell-foreground)' }}>Preparing your CSV upload</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowImportInfo(false)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--muted)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(26, 54, 93, 0.05)';
                  e.currentTarget.style.color = '#1a365d';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--muted)';
                }}
              >
                Close
              </button>
            </header>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--muted-foreground)' }}>
              Import members in bulk using a comma-separated values (CSV) file. Each successful row will create a new member under your church,
              trigger the welcome email (if the email column is provided), and generate a default password using their first name.
            </p>

            <section style={{ display: 'grid', gap: '0.55rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>Required columns</h3>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'grid', gap: '0.35rem', color: 'var(--muted-foreground)', fontSize: '0.95rem' }}>
                <li><strong>First Name</strong> – member&rsquo;s given name (used to build default password).</li>
                <li><strong>Last Name</strong> – family name.</li>
                <li><strong>Phone Number</strong> – must be unique and valid for SMS onboarding.</li>
                <li><strong>National ID</strong> – becomes the username; must be unique.</li>
                <li><strong>Email</strong> (optional) – include to send the welcome email.</li>
              </ul>
            </section>

            <section style={{ display: 'grid', gap: '0.55rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>Template structure</h3>
              <pre
                style={{
                  margin: 0,
                  padding: '1rem 1.2rem',
                  borderRadius: 14,
                  background: 'var(--surface-soft)',
                  border: '1px solid var(--surface-border)',
                  fontSize: '0.85rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--shell-foreground)',
                  overflowX: 'auto',
                }}
              >{`First Name,Last Name,Phone Number,Email,National ID
Jane,Doe,0780000000,janedoe@example.com,1234567890123456`}</pre>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted-foreground)' }}>
                Passwords are generated automatically in the format <code style={{ fontFamily: 'var(--font-mono)' }}>FirstName@2026</code>. If a name is shorter than
                three characters, it will be padded so the password meets security requirements.
              </p>
            </section>

            <section style={{ display: 'grid', gap: '0.55rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>Pro tips</h3>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'grid', gap: '0.35rem', color: 'var(--muted-foreground)', fontSize: '0.95rem' }}>
                <li>Avoid duplicate national IDs, emails, or phone numbers—conflicts are skipped and listed after import.</li>
                <li>Keep the header row intact so the importer can match each column.</li>
                <li>Use the download template button below for a fresh copy any time.</li>
              </ul>
            </section>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  handleDownloadTemplate();
                  setShowImportInfo(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  borderRadius: 14,
                  border: 'none',
                  background: '#1a365d',
                  color: 'white',
                  padding: '0.6rem 1.25rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 14px 28px rgba(8, 22, 48, 0.18)'
                }}
              >
                <FiDownload size={16} />
                Download template
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ padding: '1.5rem', display: 'grid', gap: '1.75rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h1 style={{ 
            fontSize: '1.875rem', 
            fontWeight: 600, 
            margin: 0,
            color: 'var(--shell-foreground)'
          }}>
            Church Members
          </h1>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleAddMember}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#184c8c',
                color: 'white',
                border: '1px solid #184c8c',
                borderRadius: '8px',
                padding: '0.6rem 1.2rem',
                fontWeight: 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#0f3a6e';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#184c8c';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.1)';
              }}
            >
              <FiPlus size={18} />
              Add Member
            </button>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1.05rem',
                borderRadius: 14,
                border: '1px solid var(--surface-border)',
                background: 'var(--surface-primary)',
                color: 'var(--shell-foreground)',
                fontWeight: 600,
                fontSize: '0.825rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-soft)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-primary)';
              }}
            >
              <FiDownload size={16} />
              Template CSV
            </button>
            <button
              type="button"
              onClick={handleExportMembers}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1.05rem',
                borderRadius: 14,
                border: '1px solid var(--surface-border)',
                background: 'var(--surface-primary)',
                color: 'var(--shell-foreground)',
                fontWeight: 600,
                fontSize: '0.825rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-soft)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-primary)';
              }}
            >
              <FiDownload size={16} />
              Export CSV
            </button>
            <button
              type="button"
              onClick={triggerImportDialog}
              disabled={importing}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1.05rem',
                borderRadius: 14,
                border: '1px solid var(--surface-border)',
                background: importing ? 'var(--surface-soft)' : 'var(--surface-primary)',
                color: importing ? 'var(--muted)' : 'var(--shell-foreground)',
                fontWeight: 600,
                fontSize: '0.825rem',
                cursor: importing ? 'not-allowed' : 'pointer',
                opacity: importing ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                if (!importing) {
                  e.currentTarget.style.backgroundColor = 'var(--surface-soft)';
                }
              }}
              onMouseOut={(e) => {
                if (!importing) {
                  e.currentTarget.style.backgroundColor = 'var(--surface-primary)';
                }
              }}
            >
              <FiUploadCloud size={16} />
              {importing ? 'Importing…' : 'Import CSV'}
            </button>
            <button
              type="button"
              onClick={() => setShowImportInfo(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.5rem 1.05rem',
                borderRadius: 14,
                border: '1px solid var(--surface-border)',
                background: 'var(--surface-primary)',
                color: 'var(--shell-foreground)',
                fontWeight: 600,
                fontSize: '0.825rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-soft)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-primary)';
              }}
            >
              <FiInfo size={18} />
              Import guide
            </button>
          </div>
        </div>

        {actionBanner && (
          <div
            style={{
              ...bannerStyles[actionBanner.tone],
              borderRadius: 16,
              padding: '0.9rem 1.1rem',
              fontSize: '0.9rem',
              fontWeight: 500,
              lineHeight: 1.5,
            }}
          >
            {actionBanner.text}
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
          paddingBottom: '1rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--surface-border)'
        }}>
          <div style={{
            position: 'relative',
            flex: 1,
            maxWidth: '400px'
          }}>
            <FiSearch style={{
              position: 'absolute',
              left: '0.75rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--muted)'
            }} />
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 1rem 0.5rem 2.5rem',
                border: '1px solid var(--surface-border)',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                backgroundColor: 'var(--surface-primary)',
                color: 'var(--shell-foreground)',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary)';
                e.target.style.boxShadow = '0 0 0 1px var(--primary)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--surface-border)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: '1120px'
          }}>
            <thead>
              <tr style={{
                backgroundColor: 'var(--surface-soft)',
                borderBottom: '1px solid var(--surface-border)',
                textAlign: 'left',
                fontSize: '0.75rem',
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 500 }}>Name</th>
                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 500 }}>Email</th>
                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 500 }}>National ID</th>
                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 500 }}>Phone</th>
                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '0.75rem 1.5rem', fontWeight: 500, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentMembers.length > 0 ? (
                currentMembers.map((member) => (
                  <tr 
                    key={member.id}
                    style={{
                      borderBottom: '1px solid var(--surface-border)',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-soft)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-primary)';
                    }}
                  >
                    <td style={{ 
                      padding: '1rem 1.5rem',
                      fontSize: '0.875rem',
                      color: 'var(--shell-foreground)',
                      fontWeight: 500
                    }}>
                      {member.name}
                    </td>
                    <td style={{ 
                      padding: '1rem 1.5rem',
                      fontSize: '0.875rem',
                      color: 'var(--muted)'
                    }}>
                      {member.email}
                    </td>
                    <td style={{ 
                      padding: '1rem 1.5rem',
                      fontSize: '0.875rem',
                      color: 'var(--muted)'
                    }}>
                      {member.nationalId}
                    </td>
                    <td style={{ 
                      padding: '1rem 1.5rem',
                      fontSize: '0.875rem',
                      color: 'var(--muted)'
                    }}>
                      {member.phone}
                    </td>
                    <td style={{ 
                      padding: '1rem 1.5rem'
                    }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          textTransform: 'capitalize',
                          ...(statusStyles[member.status] ?? statusStyles.pending)
                        }}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '1rem 1.5rem',
                      textAlign: 'right'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '0.5rem'
                      }}>
                        <button
                          onClick={() => handleEditMember(member.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '2rem',
                            height: '2rem',
                            borderRadius: '0.375rem',
                            border: '1px solid var(--surface-border)',
                            backgroundColor: 'var(--surface-soft)',
                            color: 'var(--muted)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--surface-primary)';
                            e.currentTarget.style.color = 'var(--shell-foreground)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--surface-soft)';
                            e.currentTarget.style.color = 'var(--muted)';
                          }}
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          disabled={Boolean(deletingIds[member.id])}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '2rem',
                            height: '2rem',
                            borderRadius: '0.375rem',
                            border: '1px solid var(--danger)',
                            backgroundColor: 'color-mix(in srgb, var(--danger) 12%, transparent)',
                            color: 'var(--danger)',
                            cursor: Boolean(deletingIds[member.id]) ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            opacity: Boolean(deletingIds[member.id]) ? 0.6 : 1,
                          }}
                          onMouseOver={(e) => {
                            if (deletingIds[member.id]) return;
                            e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--danger) 18%, transparent)';
                            e.currentTarget.style.color = 'var(--danger)';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--danger) 12%, transparent)';
                            e.currentTarget.style.color = 'var(--danger)';
                          }}
                        >
                          {deletingIds[member.id] ? (
                            <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>…</span>
                          ) : (
                            <FiTrash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td 
                    colSpan={6}
                    style={{
                      padding: '2rem 1.5rem',
                      textAlign: 'center',
                      color: 'var(--muted)',
                      fontSize: '0.875rem'
                    }}
                  >
                    No members found. {searchTerm && 'Try a different search term.'}
                  </td>
                </tr>
              )}
            </tbody>
        </table>
      </div>

      {filteredMembers.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.5rem 0',
          borderTop: '1px solid var(--surface-border)'
        }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
            Showing <span style={{ fontWeight: 500 }}>{indexOfFirstMember + 1}-{Math.min(indexOfLastMember, filteredMembers.length)}</span> of <span style={{ fontWeight: 500 }}>{filteredMembers.length}</span> members
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--surface-border)',
                  backgroundColor: 'var(--surface-primary)',
                  color: currentPage === 1 ? 'var(--muted)' : 'var(--shell-foreground)',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: currentPage === 1 ? 0.6 : 1
                }}
              >
                <FiChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Show first, last, and current page with neighbors
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '0.375rem',
                      border: '1px solid',
                      borderColor: currentPage === pageNum ? 'var(--primary)' : 'var(--surface-border)',
                      backgroundColor: currentPage === pageNum ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : 'var(--surface-primary)',
                      color: currentPage === pageNum ? 'var(--primary)' : 'var(--muted)',
                      fontWeight: currentPage === pageNum ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (currentPage !== pageNum) {
                        e.currentTarget.style.backgroundColor = 'var(--surface-soft)';
                        e.currentTarget.style.color = 'var(--shell-foreground)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (currentPage !== pageNum) {
                        e.currentTarget.style.backgroundColor = 'var(--surface-primary)';
                        e.currentTarget.style.color = 'var(--muted)';
                      }
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '2rem',
                  height: '2rem',
                  borderRadius: '0.375rem',
                  border: '1px solid var(--surface-border)',
                  backgroundColor: 'var(--surface-primary)',
                  color: currentPage === totalPages ? 'var(--muted)' : 'var(--shell-foreground)',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  opacity: currentPage === totalPages ? 0.6 : 1
                }}
              >
                <FiChevronRight size={16} />
              </button>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
