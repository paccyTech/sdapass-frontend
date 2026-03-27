'use client';

import { jsPDF } from 'jspdf';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { IconCalendar, IconFilter, IconDownload, IconFileTypePdf, IconFileTypeCsv, IconRefresh } from '@tabler/icons-react';

import RequireRole from '@/components/RequireRole';
import { RoleHero, type HeroStat } from '@/components/dashboard/RoleHero';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import {
  fetchAttendance,
  fetchAttendanceReport,
  fetchChurchDetail,
  fetchChurchMembers,
  type AttendanceRecordSummary,
  type AttendanceReportResponse,
  type ChurchSummary,
  type MemberSummary,
} from '@/lib/api';

const pageWrapperStyle: CSSProperties = {
  maxWidth: '1400px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

const filtersContainerStyle: CSSProperties = {
  background: 'white',
  borderRadius: '16px',
  padding: '1.5rem',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '1rem',
  alignItems: 'flex-end',
};

const filterGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  minWidth: '180px',
};

const filterLabelStyle: CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 600,
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const filterInputStyle: CSSProperties = {
  padding: '0.65rem 0.875rem',
  borderRadius: '10px',
  border: '1px solid #cbd5e0',
  fontSize: '0.9rem',
  background: 'white',
  color: '#1e293b',
  outline: 'none',
  transition: 'all 0.2s ease',
};

const filterSelectStyle: CSSProperties = {
  ...filterInputStyle,
  cursor: 'pointer',
};

const refreshButtonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.65rem 1.25rem',
  borderRadius: '10px',
  border: '1px solid #3b82f6',
  background: 'white',
  color: '#3b82f6',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
  gap: '1.5rem',
};

const cardStyle: CSSProperties = {
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  borderRadius: '16px',
  padding: '1.75rem',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

const cardHeaderStyle: CSSProperties = {
  display: 'grid',
  gap: '0.4rem',
};

const labelStyle: CSSProperties = {
  fontSize: '0.72rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'rgba(24,76,140,0.58)',
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-sans)',
  fontSize: '1.35rem',
  fontWeight: 600,
  color: '#1a365d',
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: 'var(--muted)',
  lineHeight: 1.6,
  fontSize: '0.98rem',
};

const previewShellStyle: CSSProperties = {
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  overflow: 'hidden',
  background: 'white',
  boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.9rem',
  color: 'var(--shell-foreground)',
};

const tableHeaderCell: CSSProperties = {
  background: 'rgba(26, 54, 93, 0.05)',
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontWeight: 600,
  color: '#1a365d',
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const tableCell: CSSProperties = {
  padding: '0.7rem 1rem',
  borderTop: '1px solid var(--surface-border)',
};

const actionBarStyle: CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  flexWrap: 'wrap',
};

const buttonStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  border: 'none',
  borderRadius: '10px',
  padding: '0.6rem 1.2rem',
  background: 'linear-gradient(135deg, #1a365d 0%, #2c5282 100%)',
  color: 'white',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 4px 6px -1px rgba(26, 54, 93, 0.3)',
  transition: 'all 0.2s ease',
  fontSize: '0.9rem',
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: 'white',
  color: '#1a365d',
  border: '1px solid #e2e8f0',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
};

const emptyStateStyle: CSSProperties = {
  margin: 0,
  fontStyle: 'italic',
  color: 'var(--muted)',
  padding: '1rem',
};

const footnoteStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.8rem',
  color: 'var(--text-soft-accent)',
};

const errorBannerStyle: CSSProperties = {
  padding: '1rem 1.2rem',
  borderRadius: '8px',
  background: 'rgba(245, 101, 101, 0.1)',
  color: '#c53030',
  border: '1px solid rgba(245, 101, 101, 0.2)',
  fontSize: '0.9rem',
  fontWeight: 500,
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.5rem',
  '&:before': {
    content: '"!"',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.2rem',
    height: '1.2rem',
    borderRadius: '50%',
    background: '#c53030',
    color: 'white',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    flexShrink: 0,
    marginTop: '0.1rem',
  },
};

