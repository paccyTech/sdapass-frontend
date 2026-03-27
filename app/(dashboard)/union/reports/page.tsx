'use client';

import { jsPDF } from 'jspdf';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import RequireRole from '@/components/RequireRole';
import { RoleHero } from '@/components/dashboard/RoleHero';
import type { HeroStat } from '@/components/dashboard/RoleHero';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import {
  fetchChurches,
  fetchChurchMembers,
  fetchDistrictPastors,
  fetchDistricts,
  fetchUnionStats,
  type ChurchSummary,
  type DistrictPastorSummary,
  type DistrictSummary,
  type MemberSummary,
  type UnionStats,
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

const tabsContainerStyle: CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '1rem',
  borderBottom: '2px solid #e2e8f0',
  paddingBottom: '0.5rem',
  flexWrap: 'wrap',
};

const filtersContainerStyle: CSSProperties = {
  display: 'flex',
  gap: '1rem',
  marginBottom: '1.5rem',
  flexWrap: 'wrap',
  padding: '1rem',
  background: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
};

const filterGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  minWidth: '180px',
  flex: 1,
};

const filterLabelStyle: CSSProperties = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const filterInputStyle: CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '0.9rem',
  background: 'white',
  color: '#1e293b',
  outline: 'none',
  transition: 'border-color 0.2s ease',
};

const filterSelectStyle: CSSProperties = {
  padding: '0.5rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid #cbd5e1',
  fontSize: '0.9rem',
  background: 'white',
  color: '#1e293b',
  outline: 'none',
  cursor: 'pointer',
  minWidth: '150px',
};

const filterButtonStyle: CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  background: 'white',
  color: '#475569',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  transition: 'all 0.2s ease',
  alignSelf: 'flex-end',
};

const tabStyle: CSSProperties = {
  padding: '0.75rem 1.5rem',
  borderRadius: '8px 8px 0 0',
  border: 'none',
  background: 'transparent',
  color: '#64748b',
  fontSize: '0.9rem',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  borderBottom: '3px solid transparent',
  marginBottom: '-0.5rem',
};

const activeTabStyle: CSSProperties = {
  ...tabStyle,
  color: '#3b82f6',
  background: '#f8fafc',
  borderBottom: '3px solid #3b82f6',
};

const activeReportContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
};

const activeReportHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem',
  flexWrap: 'wrap',
  paddingBottom: '1rem',
  borderBottom: '1px solid #e2e8f0',
};

const activeReportTitleGroupStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  flex: 1,
  minWidth: '250px',
};

const contentContainerStyle: CSSProperties = {
  background: 'white',
  borderRadius: '12px',
  padding: '2rem',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
};

const labelStyle: CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: '600',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#64748b',
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '1.25rem',
  fontWeight: '700',
  color: '#1e293b',
  lineHeight: '1.3',
};

const descriptionStyle: CSSProperties = {
  margin: 0,
  color: '#64748b',
  lineHeight: '1.5',
  fontSize: '0.9rem',
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
  borderCollapse: 'collapse',
  fontSize: '0.875rem',
  color: '#374151',
};

const tableHeaderCell: CSSProperties = {
  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
  padding: '0.875rem 1rem',
  textAlign: 'left',
  fontWeight: '600',
  color: '#475569',
  fontSize: '0.8rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '2px solid #cbd5e1',
};

const tableCell: CSSProperties = {
  padding: '0.75rem 1rem',
  borderTop: '1px solid rgba(226, 232, 240, 0.8)',
  transition: 'background-color 0.15s ease',
};

const actionBarStyle: CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
};

const buttonStyle: CSSProperties = {
  border: 'none',
  borderRadius: '8px',
  padding: '0.6rem 1.25rem',
  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  color: '#ffffff',
  fontWeight: '600',
  fontSize: '0.8rem',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const secondaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: 'white',
  color: '#475569',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  border: '1px solid #e2e8f0',
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
  margin: 0,
  fontSize: '0.8rem',
  color: '#64748b',
  fontStyle: 'italic',
  padding: '0.75rem',
  background: 'rgba(241, 245, 249, 0.5)',
  borderRadius: '8px',
  borderLeft: '3px solid #3b82f6',
};

