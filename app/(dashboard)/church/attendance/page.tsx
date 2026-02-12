'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { IconAlertTriangle, IconCalendarEvent, IconChecklist, IconDownload, IconFileText } from '@tabler/icons-react';

import RequireRole from '@/components/RequireRole';
import { useAuthSession } from '@/hooks/useAuthSession';
import { fetchUmugandaEventAttendance, fetchUmugandaEvents, type UmugandaEventAttendance, type UmugandaEventSummary } from '@/lib/api';

const containerStyle: CSSProperties = {
  display: 'grid',
  gap: '2rem',
  padding: '2rem',
  maxWidth: '1200px',
  margin: '0 auto',
};

const headerStyle: CSSProperties = {
  display: 'grid',
  gap: '0.5rem',
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '2rem',
  fontWeight: 700,
  color: 'var(--shell-foreground)',
};

const subtitleStyle: CSSProperties = {
  margin: 0,
  color: 'var(--muted)',
  fontSize: '1rem',
};

const cardStyle: CSSProperties = {
  background: 'var(--surface-primary)',
  borderRadius: '12px',
  padding: '1.5rem',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
  border: '1px solid var(--surface-border)',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.9rem',
};

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '0.75rem',
  borderBottom: '1px solid var(--surface-border)',
  fontWeight: 600,
  color: 'var(--shell-foreground)',
};

const tdStyle: CSSProperties = {
  padding: '0.75rem',
  borderBottom: '1px solid var(--surface-soft)',
  color: 'var(--shell-foreground)',
};

const statusBadge = (status: string): CSSProperties => ({
  padding: '0.25rem 0.5rem',
  borderRadius: '4px',
  fontSize: '0.8rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  backgroundColor: status === 'APPROVED' ? '#dcfce7' : '#fef3c7',
  color: status === 'APPROVED' ? '#166534' : '#92400e',
});

const loadingStyle: CSSProperties = {
  ...cardStyle,
  display: 'grid',
  placeItems: 'center',
  minHeight: '200px',
  textAlign: 'center',
};