const emptyStateCardStyle: CSSProperties = {
  ...cardStyle,
  alignItems: 'center',
  textAlign: 'center',
  color: '#718096',
  padding: '3rem 2rem',
  backgroundColor: 'rgba(247, 250, 252, 0.5)',
  border: '1px dashed #cbd5e0',
};

const statusBadgeBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.2rem 0.65rem',
  borderRadius: '999px',
  fontSize: '0.75rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  lineHeight: 1.2,
};

const statusApprovedStyle: CSSProperties = {
  ...statusBadgeBase,
  backgroundColor: 'rgba(72, 187, 120, 0.1)',
  color: '#2f855a',
  border: '1px solid rgba(72, 187, 120, 0.3)',
};

const statusPendingStyle: CSSProperties = {
  ...statusBadgeBase,
  backgroundColor: 'rgba(237, 137, 54, 0.1)',
  color: '#c05621',
  border: '1px solid rgba(237, 137, 54, 0.3)',
};

const statusNeutralStyle: CSSProperties = {
  ...statusBadgeBase,
  backgroundColor: 'rgba(160, 174, 192, 0.1)',
  color: '#4a5568',
  border: '1px solid rgba(160, 174, 192, 0.3)',
};

type ReportRow = Record<string, string | number | null | undefined>;

type ColumnDef = {
  key: string;
  label: string;
};

type ReportDefinition = {
  key: string;
  title: string;
  description: string;
  columns: ColumnDef[];
  rows: ReportRow[];
  footnote?: string;
};

const STATUS_COLUMNS: ColumnDef[] = [
  { key: 'status', label: 'Status' },
  { key: 'count', label: 'Records' },
  { key: 'share', label: 'Share of submissions' },
];

const SESSION_COLUMNS: ColumnDef[] = [
  { key: 'session', label: 'Session date' },
  { key: 'approved', label: 'Approved' },
  { key: 'pending', label: 'Pending' },
  { key: 'total', label: 'Total submissions' },
  { key: 'approvalRate', label: 'Approval rate' },
];

const MEMBER_COLUMNS: ColumnDef[] = [
  { key: 'member', label: 'Member' },
  { key: 'nationalId', label: 'National ID' },
  { key: 'approved', label: 'Approved attendance' },
  { key: 'pending', label: 'Pending records' },
  { key: 'lastSeen', label: 'Last engagement' },
];

const PENDING_COLUMNS: ColumnDef[] = [
  { key: 'member', label: 'Member' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'sessionDate', label: 'Session' },
  { key: 'status', label: 'Status' },
];

const formatCell = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toLocaleString() : String(value);
  }
  return String(value);
};