const errorBannerStyle: CSSProperties = {
  padding: '1rem 1.5rem',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
  color: '#dc2626',
  border: '1px solid #fecaca',
  fontSize: '0.95rem',
  fontWeight: '500',
  marginBottom: '2rem',
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

const statusActiveStyle: CSSProperties = {
  ...statusBadgeBase,
  background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
  color: '#166534',
  boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)',
  border: '1px solid #86efac',
};

const statusInactiveStyle: CSSProperties = {
  ...statusBadgeBase,
  background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
  color: '#64748b',
  boxShadow: '0 2px 4px rgba(100, 116, 139, 0.2)',
  border: '1px solid #cbd5e1',
};

const DISTRICT_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'District' },
  { key: 'location', label: 'Location' },
  { key: 'churchCount', label: 'Churches' },
  { key: 'reportDate', label: 'Report Date' },
];

const CHURCH_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Church' },
  { key: 'district', label: 'District' },
  { key: 'location', label: 'Location' },
  { key: 'members', label: 'Registered members' },
  { key: 'reportDate', label: 'Report Date' },
];

const PASTOR_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Pastor' },
  { key: 'district', label: 'District assignment' },
  { key: 'contact', label: 'Contact' },
  { key: 'status', label: 'Status' },
  { key: 'assignedDate', label: 'Assigned Date' },
];

const MEMBER_GROWTH_COLUMNS: ColumnDef[] = [
  { key: 'month', label: 'Month' },
  { key: 'members', label: 'Active members' },
  { key: 'delta', label: 'Change vs prev.' },
];

const MEMBER_COLUMNS: ColumnDef[] = [
  { key: 'name', label: 'Name' },
  { key: 'nationalId', label: 'National ID' },
  { key: 'phoneNumber', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'church', label: 'Church' },
  { key: 'passStatus', label: 'Pass Status' },
  { key: 'createdAt', label: 'Registered' },
];

const ATTENDANCE_COLUMNS: ColumnDef[] = [
  { key: 'session', label: 'Session' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'percent', label: 'Percentage' },
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

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 120) || 'export';

const formatMonthLabel = (input: string): string => {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) {
    return input;
  }
  return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
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

