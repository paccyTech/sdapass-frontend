'use client';

import { jsPDF } from 'jspdf';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

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

const gridStyle: CSSProperties = {
  display: 'grid',
  gap: '1.9rem',
};

const cardStyle: CSSProperties = {
  background: 'var(--surface-primary)',
  borderRadius: '28px',
  padding: '2.1rem',
  boxShadow: '0 20px 48px rgba(24, 76, 140, 0.08)',
  display: 'grid',
  gap: '1.35rem',
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
  fontFamily: 'var(--font-display)',
  fontSize: '1.45rem',
  color: 'var(--primary)',
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: 'var(--muted)',
  lineHeight: 1.6,
  fontSize: '0.98rem',
};

const previewShellStyle: CSSProperties = {
  borderRadius: '18px',
  border: '1px solid var(--surface-border)',
  overflow: 'hidden',
  background: 'var(--surface-secondary)',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.9rem',
  color: 'var(--shell-foreground)',
};

const tableHeaderCell: CSSProperties = {
  background: 'rgba(24,76,140,0.08)',
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontWeight: 600,
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
  border: 'none',
  borderRadius: '16px',
  padding: '0.65rem 1.2rem',
  background: 'linear-gradient(135deg, var(--primary), var(--accent))',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 18px 32px rgba(24, 76, 140, 0.18)',
  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: 'var(--surface-secondary)',
  color: 'var(--primary)',
  boxShadow: 'inset 0 0 0 1px rgba(24,76,140,0.2)',
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
  borderRadius: '18px',
  background: 'rgba(220, 38, 38, 0.12)',
  color: 'rgba(153, 27, 27, 0.92)',
  border: '1px solid rgba(220, 38, 38, 0.24)',
  fontSize: '0.95rem',
};

const emptyStateCardStyle: CSSProperties = {
  ...cardStyle,
  alignItems: 'center',
  textAlign: 'center',
  color: 'var(--muted)',
};

const statusBadgeBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.2rem 0.65rem',
  borderRadius: '999px',
  fontSize: '0.82rem',
  fontWeight: 600,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
};

const statusApprovedStyle: CSSProperties = {
  ...statusBadgeBase,
  background: 'var(--status-success-bg)',
  color: 'var(--status-success-foreground)',
  boxShadow: 'inset 0 0 0 1px var(--status-success-border)',
};

const statusPendingStyle: CSSProperties = {
  ...statusBadgeBase,
  background: 'var(--status-warning-bg)',
  color: 'var(--status-warning-foreground)',
  boxShadow: 'inset 0 0 0 1px var(--status-warning-border)',
};

const statusNeutralStyle: CSSProperties = {
  ...statusBadgeBase,
  background: 'rgba(71, 84, 103, 0.08)',
  color: 'rgba(71, 84, 103, 0.9)',
  boxShadow: 'inset 0 0 0 1px rgba(71, 84, 103, 0.12)',
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

const downloadPdf = (title: string, columns: ColumnDef[], rows: ReportRow[]) => {
  if (!rows.length) {
    return;
  }

  const orientation = columns.length > 4 ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation });
  const marginX = 16;
  const marginY = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const availableWidth = pageWidth - marginX * 2;
  const colWidth = availableWidth / columns.length;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, marginX, marginY);

  doc.setFontSize(10);
  doc.setDrawColor(210, 218, 232);
  let cursorY = marginY + 8;

  const ensureSpace = (heightNeeded: number) => {
    if (cursorY + heightNeeded > pageHeight - marginY) {
      doc.addPage();
      cursorY = marginY;
    }
  };

  const drawRow = (values: string[], bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const cellTop = cursorY;
    let rowHeight = 6;
    values.forEach((value, index) => {
      const x = marginX + index * colWidth;
      const lines = doc.splitTextToSize(value, colWidth - 4);
      rowHeight = Math.max(rowHeight, lines.length * 5 + 2);
      doc.text(lines, x + 2, cursorY + 4, { baseline: 'top' });
    });
    ensureSpace(rowHeight + 2);
    doc.line(marginX, cellTop, pageWidth - marginX, cellTop);
    cursorY += rowHeight;
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
  };

  drawRow(columns.map((col) => col.label), true);
  rows.forEach((row) => {
    const values = columns.map((col) => formatCell(row[col.key]));
    drawRow(values);
  });

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
  onDownloadPdf: (report: ReportDefinition) => void;
};

const ReportCard = ({ report, loading, onDownloadCsv, onDownloadPdf }: ReportCardProps) => {
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
          onClick={() => onDownloadPdf(report)}
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

  useEffect(() => {
    if (!token || !churchId) {
      return;
    }

    let cancelled = false;
    setStatus('loading');
    setError(null);

    Promise.allSettled([
      fetchChurchDetail(token, churchId),
      fetchAttendanceReport(token, { churchId }),
      fetchAttendance(token, { churchId }),
      fetchChurchMembers(token, { churchId }),
    ])
      .then((results) => {
        if (cancelled) {
          return;
        }

        const [churchResult, reportResult, attendanceResult, memberResult] = results;
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
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load reports.';
          setError(message);
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, churchId]);

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
    downloadPdf(report.title, report.columns, report.rows);
  }, []);

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
      <section style={gridStyle}>
        {error && <div style={errorBannerStyle}>{error}</div>}

        {reports.map((report) => (
          <ReportCard
            key={report.key}
            report={report}
            loading={isLoading}
            onDownloadCsv={handleDownloadCsv}
            onDownloadPdf={handleDownloadPdf}
          />
        ))}
      </section>
    </RequireRole>
  );
};

export default ReportsPage;