const errorStyle: CSSProperties = {
  ...cardStyle,
  border: '1px solid rgba(198, 62, 85, 0.35)',
  background: 'rgba(198, 62, 85, 0.08)',
  color: '#c63e55',
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const exportToCSV = (data: UmugandaEventAttendance[]) => {
  if (data.length === 0) return;

  const headers = ['Date', 'Member Name', 'National ID', 'Church', 'Event'];
  const csvContent = [
    headers.join(','),
    ...data.map(record => [
      formatDate(record.checkedInAt),
      `"${record.member?.firstName} ${record.member?.lastName}"`,
      record.member?.nationalId || 'N/A',
      `"${record.church?.name}"`,
      `Event ${record.eventId.slice(-8)}`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `attendance-records-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportToPDF = (data: UmugandaEventAttendance[]) => {
  if (data.length === 0) return;

  // Create a simple HTML table for PDF generation
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Attendance Records</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #1a365d; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .header { margin-bottom: 10px; }
        .date { text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Church Attendance Records</h1>
        <div class="date">Generated on: ${new Date().toLocaleDateString()}</div>
        <div>Total Records: ${data.length}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Member Name</th>
            <th>National ID</th>
            <th>Church</th>
            <th>Event</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(record => `
            <tr>
              <td>${formatDate(record.checkedInAt)}</td>
              <td>${record.member?.firstName} ${record.member?.lastName}</td>
              <td>${record.member?.nationalId || 'N/A'}</td>
              <td>${record.church?.name}</td>
              <td>Event ${record.eventId.slice(-8)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  // Create a blob and download as HTML (user can print/save as PDF)
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `attendance-records-${new Date().toISOString().split('T')[0]}.html`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const ChurchAttendancePage = () => {
  const { token, user } = useAuthSession();
  const [attendance, setAttendance] = useState<UmugandaEventAttendance[]>([]);
  const [events, setEvents] = useState<UmugandaEventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');

  useEffect(() => {
    const rawChurchId = user?.churchId;

    if (!token || typeof rawChurchId !== 'string' || !rawChurchId) {
      setLoading(false);
      return;
    }

    const churchId = rawChurchId;

    (async () => {
      try {
        // Fetch all Umuganda events
        const fetchedEvents = await fetchUmugandaEvents(token);
        setEvents(fetchedEvents);
        
        // For each event, fetch attendance records filtered by churchId
        const allAttendance: UmugandaEventAttendance[] = [];
        for (const event of fetchedEvents) {
          try {
            const eventAttendance = await fetchUmugandaEventAttendance(token, event.id, { churchId });
            allAttendance.push(...eventAttendance);
          } catch (err) {
            // Skip events that don't have attendance or fail to load
            console.warn(`Failed to load attendance for event ${event.id}`, err);
          }
        }
        
        setAttendance(allAttendance);
      } catch (err) {
        console.error('Failed to fetch attendance', err);
        setError('Failed to load attendance records.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token, user?.churchId]);

  const sortedAttendance = useMemo(() => {
    return [...attendance].sort((a, b) => new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime());
  }, [attendance]);

  const filteredAttendance = useMemo(() => {
    if (selectedEventId === 'all') {
      return sortedAttendance;
    }
    return sortedAttendance.filter(record => record.eventId === selectedEventId);
  }, [sortedAttendance, selectedEventId]);

  if (loading) {
    return (
      <RequireRole allowed="CHURCH_ADMIN">
        <div style={loadingStyle}>
          <p>Loading attendance records…</p>
        </div>
      </RequireRole>
    );
  }

  if (error) {
    return (
      <RequireRole allowed="CHURCH_ADMIN">
        <div style={errorStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <IconAlertTriangle size={24} />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Error loading attendance</h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>{error}</p>
            </div>
          </div>
        </div>
      </RequireRole>
    );
  }

  return (
    <RequireRole allowed="CHURCH_ADMIN">
      <div style={containerStyle}>
        <header style={headerStyle}>
          <h1 style={titleStyle}>Attendance Log</h1>
          <p style={subtitleStyle}>
            View and manage attendance records for your church. Total records: {sortedAttendance.length}
          </p>
        </header>

        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>
              Attendance Records ({filteredAttendance.length})
            </h2>
            
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>
                  Filter by Event
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    border: '1px solid var(--surface-border)',
                    background: 'white',
                    fontSize: '0.875rem',
                    minWidth: '200px',
                  }}
                >
                  <option value="all">All Events</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {formatDate(event.date)} - {event.theme}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => exportToCSV(filteredAttendance)}
                  disabled={filteredAttendance.length === 0}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--surface-border)',
                    background: '#10b981',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: filteredAttendance.length > 0 ? 'pointer' : 'not-allowed',
                    opacity: filteredAttendance.length > 0 ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <IconDownload size={16} />
                  CSV
                </button>
                <button
                  onClick={() => exportToPDF(filteredAttendance)}
                  disabled={filteredAttendance.length === 0}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid var(--surface-border)',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: filteredAttendance.length > 0 ? 'pointer' : 'not-allowed',
                    opacity: filteredAttendance.length > 0 ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <IconFileText size={16} />
                  PDF
                </button>
              </div>
            </div>
          </div>

          {filteredAttendance.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
              <IconChecklist size={48} stroke={1} />
              <p style={{ margin: '1rem 0 0', fontSize: '1.1rem' }}>No attendance records found</p>
              <p>Attendance records will appear here once members check in to events.</p>
            </div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Member Name</th>
                  <th style={thStyle}>National ID</th>
                  <th style={thStyle}>Church</th>
                  <th style={thStyle}>Event</th>
                </tr>
              </thead>
              <tbody>
                {sortedAttendance.map((record) => (
                  <tr key={record.id}>
                    <td style={tdStyle}>{formatDate(record.checkedInAt)}</td>
                    <td style={tdStyle}>
                      {record.member ? `${record.member.firstName} ${record.member.lastName}` : 'Unknown'}
                    </td>
                    <td style={tdStyle}>{record.member?.nationalId || 'N/A'}</td>
                    <td style={tdStyle}>{record.church?.name || 'Unknown Church'}</td>
                    <td style={tdStyle}>
                      {record.eventId ? `Event ${record.eventId.slice(-8)}` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </RequireRole>
  );
};

export default ChurchAttendancePage;