const downloadPdf = async (title: string, columns: ColumnDef[], rows: ReportRow[], preparedBy?: string) => {
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
  // Row number column is fixed narrow width, rest distributed among data columns
  const rowNumColWidth = 8;
  const dataColWidth = (availableWidth - rowNumColWidth) / columns.length;

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

  const drawRow = (values: string[], bold = false, rowIndex = -1) => {
    const isHeader = bold;
    const cellPadding = 2; // Reduced padding for more content space

    if (isHeader) {
      // Header row styling
      doc.setFillColor(24, 76, 140);
      doc.setDrawColor(24, 76, 140);
      doc.rect(marginX, cursorY, availableWidth, 8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);

      values.forEach((value, index) => {
        const colW = index === 0 ? rowNumColWidth : dataColWidth;
        const x = marginX + (index === 0 ? 0 : rowNumColWidth + (index - 1) * dataColWidth);
        const centeredText = doc.splitTextToSize(value, colW - cellPadding * 2);
        const textWidth = doc.getTextWidth(centeredText[0]);
        const centeredX = x + (colW - textWidth) / 2;
        doc.text(centeredText, centeredX, cursorY + 4, { baseline: 'middle' });
      });

      cursorY += 8;
    } else {
      // Data row styling with alternating colors
      // First pass: calculate required row height
      let rowHeight = 7;
      values.forEach((value, index) => {
        const colW = index === 0 ? rowNumColWidth : dataColWidth;
        const lines = doc.splitTextToSize(value, colW - cellPadding * 2);
        if (lines.length > 1) {
          rowHeight = Math.max(rowHeight, lines.length * 4 + 3);
        }
      });

      // Draw alternating background with calculated height
      if (rowIndex >= 0 && rowIndex % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(marginX, cursorY, availableWidth, rowHeight, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(50, 50, 50);

      // Second pass: draw text vertically centered
      const textY = cursorY + rowHeight / 2;
      values.forEach((value, index) => {
        const colW = index === 0 ? rowNumColWidth : dataColWidth;
        const x = marginX + (index === 0 ? 0 : rowNumColWidth + (index - 1) * dataColWidth);
        const lines = doc.splitTextToSize(value, colW - cellPadding * 2);
        doc.text(lines, x + cellPadding, textY, { baseline: 'middle' });
      });

      cursorY += rowHeight;
    }

    // Add bottom border
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(marginX, cursorY, pageWidth - marginX, cursorY);
  };

  // Table header with row number column
  ensureSpace(10);
  drawRow(['#', ...columns.map((col) => col.label)], true);

  // Table data with row numbers
  rows.forEach((row, index) => {
    ensureSpace(10);
    const values = [String(index + 1), ...columns.map((col) => formatCell(row[col.key]))];
    drawRow(values, false, index);
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
    doc.text(`Prepared by: ${preparedBy || 'Union Administrator'}`, marginX, pageHeight - 25);
  }

  doc.save(`${slugify(title)}-${new Date().toISOString().slice(0, 10)}.pdf`);
};

type ReportCardProps = {
  report: ReportDefinition;
  loading: boolean;
  onDownloadCsv: (report: ReportDefinition) => void;
  onDownloadPdf: (report: ReportDefinition) => Promise<void>;
  // Members drill-down props
  districts?: DistrictSummary[];
  churches?: ChurchSummary[];
  selectedDistrict?: string;
  selectedChurch?: string;
  onDistrictChange?: (districtId: string) => void;
  onChurchChange?: (churchId: string) => void;
  membersLoading?: boolean;
};

const ReportCard = ({ 
  report, 
  loading, 
  onDownloadCsv, 
  onDownloadPdf,
  districts = [],
  churches = [],
  selectedDistrict = '',
  selectedChurch = '',
  onDistrictChange,
  onChurchChange,
  membersLoading = false,
}: ReportCardProps) => {
  const { title, description, columns, rows, footnote, key } = report;
  const previewRows = rows.slice(0, 6);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const isMembersReport = key === 'members';

  const getReportIcon = (reportKey: string) => {
    switch (reportKey) {
      case 'districts':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        );
      case 'churches':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 10l-6 6-6-6"></path>
            <path d="M12 4v12"></path>
            <path d="M5 10h14"></path>
            <rect x="3" y="14" width="18" height="7" rx="1"></rect>
          </svg>
        );
      case 'pastors':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        );
      case 'memberGrowth':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="20" x2="12" y2="10"></line>
            <line x1="18" y1="20" x2="18" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="16"></line>
          </svg>
        );
      case 'attendance':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
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
    <article style={activeReportContainerStyle}>
      <header style={activeReportHeaderStyle}>
        <div style={activeReportTitleGroupStyle}>
          <span style={labelStyle}>Report</span>
          <h3 style={titleStyle}>{title}</h3>
          <p style={descriptionStyle}>{description}</p>
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
            {isGeneratingPdf ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </header>

      {/* Members Drill-down Selectors */}
      {isMembersReport && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={filterGroupStyle}>
            <label style={filterLabelStyle}>Select District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => onDistrictChange?.(e.target.value)}
              style={filterSelectStyle}
            >
              <option value="">Choose a district...</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>{district.name}</option>
              ))}
            </select>
          </div>

          <div style={filterGroupStyle}>
            <label style={filterLabelStyle}>Select Church</label>
            <select
              value={selectedChurch}
              onChange={(e) => onChurchChange?.(e.target.value)}
              style={filterSelectStyle}
              disabled={!selectedDistrict}
            >
              <option value="">{selectedDistrict ? 'Choose a church...' : 'Select district first'}</option>
              {churches
                .filter((church) => church.districtId === selectedDistrict)
                .map((church) => (
                  <option key={church.id} value={church.id}>{church.name}</option>
                ))}
            </select>
          </div>
        </div>
      )}

      <div style={previewShellStyle}>
        {loading || membersLoading ? (
          <p style={emptyStateStyle}>Loading data...</p>
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

      {footnote && <p style={footnoteStyle}>{footnote}</p>}
    </article>
  );
};

