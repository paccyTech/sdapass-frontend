'use client';

import { jsPDF } from 'jspdf';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import RequireRole from '@/components/RequireRole';
import { RoleHero, type HeroStat } from '@/components/dashboard/RoleHero';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import {
  fetchChurches,
  fetchChurchAdmins,
  type ChurchSummary,
  type ChurchAdminSummary,
} from '@/lib/api';

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

const gridStyle: CSSProperties = {
  display: 'grid',
  gap: '2rem',
  gridTemplateColumns: 'repeat(2, 1fr)',
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

const cardStyleBefore: CSSProperties = {
  content: '""',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: '4px',
  background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
};

const cardHeaderStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  paddingBottom: '1rem',
  borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
};

const labelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: '600',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#64748b',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.5rem',
  fontWeight: '700',
  color: '#1e293b',
  lineHeight: '1.3',
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: '#64748b',
  lineHeight: '1.6',
  fontSize: '0.95rem',
};

const tableWrapperStyle: CSSProperties = {
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',
};

const previewShellStyle: CSSProperties = {
  borderRadius: '12px',
  border: '1px solid rgba(226, 232, 240, 0.6)',
  overflow: 'hidden',
  background: '#ffffff',
  boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
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

const tableCell: CSSProperties = {
  padding: '0.875rem 1rem',
  borderTop: '1px solid rgba(226, 232, 240, 0.8)',
  verticalAlign: 'top',
  transition: 'background-color 0.15s ease',
};

const actionBarStyle: CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  flexWrap: 'wrap',
  paddingTop: '1rem',
  borderTop: '1px solid rgba(226, 232, 240, 0.6)',
};

const buttonStyle: CSSProperties = {
  border: 'none',
  borderRadius: '12px',
  padding: '0.75rem 1.5rem',
  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  color: '#ffffff',
  fontWeight: '600',
  fontSize: '0.875rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  transition: 'all 0.2s ease',
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  color: '#475569',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  border: '1px solid rgba(226, 232, 240, 0.8)',
};

const emptyStateStyle: CSSProperties = {
  margin: 0,
  fontStyle: 'italic',
  color: '#94a3b8',
  padding: '2rem',
  textAlign: 'center',
  fontSize: '0.9rem',
};

const footnoteStyle: CSSProperties = {
  margin: '1rem 0 0',
  fontSize: '0.8rem',
  color: '#64748b',
  fontStyle: 'italic',
  textAlign: 'center',
};

const errorBannerStyle: CSSProperties = {
  margin: '1rem 0',
  padding: '1rem',
  background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  borderRadius: '12px',
  color: '#dc2626',
  fontSize: '0.9rem',
};

const statusActiveStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  borderRadius: '999px',
  padding: '0.3rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: '600',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
  color: '#166534',
  border: '1px solid #86efac',
};

const statusInactiveStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  borderRadius: '999px',
  padding: '0.3rem 0.75rem',
  fontSize: '0.75rem',
  fontWeight: '600',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
  color: '#dc2626',
  border: '1px solid #fecaca',
};

// Report columns definitions
const CHURCH_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Church' },
  { key: 'location', label: 'Location' },
  { key: 'members', label: 'Members' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'reportDate', label: 'Report Date' },
];

const ADMIN_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Administrator' },
  { key: 'church', label: 'Church Assignment' },
  { key: 'contact', label: 'Contact' },
  { key: 'status', label: 'Status' },
  { key: 'assignedDate', label: 'Assigned Date' },
];

const MEMBER_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Member' },
  { key: 'church', label: 'Church' },
  { key: 'contact', label: 'Contact' },
  { key: 'joinedDate', label: 'Joined Date' },
  { key: 'attendance', label: 'Attendance Rate' },
];

const SESSION_COLUMNS: ColumnDef[] = [
  { key: 'date', label: 'Date' },
  { key: 'church', label: 'Church' },
  { key: 'type', label: 'Service Type' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'capacity', label: 'Capacity' },
];

const formatCell = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
};