const formatDate = (input: string | null | undefined): string => {
  if (!input) {
    return '—';
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return input;
  }
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatDateTime = (input: string | null | undefined): string => {
  if (!input) {
    return '—';
  }
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return input;
  }
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const toTimestamp = (input: string | null | undefined): number => {
  if (!input) {
    return 0;
  }
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
};

const normalizeStatusLabel = (value: string | null | undefined): string => {
  if (!value) {
    return 'Pending';
  }
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 120) || 'export';

const buildCsv = (columns: ColumnDef[], rows: ReportRow[]) => {
  const escape = (text: string) =>
    text.includes(',') || text.includes('"') || text.includes('\n')
      ? `"${text.replace(/"/g, '""')}"`
      : text;
  const headers = columns.map((col) => escape(col.label));
  const data = rows.map((row) => columns.map((col) => escape(formatCell(row[col.key]))));
  return [headers.join(','), ...data.map((line) => line.join(','))].join('\n');
};

const downloadCsv = (title: string, columns: ColumnDef[], rows: ReportRow[]) => {
  if (!rows.length) {
    return;
  }
  const csv = buildCsv(columns, rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${slugify(title)}-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const downloadPdf = async (title: string, columns: ColumnDef[], rows: ReportRow[], preparedBy?: string, churchName?: string) => {
  if (!rows.length) {
    return;
  }

  const orientation = columns.length > 4 ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation });
  const marginX = 16;
  const marginY = 20;
  const footerHeight = 35;
  const headerHeight = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - marginX * 2;
  const colWidth = contentWidth / columns.length;
  const maxContentY = pageHeight - footerHeight - 5;

  // Track pages for footer
  const pages: number[] = [];

  const addHeader = () => {
    // Logo
    try {
      const logoUrl = '/sda-logo.png';
      fetch(logoUrl).then(response => {
        if (response.ok) {
          response.blob().then(blob => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64 = reader.result as string;
              const imgProps = doc.getImageProperties(base64);
              const logoWidth = 22;
              const logoHeight = (imgProps.height * logoWidth) / imgProps.width;
              doc.addImage(base64, 'PNG', marginX, marginY - 10, logoWidth, logoHeight);
            };
            reader.readAsDataURL(blob);
          });
        }
      }).catch(() => {});
    } catch {
      // Logo not available
    }

    // Date
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${dateStr} at ${timeStr}`, pageWidth - marginX, marginY - 2, { align: 'right' });

    // Title
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(title, marginX, marginY + 12);

    // Church name
    if (churchName) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(churchName, marginX, marginY + 20);
      doc.setTextColor(0, 0, 0);
    }
  };

  const addFooter = (pageNum: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Page ${pageNum}`, pageWidth - marginX - 20, pageHeight - 12, { align: 'right' });
    doc.text('Seventh-day Adventist Church Management System', marginX, pageHeight - 12);
    doc.text(`Prepared by: ${preparedBy || 'Church Administrator'}`, marginX, pageHeight - 22);
  };

  // Draw header on first page
  addHeader();
  pages.push(1);
  let pageNum = 1;
  let cursorY = marginY + headerHeight;

  // Draw table header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);

  const drawTableHeader = () => {
    const headerY = cursorY;
    columns.forEach((col, index) => {
      const x = marginX + index * colWidth;
      doc.text(col.label, x + 2, headerY + 5);
    });
    doc.line(marginX, headerY, pageWidth - marginX, headerY);
    doc.line(marginX, headerY + 8, pageWidth - marginX, headerY + 8);
    cursorY = headerY + 10;
  };

  drawTableHeader();

  // Draw rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setLineWidth(0.2);

  rows.forEach((row, rowIndex) => {
    const values = columns.map((col) => String(formatCell(row[col.key])));
    
    // Calculate row height based on text wrapping
    let rowHeight = 6;
    values.forEach((value, index) => {
      const lines = doc.splitTextToSize(value, colWidth - 4);
      rowHeight = Math.max(rowHeight, lines.length * 4 + 3);
    });

    // Check if we need a new page
    if (cursorY + rowHeight > maxContentY) {
      addFooter(pageNum);
      doc.addPage();
      pageNum++;
      pages.push(pageNum);
      cursorY = marginY + 10;
      // Redraw table header on new page
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      drawTableHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setLineWidth(0.2);
    }

    // Draw the row
    const rowY = cursorY;
    values.forEach((value, index) => {
      const x = marginX + index * colWidth;
      const lines = doc.splitTextToSize(value, colWidth - 4);
      doc.text(lines, x + 2, rowY + 4);
    });

    // Draw bottom line for the row
    doc.line(marginX, rowY + rowHeight - 1, pageWidth - marginX, rowY + rowHeight - 1);
    
    cursorY += rowHeight;
  });

  // Add final footer
  addFooter(pageNum);

  doc.save(`${slugify(title)}-${new Date().toISOString().slice(0, 10)}.pdf`);
};