const ReportsPage = () => {
  const { token, user } = useAuthSession();

  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [churches, setChurches] = useState<ChurchSummary[]>([]);
  const [pastors, setPastors] = useState<DistrictPastorSummary[]>([]);
  const [unionStats, setUnionStats] = useState<UnionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<string>('districts');
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedDistrictForMembers, setSelectedDistrictForMembers] = useState<string>('');
  const [selectedChurchForMembers, setSelectedChurchForMembers] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch members when district and church are selected for members report
  useEffect(() => {
    if (!token || activeReport !== 'members' || !selectedChurchForMembers) {
      return;
    }

    let cancelled = false;
    setMembersLoading(true);

    fetchChurchMembers(token, { churchId: selectedChurchForMembers })
      .then((data) => {
        if (!cancelled) {
          setMembers(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMembers([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setMembersLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, activeReport, selectedChurchForMembers]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.allSettled([
      fetchDistricts(token, user?.unionId ? { unionId: user.unionId } : undefined),
      fetchChurches(token),
      fetchDistrictPastors(token),
      fetchUnionStats(token),
    ])
      .then((results) => {
        if (cancelled) {
          return;
        }

        const [districtResult, churchResult, pastorResult, statsResult] = results;

        if (districtResult.status === 'fulfilled') {
          setDistricts(districtResult.value);
        }
        if (churchResult.status === 'fulfilled') {
          setChurches(churchResult.value);
        }
        if (pastorResult.status === 'fulfilled') {
          setPastors(pastorResult.value);
        }
        if (statsResult.status === 'fulfilled') {
          setUnionStats(statsResult.value);
        }

        const failures = results
          .map((result, index) => {
            if (result.status === 'fulfilled') {
              return null;
            }
            switch (index) {
              case 0:
                return 'district directory';
              case 1:
                return 'church roster';
              case 2:
                return 'pastor assignments';
              case 3:
                return 'union statistics';
              default:
                return 'report';
            }
          })
          .filter(Boolean);

        setError(failures.length ? `Some reports could not be loaded: ${failures.join(', ')}.` : null);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load reports.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, user?.unionId]);

  const districtMap = useMemo(() => {
    const next: Record<string, string> = {};
    districts.forEach((district) => {
      next[district.id] = district.name;
    });
    return next;
  }, [districts]);

  const churchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    churches.forEach((church) => {
      const key = church.districtId ?? 'unassigned';
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return counts;
  }, [churches]);

  const districtRows = useMemo<ReportRow[]>(
    () =>
      districts
        .filter((district) => {
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
              district.name.toLowerCase().includes(query) ||
              (district.location && district.location.toLowerCase().includes(query))
            );
          }
          return true;
        })
        .map((district) => ({
          name: district.name,
          location: district.location ?? '—',
          churchCount: churchCounts[district.id] ?? 0,
          reportDate: new Date().toLocaleDateString(),
        })),
    [districts, churchCounts, searchQuery],
  );

  const churchRows = useMemo<ReportRow[]>(
    () =>
      churches
        .filter((church) => {
          if (districtFilter !== 'all' && church.districtId !== districtFilter) return false;
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
              church.name.toLowerCase().includes(query) ||
              (church.location && church.location.toLowerCase().includes(query)) ||
              (church.districtId && districtMap[church.districtId]?.toLowerCase().includes(query))
            );
          }
          return true;
        })
        .map((church) => ({
          name: church.name,
          district: church.districtId ? districtMap[church.districtId] ?? '—' : 'Unassigned',
          location: church.location ?? '—',
          members: church._count?.members ?? 0,
          reportDate: new Date().toLocaleDateString(),
        })),
    [churches, districtMap, districtFilter, searchQuery],
  );

  const pastorRows = useMemo<ReportRow[]>(
    () =>
      pastors
        .filter((pastor) => {
          if (statusFilter !== 'all' && pastor.isActive !== (statusFilter === 'active')) return false;
          if (districtFilter !== 'all' && pastor.districtId !== districtFilter) return false;
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const fullName = `${pastor.firstName} ${pastor.lastName}`.toLowerCase();
            return (
              fullName.includes(query) ||
              (pastor.email && pastor.email.toLowerCase().includes(query)) ||
              (pastor.phoneNumber && pastor.phoneNumber.includes(query))
            );
          }
          return true;
        })
        .map((pastor) => ({
          name: `${pastor.firstName} ${pastor.lastName}`.trim(),
          district: pastor.district?.name ?? 'Unassigned',
          contact: pastor.phoneNumber || pastor.email || '—',
          status: pastor.isActive ? 'Active' : 'Inactive',
          assignedDate: formatFullDate(pastor.createdAt),
        })),
    [pastors, statusFilter, districtFilter, searchQuery],
  );

  const memberGrowthRows = useMemo<ReportRow[]>(() => {
    if (!unionStats?.memberGrowth?.length) {
      return [];
    }
    return unionStats.memberGrowth.map((point, index, array) => {
      const previous = index > 0 ? array[index - 1].count : null;
      const delta = previous !== null ? point.count - previous : null;
      return {
        month: formatMonthLabel(point.date),
        members: point.count,
        delta: delta === null ? '—' : `${delta > 0 ? '+' : ''}${delta.toLocaleString()}`,
      };
    });
  }, [unionStats]);

  const memberRows = useMemo<ReportRow[]>(() => {
    if (!members.length) return [];
    return members.map((member) => ({
      name: `${member.firstName} ${member.lastName}`.trim(),
      nationalId: member.nationalId,
      phoneNumber: member.phoneNumber,
      email: member.email ?? '—',
      church: member.church?.name ?? '—',
      passStatus: member.memberPass ? 'Active' : 'Not Issued',
      createdAt: formatFullDate(member.createdAt),
    }));
  }, [members]);

  const attendanceRows = useMemo<ReportRow[]>(() => {
    if (!unionStats?.attendanceTrends?.length) {
      return [];
    }
    return unionStats.attendanceTrends.map((trend) => ({
      month: formatMonthLabel(trend.month),
      attendance: trend.attendance,
      percent: unionStats.totalMembers
        ? `${Math.round((trend.attendance / unionStats.totalMembers) * 100)}%`
        : '—',
    }));
  }, [unionStats]);

  const heroStats: HeroStat[] = useMemo(() => {
    const totalMembers = unionStats?.totalMembers ?? null;
    const lastGrowthPoint = unionStats?.memberGrowth?.at(-1)?.count ?? null;
    const previousGrowthPoint = unionStats?.memberGrowth?.at(-2)?.count ?? null;
    const memberTrend =
      lastGrowthPoint !== null && previousGrowthPoint !== null
        ? `${lastGrowthPoint - previousGrowthPoint >= 0 ? '+' : ''}${(lastGrowthPoint - previousGrowthPoint).toLocaleString()} vs last month`
        : '—';

    return [
      {
        label: 'Districts tracked',
        value: loading ? '—' : districts.length.toLocaleString(),
        trend: churchRows.length ? `${churchRows.length.toLocaleString()} churches covered` : undefined,
      },
      {
        label: 'Pastors assigned',
        value: loading ? '—' : pastors.length.toLocaleString(),
        trend: pastors.length ? `${pastorRows.filter((row) => row.status === 'Active').length.toLocaleString()} active` : undefined,
      },
      {
        label: 'Membership footprint',
        value: totalMembers !== null ? totalMembers.toLocaleString() : '—',
        trend: memberTrend,
      },
    ];
  }, [loading, districts.length, churchRows.length, pastors.length, pastorRows, unionStats]);

  const shellConfig = useMemo(
    () => ({
      hero: (
        <RoleHero
          role="UNION_ADMIN"
          headline="Union-wide reports & analytics"
          subheadline="Download operational intelligence across districts, churches, and attendance in CSV or PDF formats."
          stats={heroStats}
        />
      ),
    }),
    [heroStats],
  );

  useDashboardShellConfig(shellConfig);

  const reports = useMemo<ReportDefinition[]>(
    () => [
      {
        key: 'districts',
        title: 'District directory',
        description: 'Union-wide index of districts, their locations, and covered churches.',
        columns: DISTRICT_COLUMNS,
        rows: districtRows,
        footnote: districtRows.length ? `Total districts: ${districtRows.length.toLocaleString()}` : undefined,
      },
      {
        key: 'churches',
        title: 'Church roster',
        description: 'Church-level roster with geographic placement and membership counts.',
        columns: CHURCH_COLUMNS,
        rows: churchRows,
        footnote: churchRows.length ? `Total churches: ${churchRows.length.toLocaleString()}` : undefined,
      },
      {
        key: 'pastors',
        title: 'District pastor assignments',
        description: 'Active and historical district pastor appointments with contact channels.',
        columns: PASTOR_COLUMNS,
        rows: pastorRows,
        footnote: pastorRows.length ? `Total pastors: ${pastorRows.length.toLocaleString()}` : undefined,
      },
      {
        key: 'memberGrowth',
        title: 'Membership growth',
        description: 'Month-over-month membership growth across the Union.',
        columns: MEMBER_GROWTH_COLUMNS,
        rows: memberGrowthRows,
        footnote: memberGrowthRows.length
          ? `Latest period: ${memberGrowthRows.at(-1)?.month ?? '—'} (${memberGrowthRows.at(-1)?.members ?? '—'} members)`
          : undefined,
      },
      {
        key: 'attendance',
        title: 'Union attendance',
        description: 'Attendance performance for the most recent six sessions reported.',
        columns: ATTENDANCE_COLUMNS,
        rows: attendanceRows,
        footnote: attendanceRows.length
          ? `Latest attendance: ${attendanceRows.at(-1)?.attendance ?? '—'} (${attendanceRows.at(-1)?.percent ?? '—'})`
          : undefined,
      },
      {
        key: 'members',
        title: 'Members',
        description: 'View members by selecting a district and church.',
        columns: MEMBER_COLUMNS,
        rows: memberRows,
        footnote: memberRows.length ? `Total members: ${memberRows.length.toLocaleString()}` : 'Select a district and church to view members',
      },
    ],
    [districtRows, churchRows, pastorRows, memberGrowthRows, attendanceRows, memberRows],
  );

  const activeReportData = useMemo(() => 
    reports.find(r => r.key === activeReport) || reports[0],
    [reports, activeReport]
  );

  const filteredDistricts = useMemo(() => 
    districts.filter((d) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return d.name.toLowerCase().includes(query) || (d.location && d.location.toLowerCase().includes(query));
      }
      return true;
    }),
    [districts, searchQuery]
  );

  const clearFilters = useCallback(() => {
    setDateFrom('');
    setDateTo('');
    setStatusFilter('all');
    setDistrictFilter('all');
    setSearchQuery('');
  }, []);

  const hasActiveFilters = dateFrom || dateTo || statusFilter !== 'all' || districtFilter !== 'all' || searchQuery;

  const handleDownloadCsv = useCallback((report: ReportDefinition) => {
    downloadCsv(report.title, report.columns, report.rows);
  }, []);

  const handleDownloadPdf = useCallback(async (report: ReportDefinition) => {
    const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Union Administrator' : 'Union Administrator';
    await downloadPdf(report.title, report.columns, report.rows, userName);
  }, [user]);

  return (
    <RequireRole allowed="UNION_ADMIN">
      <section style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1rem' }}>
        {error && <div style={errorBannerStyle}>{error}</div>}

        {/* Global Filters */}
        <div style={filtersContainerStyle}>
          <div style={filterGroupStyle}>
            <label style={filterLabelStyle}>Search</label>
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={filterInputStyle}
            />
          </div>

          <div style={filterGroupStyle}>
            <label style={filterLabelStyle}>District</label>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              style={filterSelectStyle}
            >
              <option value="all">All Districts</option>
              {filteredDistricts.map((district) => (
                <option key={district.id} value={district.id}>{district.name}</option>
              ))}
            </select>
          </div>

          <div style={filterGroupStyle}>
            <label style={filterLabelStyle}>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={filterSelectStyle}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div style={filterGroupStyle}>
            <label style={filterLabelStyle}>From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              style={filterInputStyle}
            />
          </div>

          <div style={filterGroupStyle}>
            <label style={filterLabelStyle}>To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              style={filterInputStyle}
            />
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              style={filterButtonStyle}
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Report Tabs */}
        <div style={tabsContainerStyle}>
          {reports.map((report) => (
            <button
              key={report.key}
              type="button"
              onClick={() => setActiveReport(report.key)}
              style={activeReport === report.key ? activeTabStyle : tabStyle}
            >
              {report.title}
            </button>
          ))}
        </div>

        {/* Active Report Content */}
        <div style={contentContainerStyle}>
          <ReportCard
            report={activeReportData}
            loading={activeReportData.key === 'members' ? membersLoading : loading}
            onDownloadCsv={handleDownloadCsv}
            onDownloadPdf={handleDownloadPdf}
            districts={districts}
            churches={churches}
            selectedDistrict={selectedDistrictForMembers}
            selectedChurch={selectedChurchForMembers}
            onDistrictChange={setSelectedDistrictForMembers}
            onChurchChange={setSelectedChurchForMembers}
            membersLoading={membersLoading}
          />
        </div>
      </section>
    </RequireRole>
  );
};

export default ReportsPage;
