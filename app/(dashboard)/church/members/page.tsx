"use client";

import { useState, useEffect, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAuthSession } from '@/hooks/useAuthSession';
import { deleteMember as deleteMemberApi, fetchChurchMembers } from '@/lib/api';

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
    backgroundColor: 'var(--surface-soft)',
    color: 'var(--accent)',
    border: '1px solid var(--surface-border)',
  },
  inactive: {
    backgroundColor: 'var(--surface-soft)',
    color: 'var(--danger)',
    border: '1px solid var(--surface-border)',
  },
  pending: {
    backgroundColor: 'var(--surface-soft)',
    color: 'var(--primary)',
    border: '1px solid var(--surface-border)',
  },
};

const fieldErrorStyle: CSSProperties = {
  margin: '0.2rem 0 0',
  color: '#b42318',
  fontSize: '0.75rem',
  fontWeight: 500,
};

export default function ChurchMembersPage() {
  const router = useRouter();
  const { token, user } = useAuthSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const membersPerPage = 10;

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
      {addOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(4,12,24,0.55)', display: 'grid', placeItems: 'center', zIndex: 100,
        }}>
          <div style={{ background: 'var(--surface-primary)', borderRadius: 20, width: 'min(520px, 100%)', maxHeight: '90vh', overflowY: 'auto', padding: '1.6rem', display: 'grid', gap: '1rem', border: '1px solid var(--surface-border)', boxShadow: '0 20px 45px rgba(8, 22, 48, 0.18)' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--shell-foreground)' }}>Add Member</h3>
              <button type="button" style={{ border: 'none', background: 'transparent', color: 'var(--muted)', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }} onClick={() => setAddOpen(false)}>Close</button>
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
                <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>
                  Password
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={addForm.password}
                    onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                    style={{ borderRadius: 12, border: '1px solid var(--surface-border)', padding: '0.6rem 0.8rem', fontSize: '0.95rem', background: 'var(--surface-primary)', color: 'var(--shell-foreground)' }}
                  />
                </label>
                <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>
                  Confirm password
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={addForm.confirmPassword}
                    onChange={e => setAddForm(f => ({ ...f, confirmPassword: e.target.value }))}
                    style={{ borderRadius: 12, border: '1px solid var(--surface-border)', padding: '0.6rem 0.8rem', fontSize: '0.95rem', background: 'var(--surface-primary)', color: 'var(--shell-foreground)' }}
                  />
                </label>
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
                <button type="submit" disabled={addForm.isSubmitting} style={{ borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, var(--primary), var(--accent))', color: 'var(--on-primary)', padding: '0.55rem 1.15rem', fontWeight: 600, fontSize: '0.95rem', boxShadow: '0 14px 28px rgba(8, 22, 48, 0.18)', cursor: addForm.isSubmitting ? 'not-allowed' : 'pointer', opacity: addForm.isSubmitting ? 0.65 : 1 }}>
                  {addForm.isSubmitting ? 'Creating…' : 'Create member'}
                </button>
              </div>
            </form>
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
          
          <button
            onClick={handleAddMember}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              color: 'var(--on-primary)',
              border: 'none',
              borderRadius: 14,
              padding: '0.55rem 1.15rem',
              fontWeight: 600,
              fontSize: '0.875rem',
              boxShadow: '0 14px 28px rgba(8, 22, 48, 0.18)',
              cursor: 'pointer',
              transition: 'background 0.2s, box-shadow 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.boxShadow = '0 18px 36px rgba(8, 22, 48, 0.26)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.boxShadow = '0 14px 28px rgba(8, 22, 48, 0.18)';
            }}
          >
            <FiPlus size={18} />
            Add Member
          </button>
        </div>

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