const getStatusBadgeStyle = (value: string): CSSProperties => {
  const normalized = value.toLowerCase();
  if (normalized === 'approved') {
    return statusApprovedStyle;
  }
  if (normalized === 'pending' || normalized === 'awaiting review') {
    return statusPendingStyle;
  }
  return statusNeutralStyle;
};

type ReportCardProps = {
  report: ReportDefinition;
  loading: boolean;
  onDownloadCsv: (report: ReportDefinition) => void;
  onDownloadPdf: (report: ReportDefinition, preparedBy?: string, churchName?: string) => void;
  preparedBy?: string;
  churchName?: string;
};

const ReportCard = ({ report, loading, onDownloadCsv, onDownloadPdf, preparedBy, churchName }: ReportCardProps) => {
  const { title, description, columns, rows, footnote } = report;
  const previewRows = rows.slice(0, 6);

  return (
    <article style={cardStyle}>
      <header style={cardHeaderStyle}>
        <span style={labelStyle}>Report</span>
        <h3 style={titleStyle}>{title}</h3>
        <p style={descriptionStyle}>{description}</p>
      </header>

      <div style={previewShellStyle}>
        {loading ? (
          <p style={emptyStateStyle}>Loading data…</p>
        ) : previewRows.length ? (
          <table style={tableStyle}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} style={tableHeaderCell}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, index) => (
                <tr key={`${title}-preview-${index}`}>
                  {columns.map((column) => {
                    const cellValue = row[column.key];
                    if (column.key === 'status' && typeof cellValue === 'string') {
                      return (
                        <td key={column.key} style={tableCell}>
                          <span style={getStatusBadgeStyle(cellValue)}>{cellValue}</span>
                        </td>
                      );
                    }
                    return (
                      <td key={column.key} style={tableCell}>
                        {formatCell(cellValue)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={emptyStateStyle}>No records available yet.</p>
        )}
      </div>

      <div style={actionBarStyle}>
        <button
          style={{ ...buttonStyle, opacity: rows.length ? 1 : 0.6, pointerEvents: rows.length ? 'auto' : 'none' }}
          type="button"
          onClick={() => onDownloadCsv(report)}
          disabled={!rows.length}
        >
          Download CSV
        </button>
        <button
          style={{
            ...secondaryButtonStyle,
            opacity: rows.length ? 1 : 0.6,
            pointerEvents: rows.length ? 'auto' : 'none',
          }}
          type="button"
          onClick={() => onDownloadPdf(report, preparedBy, churchName)}
          disabled={!rows.length}
        >
          Export PDF
        </button>
      </div>

      {footnote && <p style={footnoteStyle}>{footnote}</p>}
    </article>
  );
};

const ReportsPage = () => {
  const { token, user } = useAuthSession();
  const churchId = user?.churchId ?? null;

  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [church, setChurch] = useState<ChurchSummary | null>(null);
  const [attendanceReport, setAttendanceReport] = useState<AttendanceReportResponse | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordSummary[]>([]);
  const [members, setMembers] = useState<MemberSummary[]>([]);

  // Filter states
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    if (!token || !churchId) {
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const params: { churchId: string; from?: string; to?: string; status?: string } = { churchId };
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      if (statusFilter !== 'all') params.status = statusFilter.toUpperCase();

      const [churchResult, reportResult, attendanceResult, memberResult] = await Promise.allSettled([
        fetchChurchDetail(token, churchId),
        fetchAttendanceReport(token, { churchId }),
        fetchAttendance(token, params),
        fetchChurchMembers(token, { churchId }),
      ]);

      const failures: string[] = [];

      if (churchResult.status === 'fulfilled') {
        setChurch(churchResult.value ?? null);
      } else {
        failures.push('church profile');
      }

      if (reportResult.status === 'fulfilled') {
        setAttendanceReport(reportResult.value ?? null);
      } else {
        failures.push('attendance summary');
      }

      if (attendanceResult.status === 'fulfilled') {
        setAttendanceRecords(attendanceResult.value ?? []);
      } else {
        failures.push('attendance records');
      }

      if (memberResult.status === 'fulfilled') {
        setMembers(memberResult.value ?? []);
      } else {
        failures.push('member roster');
      }

      setError(failures.length ? `Some reports could not be loaded: ${failures.join(', ')}.` : null);
      setStatus('loaded');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load reports.';
      setError(message);
      setStatus('error');
    }
  }, [token, churchId, dateFrom, dateTo, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summaryCounts = useMemo(() => {
    const total = attendanceReport?.summary.total ?? attendanceRecords.length;
    const approvedFromSummary = attendanceReport?.summary.approved;
    const pendingFromSummary = attendanceReport?.summary.pending;

    const approvedFallback = attendanceRecords.filter((record) => record.status === 'APPROVED').length;
    const approved = typeof approvedFromSummary === 'number' ? approvedFromSummary : approvedFallback;
    const pending = typeof pendingFromSummary === 'number' ? pendingFromSummary : Math.max(total - approved, 0);

    return {
      total,
      approved,
      pending,
    };
  }, [attendanceReport, attendanceRecords]);

  const statusRows = useMemo<ReportRow[]>(() => {
    const { total, approved, pending } = summaryCounts;
    const safeTotal = total > 0 ? total : approved + pending;
    const approvedShare = safeTotal ? `${Math.round((approved / safeTotal) * 100)}%` : '—';
    const pendingShare = safeTotal ? `${Math.round((pending / safeTotal) * 100)}%` : '—';

    return [
      {
        status: 'Approved',
        count: approved,
        share: approvedShare,
      },
      {
        status: 'Pending',
        count: pending,
        share: pendingShare,
      },
    ];
  }, [summaryCounts]);

  const sessionRows = useMemo<ReportRow[]>(() => {
    if (!attendanceRecords.length) {
      return [];
    }

    const buckets = new Map<
      string,
      {
        sessionDate: string | null;
        approved: number;
        pending: number;
        total: number;
      }
    >();

    attendanceRecords.forEach((record) => {
      const sessionId = record.session?.id ?? `unknown-${record.id}`;
      const bucket = buckets.get(sessionId) ?? {
        sessionDate: record.session?.date ?? record.createdAt ?? null,
        approved: 0,
        pending: 0,
        total: 0,
      };

      bucket.total += 1;
      if (record.status === 'APPROVED') {
        bucket.approved += 1;
      } else {
        bucket.pending += 1;
      }

      if (!bucket.sessionDate && (record.session?.date || record.createdAt)) {
        bucket.sessionDate = record.session?.date ?? record.createdAt ?? null;
      }

      buckets.set(sessionId, bucket);
    });

    return Array.from(buckets.values())
      .sort((a, b) => toTimestamp(b.sessionDate) - toTimestamp(a.sessionDate))
      .map((bucket) => ({
        session: formatDate(bucket.sessionDate),
        approved: bucket.approved,
        pending: bucket.pending,
        total: bucket.total,
        approvalRate: bucket.total ? `${Math.round((bucket.approved / bucket.total) * 100)}%` : '—',
      }));
  }, [attendanceRecords]);

  const memberRows = useMemo<ReportRow[]>(() => {
    if (!attendanceRecords.length) {
      return [];
    }

    const buckets = new Map<
      string,
      {
        id: string;
        name: string;
        nationalId: string | null;
        approved: number;
        pending: number;
        lastSeen: string | null;
      }
    >();

    attendanceRecords.forEach((record) => {
      const member = record.member;
      if (!member) {
        return;
      }

      const key = member.id;
      const name = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() || member.nationalId || 'Unnamed member';
      const bucket = buckets.get(key) ?? {
        id: key,
        name,
        nationalId: member.nationalId ?? null,
        approved: 0,
        pending: 0,
        lastSeen: null,
      };

      if (record.status === 'APPROVED') {
        bucket.approved += 1;
      } else {
        bucket.pending += 1;
      }

      const activityTimestamp = record.updatedAt ?? record.createdAt ?? null;
      if (activityTimestamp && (!bucket.lastSeen || toTimestamp(activityTimestamp) > toTimestamp(bucket.lastSeen))) {
        bucket.lastSeen = activityTimestamp;
      }

      buckets.set(key, bucket);
    });

    return Array.from(buckets.values())
      .sort((a, b) => {
        if (b.approved !== a.approved) {
          return b.approved - a.approved;
        }
        return toTimestamp(b.lastSeen) - toTimestamp(a.lastSeen);
      })
      .map((bucket) => ({
        member: bucket.name,
        nationalId: bucket.nationalId ?? '—',
        approved: bucket.approved,
        pending: bucket.pending,
        lastSeen: formatDateTime(bucket.lastSeen),
      }));
  }, [attendanceRecords]);

  const pendingRows = useMemo<ReportRow[]>(() =>
    attendanceRecords
      .filter((record) => record.status !== 'APPROVED')
      .sort((a, b) => toTimestamp(b.createdAt) - toTimestamp(a.createdAt))
      .slice(0, 10)
      .map((record) => ({
        member:
          record.member && (record.member.firstName || record.member.lastName)
            ? `${record.member.firstName ?? ''} ${record.member.lastName ?? ''}`.trim()
            : record.member?.nationalId ?? 'Unknown member',
        submitted: formatDateTime(record.createdAt),
        sessionDate: formatDate(record.session?.date),
        status: normalizeStatusLabel(record.status),
      })),
    [attendanceRecords],
  );

  const engagedMembers = memberRows.length;
  const registeredMembers = members.length;
  const approvedShare = summaryCounts.total
    ? `${Math.round((summaryCounts.approved / summaryCounts.total) * 100)}%`
    : '—';

  const heroStats: HeroStat[] = useMemo(() => {
    const submissionsValue = status === 'loaded' ? summaryCounts.total.toLocaleString() : '—';
    const pendingValue = status === 'loaded' ? summaryCounts.pending.toLocaleString() : '—';
    const engagedValue = status === 'loaded' ? engagedMembers.toLocaleString() : '—';

    const engagementTrend = registeredMembers
      ? `${Math.round((engagedMembers / registeredMembers) * 100)}% of members engaged`
      : engagedMembers
      ? `${engagedMembers.toLocaleString()} members engaged`
      : 'No engagement recorded yet';

    return [
      {
        label: 'Attendance submissions',
        value: submissionsValue,
        trend: `Approved: ${summaryCounts.approved.toLocaleString()} (${approvedShare})`,
      },
      {
        label: 'Awaiting approval',
        value: pendingValue,
        trend:
          summaryCounts.total && summaryCounts.pending
            ? `${Math.round((summaryCounts.pending / summaryCounts.total) * 100)}% of submissions`
            : 'No pending records',
      },
      {
        label: 'Active participants',
        value: engagedValue,
        trend: registeredMembers ? `${registeredMembers.toLocaleString()} members registered` : engagementTrend,
      },
    ];
  }, [status, summaryCounts, approvedShare, engagedMembers, registeredMembers]);

  const shellConfig = useMemo(
    () => ({
      hero: (
        <RoleHero
          role="CHURCH_ADMIN"
          headline={church?.name ? `${church.name} reports & analytics` : 'Church reports & analytics'}
          subheadline="Monitor attendance progress, review pending submissions, and track member engagement at a glance."
          stats={heroStats}
        />
      ),
    }),
    [church?.name, heroStats],
  );

  useDashboardShellConfig(shellConfig);

  const reports = useMemo<ReportDefinition[]>(() => {
    const definitions: ReportDefinition[] = [
      {
        key: 'statusSummary',
        title: 'Attendance status summary',
        description: 'Review the balance of approved and pending submissions for your church sessions.',
        columns: STATUS_COLUMNS,
        rows: statusRows,
        footnote:
          summaryCounts.total > 0 ? `Total submissions reviewed: ${summaryCounts.total.toLocaleString()}` : undefined,
      },
      {
        key: 'sessions',
        title: 'Attendance by session',
        description: 'See how each Umuganda session is progressing and spot any approvals still outstanding.',
        columns: SESSION_COLUMNS,
        rows: sessionRows,
        footnote:
          sessionRows.length > 0
            ? `Sessions tracked: ${sessionRows.length.toLocaleString()}`
            : undefined,
      },
      {
        key: 'memberEngagement',
        title: 'Member engagement',
        description: 'Identify members contributing regularly and those whose attendance still needs confirmation.',
        columns: MEMBER_COLUMNS,
        rows: memberRows,
        footnote:
          memberRows.length > 0
            ? `Members with recorded attendance: ${memberRows.length.toLocaleString()}`
            : registeredMembers
            ? 'No member attendance recorded yet.'
            : undefined,
      },
    ];

    definitions.push({
      key: 'pendingQueue',
      title: 'Pending approvals',
      description: 'Stay ahead of outstanding attendance submissions awaiting approval.',
      columns: PENDING_COLUMNS,
      rows: pendingRows,
      footnote: pendingRows.length ? `Showing latest ${pendingRows.length.toLocaleString()} pending records` : undefined,
    });

    return definitions;
  }, [statusRows, sessionRows, memberRows, pendingRows, summaryCounts.total, registeredMembers]);

  const handleDownloadCsv = useCallback((report: ReportDefinition) => {
    downloadCsv(report.title, report.columns, report.rows);
  }, []);

  const handleDownloadPdf = useCallback((report: ReportDefinition) => {
    const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Church Administrator' : 'Church Administrator';
    downloadPdf(report.title, report.columns, report.rows, userName, church?.name);
  }, [user, church?.name]);

  if (!churchId) {
    return (
      <RequireRole allowed="CHURCH_ADMIN">
        <section style={gridStyle}>
          <div style={emptyStateCardStyle}>
            <h3 style={{ ...titleStyle, fontSize: '1.3rem' }}>No church assignment detected</h3>
            <p style={descriptionStyle}>
              This church admin account is not linked to a church yet. Once an administrator assigns a church, your
              attendance reports will appear here.
            </p>
          </div>
        </section>
      </RequireRole>
    );
  }

  const isLoading = status === 'loading' || status === 'idle';

  return (
    <RequireRole allowed="CHURCH_ADMIN">
      <div style={pageWrapperStyle}>
        {/* Filters Section */}
        <div style={filtersContainerStyle}>
          <div style={filterGroupStyle}>
            <label style={filterLabelStyle}>
              <IconCalendar size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={filterInputStyle}
            />
          </div>
          
          <div style={filterGroupStyle}>
            <label style={filterLabelStyle}>
              <IconCalendar size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={filterInputStyle}
            />
          </div>
          
          <div style={filterGroupStyle}>
            <label style={filterLabelStyle}>
              <IconFilter size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'approved' | 'pending')}
              style={filterSelectStyle}
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <div style={filterGroupStyle}>
            <label style={filterLabelStyle}>Search</label>
            <input
              type="text"
              placeholder="Search member, session..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={filterInputStyle}
            />
          </div>
          
          <button
            type="button"
            onClick={loadData}
            style={refreshButtonStyle}
            disabled={isLoading}
          >
            <IconRefresh size={16} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && <div style={errorBannerStyle}>{error}</div>}

        <section style={gridStyle}>
          {reports.map((report) => (
            <ReportCard
              key={report.key}
              report={report}
              loading={isLoading}
              onDownloadCsv={handleDownloadCsv}
              onDownloadPdf={handleDownloadPdf}
              preparedBy={user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Church Administrator' : 'Church Administrator'}
              churchName={church?.name}
            />
          ))}
        </section>
      </div>
    </RequireRole>
  );
};

export default ReportsPage;