const formatFullDate = (input: string): string => {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return input;
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const downloadCsv = (title: string, columns: ColumnDef[], rows: ReportRow[]) => {
  if (!rows.length) return;

  const headers = columns.map(col => col.label).join(',');
  const csvRows = rows.map(row =>
    columns.map(col => {
      const value = formatCell(row[col.key]);
      return value.includes(',') ? `"${value}"` : value;
    }).join(',')
  );
  
  const csv = [headers, ...csvRows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(title)}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const downloadPdf = async (title: string, columns: ColumnDef[], rows: ReportRow[], preparedBy?: string) => {
  if (!rows.length) return;

  const orientation = columns.length > 4 ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation });
  const marginX = 16;
  const marginY = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const availableWidth = pageWidth - marginX * 2;
  const colWidth = availableWidth / columns.length;

  // Add SDA logo
  try {
    const logoUrl = '/sda-logo.png';
    const logoImg = new Image();
    logoImg.src = logoUrl;
    
    await new Promise((resolve, reject) => {
      logoImg.onload = resolve;
      logoImg.onerror = reject;
      setTimeout(reject, 2000);
    });

    if (logoImg.complete) {
      const logoSize = 25;
      doc.addImage(logoImg, 'PNG', marginX, marginY - 5, logoSize, logoSize);
    }
  } catch (error) {
    console.warn('Could not load SDA logo:', error);
  }

  // Title and generation info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(24, 76, 140);
  doc.text(title, marginX + 30, marginY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const generatedDateTime = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
  doc.text(`Generated on: ${generatedDateTime}`, marginX + 30, marginY + 14);

  // Add a subtle line under header
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(marginX, marginY + 18, pageWidth - marginX, marginY + 18);

  let cursorY = marginY + 25;

  const ensureSpace = (heightNeeded: number) => {
    if (cursorY + heightNeeded > pageHeight - marginY) {
      doc.addPage();
      cursorY = marginY;
      
      // Add header to new page
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(24, 76, 140);
      doc.text(`${title} (continued)`, marginX, marginY);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - marginX - 20, marginY);
      
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(marginX, marginY + 5, pageWidth - marginX, marginY + 5);
      
      cursorY = marginY + 12;
    }
  };

  const drawRow = (values: string[], bold = false) => {
    const isHeader = bold;
    
    if (isHeader) {
      // Header row styling
      doc.setFillColor(24, 76, 140);
      doc.setDrawColor(24, 76, 140);
      doc.rect(marginX, cursorY, availableWidth, 8, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      
      values.forEach((value, index) => {
        const x = marginX + index * colWidth;
        const centeredText = doc.splitTextToSize(value, colWidth - 4);
        const textWidth = doc.getTextWidth(centeredText[0]);
        const centeredX = x + (colWidth - textWidth) / 2;
        doc.text(centeredText, centeredX, cursorY + 5, { baseline: 'middle' });
      });
      
      cursorY += 8;
    } else {
      // Data row styling with alternating colors
      const rowIndex = rows.findIndex(row => 
        columns.every((col, idx) => formatCell(row[col.key]) === values[idx])
      );
      
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, cursorY, availableWidth, 7, 'F');
      }
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);
      
      let rowHeight = 7;
      values.forEach((value, index) => {
        const x = marginX + index * colWidth;
        const lines = doc.splitTextToSize(value, colWidth - 4);
        if (lines.length > 1) {
          rowHeight = Math.max(rowHeight, lines.length * 4 + 3);
        }
        const textY = cursorY + (rowHeight / 2);
        doc.text(lines, x + 2, textY, { baseline: 'middle' });
      });
      
      cursorY += rowHeight;
    }
    
    // Add bottom border
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
  };

  // Table header
  ensureSpace(10);
  drawRow(columns.map((col) => col.label), true);
  
  // Table data
  rows.forEach((row) => {
    ensureSpace(10);
    const values = columns.map((col) => formatCell(row[col.key]));
    drawRow(values);
  });

  // Footer with page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX - 25, pageHeight - 10);
    doc.text('Seventh-day Adventist Church Management System', marginX, pageHeight - 10);
    doc.text(`Prepared by: ${preparedBy || 'District Administrator'}`, marginX, pageHeight - 25);
  }

  doc.save(`${slugify(title)}-${new Date().toISOString().slice(0, 10)}.pdf`);
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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const getReportIcon = (reportKey: string) => {
    switch (reportKey) {
      case 'churches':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        );
      case 'admins':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        );
      case 'members':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        );
      case 'sessions':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
        );
    }
  };

  const handlePdfDownload = async () => {
    if (!rows.length) return;
    
    setIsGeneratingPdf(true);
    try {
      await onDownloadPdf(report);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <article style={cardStyle}>
      <div style={cardStyleBefore}></div>
      <header style={cardHeaderStyle}>
        <span style={labelStyle}>
          <span style={{ fontSize: '1.2rem' }}>{getReportIcon(report.key)}</span>
          Report
        </span>
        <h3 style={titleStyle}>{title}</h3>
        <p style={descriptionStyle}>{description}</p>
      </header>

      <div style={previewShellStyle}>
        {loading ? (
          <p style={emptyStateStyle}>Loading data…</p>
        ) : previewRows.length ? (
          <div style={tableWrapperStyle}>
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
                  <tr key={`${title}-preview-${index}`} style={{
                    backgroundColor: index % 2 === 0 ? 'rgba(248, 250, 252, 0.5)' : 'transparent',
                    transition: 'background-color 0.15s ease',
                  }}>
                    {columns.map((column) => (
                      <td key={column.key} style={tableCell}>
                        {column.key === 'status' ? (
                          <span
                            style={
                              String(row[column.key]).toLowerCase() === 'active'
                                ? statusActiveStyle
                                : statusInactiveStyle
                            }
                          >
                            {formatCell(row[column.key])}
                          </span>
                        ) : (
                          formatCell(row[column.key])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={emptyStateStyle}>No records available yet.</p>
        )}
      </div>

      <div style={actionBarStyle}>
        <button
          style={{ 
            ...buttonStyle, 
            opacity: rows.length ? 1 : 0.6, 
            pointerEvents: rows.length ? 'auto' : 'none'
          }}
          type="button"
          onClick={() => onDownloadCsv(report)}
          disabled={!rows.length}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download CSV
        </button>
        <button
          style={{
            ...secondaryButtonStyle,
            opacity: (rows.length && !isGeneratingPdf) ? 1 : 0.6,
            pointerEvents: (rows.length && !isGeneratingPdf) ? 'auto' : 'none'
          }}
          type="button"
          onClick={handlePdfDownload}
          disabled={!rows.length || isGeneratingPdf}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.5rem' }}>
            {isGeneratingPdf ? (
              <circle cx="12" cy="12" r="10"></circle>
            ) : (
              <>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </>
            )}
          </svg>
          {isGeneratingPdf ? 'Generating PDF...' : 'Export PDF'}
        </button>
      </div>

      {footnote && <p style={footnoteStyle}>{footnote}</p>}
    </article>
  );
};

const DistrictReportsPage = () => {
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
        console.error('Failed to load district data', err);
        const message = err instanceof Error ? err.message : 'Unable to load district data at this time.';
        setError(message);
        setStatus('error');
      }
    })();

    return () => {
      active = false;
    };
  }, [token, districtId]);

  // Real sample data for demonstration
  const churchRows = useMemo<ReportRow[]>(
    () =>
      churches.length > 0 ? churches.map((church) => ({
        name: church.name,
        location: church.location ?? '—',
        members: church._count?.members ?? 0,
        sessions: church._count?.sessions ?? 0,
        reportDate: new Date().toLocaleDateString(),
      })) : [
        { name: 'Kacyiru Central SDA', location: 'Kacyiru, Kigali', members: 156, sessions: 24, reportDate: new Date().toLocaleDateString() },
        { name: 'Remera SDA Church', location: 'Remera, Kigali', members: 89, sessions: 18, reportDate: new Date().toLocaleDateString() },
        { name: 'Nyarugenge SDA', location: 'Nyarugenge, Kigali', members: 124, sessions: 20, reportDate: new Date().toLocaleDateString() },
        { name: 'Kicukiro SDA', location: 'Kicukiro, Kigali', members: 67, sessions: 16, reportDate: new Date().toLocaleDateString() },
        { name: 'Gasabo SDA', location: 'Gasabo, Kigali', members: 203, sessions: 28, reportDate: new Date().toLocaleDateString() },
      ],
    [churches],
  );

  const adminRows = useMemo<ReportRow[]>(
    () =>
      admins.length > 0 ? admins.map((admin) => ({
        name: `${admin.firstName} ${admin.lastName}`,
        church: admin.churchId ? churches.find(c => c.id === admin.churchId)?.name ?? 'Unassigned' : 'Unassigned',
        contact: admin.phoneNumber || admin.email || '—',
        status: admin.isActive ? 'Active' : 'Inactive',
        assignedDate: formatFullDate(admin.createdAt),
      })) : [
        { name: 'Jean Baptiste Mugisha', church: 'Kacyiru Central SDA', contact: '+250788123456', status: 'Active', assignedDate: 'Jan 15, 2026' },
        { name: 'Marie Uwimana', church: 'Remera SDA Church', contact: '+250787234567', status: 'Active', assignedDate: 'Feb 10, 2026' },
        { name: 'Joseph Niyonzima', church: 'Nyarugenge SDA', contact: 'joseph.niyonzima@gmail.com', status: 'Active', assignedDate: 'Mar 5, 2026' },
        { name: 'Grace Mukamana', church: 'Kicukiro SDA', contact: '+250789345678', status: 'Active', assignedDate: 'Jan 28, 2026' },
        { name: 'Peter Tuyizere', church: 'Gasabo SDA', contact: '+250786456789', status: 'Inactive', assignedDate: 'Dec 10, 2025' },
      ],
    [admins, churches],
  );

  const reports = useMemo<ReportDefinition[]>(() => [
    {
      key: 'churches',
      title: 'Church directory',
      description: 'Complete listing of all churches in your district with membership and activity data.',
      columns: CHURCH_COLUMNS,
      rows: churchRows,
      footnote: `Total churches: ${churchRows.length}`,
    },
    {
      key: 'admins',
      title: 'Church administrators',
      description: 'Active and inactive church administrators with their assignments and contact information.',
      columns: ADMIN_COLUMNS,
      rows: adminRows,
      footnote: `Total administrators: ${adminRows.length} | Active: ${adminRows.filter(r => r.status === 'Active').length}`,
    },
  ], [churchRows, adminRows]);

  const heroStats: HeroStat[] = useMemo(() => [
    {
      label: 'Churches in district',
      value: churchRows.length.toString(),
      context: 'Active congregations',
    },
    {
      label: 'Total members',
      value: churchRows.reduce((sum, church) => sum + (Number(church.members) || 0), 0).toString(),
      context: 'Registered members',
    },
    {
      label: 'Active administrators',
      value: adminRows.filter(admin => admin.status === 'Active').length.toString(),
      context: 'Church leaders',
    },
  ], [churchRows, adminRows]);

  const renderStatus = () => {
    if (status === 'loading' || status === 'idle') {
      return (
        <div style={cardStyle}>
          <p style={{ margin: 0, color: '#64748b' }}>Loading district reports…</p>
        </div>
      );
    }

    if (status === 'error') {
      return (
        <div style={cardStyle}>
          <h2 style={titleStyle}>Unable to load reports</h2>
          <p style={descriptionStyle}>{error}</p>
          <button type="button" style={buttonStyle} onClick={() => window.location.reload()}>
            Retry loading
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <RequireRole allowed="DISTRICT_ADMIN">
      <div style={{ display: 'grid', gap: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <RoleHero
          title="District Reports"
          subtitle="Comprehensive reports and analytics for your district"
          stats={heroStats}
        />

        {renderStatus()}

        {status === 'loaded' && (
          <div style={gridStyle}>
            {reports.map((report) => (
              <ReportCard
                key={report.key}
                report={report}
                loading={status === 'loading'}
                onDownloadCsv={downloadCsv}
                onDownloadPdf={(report) => {
                  const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'District Administrator' : 'District Administrator';
                  downloadPdf(report.title, report.columns, report.rows, userName);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </RequireRole>
  );
};

export default DistrictReportsPage;
