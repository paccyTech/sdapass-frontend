'use client';

import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Download, Printer, RefreshCcw, ShieldAlert } from 'lucide-react';

import RequireRole from '@/components/RequireRole';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { useAuthSession } from '@/hooks/useAuthSession';
import {
  fetchMemberPass,
  type MemberPassDetails,
  type MemberPassResponse,
  type MemberPassViewer,
} from '@/lib/api';
import { getRoleNavSections, getRoleSidebarSections } from '@/components/dashboard/roleNavigation';

const spinnerKeyframes = `
@keyframes passPageSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`;

const spinnerState = { inserted: false };

const printStyles = `
@media print {
  body {
    margin: 0 !important;
    background: #ffffff !important;
  }

  body * {
    visibility: hidden;
  }

  #printable-pass-card,
  #printable-pass-card * {
    visibility: visible;
  }

  #printable-pass-card {
    position: absolute;
    inset: 0;
    margin: auto;
    box-shadow: none !important;
    border: none !important;
    background: #ffffff !important;
    width: 100%;
    max-width: 880px;
    padding: 0 !important;
  }

  #print-controls-row,
  .dashboard-topbar,
  .dashboard-shell-sidebar,
  .dashboard-shell-toolbar,
  .dashboard-shell-header,
  .dashboard-shell-footer {
    display: none !important;
  }
}
`;

const printStyleState = { inserted: false };

const ensureSpinnerKeyframes = () => {
  if (typeof document === 'undefined' || spinnerState.inserted) {
    return;
  }
  const node = document.createElement('style');
  node.innerHTML = spinnerKeyframes;
  document.head.appendChild(node);
  spinnerState.inserted = true;
};

const ensurePrintStyles = () => {
  if (typeof document === 'undefined' || printStyleState.inserted) {
    return;
  }
  const node = document.createElement('style');
  node.innerHTML = printStyles;
  document.head.appendChild(node);
  printStyleState.inserted = true;
};

const loadingContainerStyle: CSSProperties = {
  display: 'flex',
  minHeight: '50vh',
  alignItems: 'center',
  justifyContent: 'center',
};

const loadingSpinnerStyle: CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: '999px',
  border: '4px solid rgba(59,130,246,0.25)',
  borderTopColor: '#3b82f6',
  animation: 'passPageSpin 1s linear infinite',
  margin: '0 auto 1rem',
};

const loadingTextStyle: CSSProperties = {
  fontSize: '1rem',
  fontWeight: 600,
  color: 'var(--shell-foreground)',
};

const loadingSubtextStyle: CSSProperties = {
  marginTop: '0.5rem',
  fontSize: '0.875rem',
  color: 'var(--muted)',
};

const errorOuterStyle: CSSProperties = {
  position: 'relative',
  margin: '0 auto',
  maxWidth: '52rem',
  padding: '1px',
  borderRadius: '40px',
  background: 'linear-gradient(135deg, rgba(244,114,182,0.55), rgba(251,191,36,0.42))',
  boxShadow: '0 40px 80px rgba(244,114,182,0.28)',
};

const errorCardStyle: CSSProperties = {
  position: 'relative',
  borderRadius: '39px',
  overflow: 'hidden',
  background: '#ffffff',
};

const errorBlurPrimary: CSSProperties = {
  position: 'absolute',
  left: '-7rem',
  top: '2.5rem',
  width: '14rem',
  height: '14rem',
  borderRadius: '50%',
  background: 'rgba(244,114,182,0.38)',
  filter: 'blur(80px)',
};

const errorBlurSecondary: CSSProperties = {
  position: 'absolute',
  right: '-6rem',
  top: '5rem',
  width: '12rem',
  height: '12rem',
  borderRadius: '50%',
  background: 'rgba(251,191,36,0.38)',
  filter: 'blur(80px)',
};

const errorHeaderStyle: CSSProperties = {
  position: 'relative',
  background: 'linear-gradient(120deg, #be123c, #f97316)',
  color: '#ffffff',
  padding: '3rem',
};

const errorHeaderFlex: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '1.25rem',
};

const errorIconStyle: CSSProperties = {
  display: 'inline-flex',
  width: '48px',
  height: '48px',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '20px',
  background: 'rgba(255,255,255,0.18)',
};

const errorBadgeLabel: CSSProperties = {
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '0.32em',
  color: 'rgba(255,255,255,0.7)',
};

const errorTitleStyle: CSSProperties = {
  marginTop: '0.75rem',
  fontSize: '1.9rem',
  fontWeight: 600,
  lineHeight: 1.3,
};

const errorBodyText: CSSProperties = {
  marginTop: '0.75rem',
  fontSize: '0.95rem',
  lineHeight: 1.6,
  color: 'rgba(255,255,255,0.82)',
};

const errorContentStyle: CSSProperties = {
  position: 'relative',
  padding: '2.5rem',
  display: 'grid',
  gap: '2rem',
};

const errorListStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gap: '1.25rem',
  fontSize: '0.95rem',
  color: '#475569',
};

const errorListItemStyle: CSSProperties = {
  display: 'flex',
  gap: '1rem',
  alignItems: 'flex-start',
};

const errorStepBadge: CSSProperties = {
  display: 'inline-flex',
  width: '34px',
  height: '34px',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '999px',
  background: 'rgba(248,113,113,0.18)',
  color: '#be123c',
  fontWeight: 600,
  fontSize: '0.95rem',
  flexShrink: 0,
};

const errorActionsStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
};

const errorPrimaryButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.75rem',
  border: 'none',
  borderRadius: '999px',
  padding: '0.6rem 1.6rem',
  fontSize: '0.9rem',
  fontWeight: 600,
  background: 'linear-gradient(120deg, #f97316, #fb7185)',
  color: '#ffffff',
  cursor: 'pointer',
  boxShadow: '0 18px 32px rgba(249,115,22,0.35)',
};

const errorSecondaryButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.75rem',
  border: '1px solid rgba(15,23,42,0.12)',
  borderRadius: '999px',
  padding: '0.6rem 1.6rem',
  fontSize: '0.9rem',
  fontWeight: 600,
  background: '#ffffff',
  color: '#0f172a',
  cursor: 'pointer',
  boxShadow: '0 16px 28px rgba(15,23,42,0.12)',
};

const buttonIconBubble: CSSProperties = {
  display: 'flex',
  width: '32px',
  height: '32px',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.22)',
};

const buttonIconDarkBubble: CSSProperties = {
  display: 'flex',
  width: '32px',
  height: '32px',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  background: '#0f172a',
  color: '#ffffff',
};

const pageContainerStyle: CSSProperties = {
  display: 'grid',
  justifyContent: 'center',
  gap: '1.75rem',
  alignItems: 'center',
  padding: '2.5rem 1.25rem 4rem',
  background: 'var(--shell-bg)',
};

const printControlsRowStyle: CSSProperties = {
  width: '100%',
  maxWidth: '960px',
  background: 'var(--surface-primary)',
  color: 'var(--shell-foreground)',
  borderRadius: '20px',
  padding: '1.75rem 2rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1.5rem',
  margin: '0 auto',
};

const controlsTextGroupStyle: CSSProperties = {
  display: 'grid',
  gap: '0.5rem',
  flex: '1 1 260px',
};

const controlsTitleStyle: CSSProperties = {
  fontSize: '1.4rem',
  fontWeight: 600,
  letterSpacing: '-0.01em',
  color: '#f8fafc',
};

const controlsSubtitleStyle: CSSProperties = {
  fontSize: '0.95rem',
  color: 'rgba(226,232,240,0.75)',
  maxWidth: '32rem',
  lineHeight: 1.6,
};

const controlsButtonGroupStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.75rem',
  justifyContent: 'flex-end',
  flex: '1 1 200px',
};

const controlButtonPrimaryStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.75rem',
  borderRadius: '999px',
  border: 'none',
  padding: '0.65rem 1.6rem',
  fontSize: '0.92rem',
  fontWeight: 600,
  cursor: 'pointer',
  background: '#38bdf8',
  color: '#0f172a',
  boxShadow: '0 20px 36px rgba(56,189,248,0.32)',
};

const controlButtonSecondaryStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.75rem',
  borderRadius: '999px',
  border: '1px solid rgba(148,163,184,0.35)',
  padding: '0.65rem 1.6rem',
  fontSize: '0.92rem',
  fontWeight: 600,
  cursor: 'pointer',
  background: 'rgba(15,23,42,0.12)',
  color: '#f8fafc',
  boxShadow: '0 16px 28px rgba(15,23,42,0.24)',
};

const controlButtonIconPrimaryStyle: CSSProperties = {
  display: 'inline-flex',
  width: '32px',
  height: '32px',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.85)',
  color: '#0f172a',
};

const controlButtonIconSecondaryStyle: CSSProperties = {
  display: 'inline-flex',
  width: '32px',
  height: '32px',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '50%',
  background: 'rgba(15,23,42,0.45)',
  color: '#f8fafc',
};

const passWrapperStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
};

const printableCardStyle: CSSProperties = {
  position: 'relative',
  width: '100%',
  maxWidth: '880px',
  background: '#f1f5f9',
  borderRadius: 0,
  overflow: 'hidden',
  border: 'none',
  boxShadow: 'none',
  aspectRatio: '210 / 297',
  display: 'flex',
  flexDirection: 'column',
};

const cardBackgroundOverlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'linear-gradient(160deg, rgba(15,23,42,0.08), rgba(15,23,42,0.03)), url(/sda-logo.png) center/420px no-repeat',
  opacity: 0.18,
  pointerEvents: 'none',
};

const passHeaderStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '1.9rem 2.5rem',
  background: '#102a4d',
  color: '#ffffff',
  gap: '1.5rem',
};

const headerBrandStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.25rem',
};

const headerLogoStyle: CSSProperties = {
  width: '72px',
  height: '72px',
  borderRadius: '18px',
  background: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.7rem',
  boxShadow: '0 20px 36px rgba(15,23,42,0.38)',
};

const headerLogoImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
};

const headerBrandTextStyle: CSSProperties = {
  display: 'grid',
  gap: '0.25rem',
};

const headerOverlineStyle: CSSProperties = {
  fontFamily: '"Playfair Display", "Times New Roman", serif',
  fontSize: '1.45rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: '#ffffff',
  fontWeight: 700,
  textShadow: '0 8px 24px rgba(15,23,42,0.35)',
};

const passMetaStripStyle: CSSProperties = {
  position: 'relative',
  background: '#17446f',
  color: 'rgba(226,232,240,0.88)',
  textTransform: 'uppercase',
  letterSpacing: '0.24em',
  fontWeight: 600,
  fontSize: '0.82rem',
  textAlign: 'center',
  padding: '0.9rem 2.5rem',
  borderTop: '1px solid rgba(148,163,184,0.24)',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
};

const cardBodyStyle: CSSProperties = {
  position: 'relative',
  padding: '2.75rem 2.5rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '2.4rem',
  background: '#ffffff',
  flex: 1,
};

const identitySectionStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2rem',
  alignItems: 'stretch',
};

const identityColumnStyle: CSSProperties = {
  flex: '1 1 280px',
  display: 'grid',
  gap: '1.75rem',
};

const profileHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.25rem',
};

const initialBadgeStyle: CSSProperties = {
  width: '86px',
  height: '86px',
  borderRadius: '22px',
  background: '#0f172a',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '2.1rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  boxShadow: '0 18px 32px rgba(15,23,42,0.22)',
};

const profileNameBlockStyle: CSSProperties = {
  display: 'grid',
  gap: '0.35rem',
};

const profileNameStyle: CSSProperties = {
  fontSize: '1.8rem',
  fontWeight: 700,
  color: '#0f172a',
  letterSpacing: '0.02em',
};

const profileInfoLineStyle: CSSProperties = {
  fontSize: '0.95rem',
  color: '#475569',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

const detailsGridStyle: CSSProperties = {
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
};

const detailGroupStyle: CSSProperties = {
  background: '#ffffff',
  borderRadius: '14px',
  padding: '0.9rem 1.1rem',
  display: 'grid',
  gap: '0.4rem',
  border: 'none',
};

const detailLabelStyle: CSSProperties = {
  fontSize: '0.68rem',
  textTransform: 'uppercase',
  letterSpacing: '0.28em',
  color: '#64748b',
  fontWeight: 700,
};

const detailValueStyle: CSSProperties = {
  fontSize: '1.05rem',
  color: '#0f172a',
  fontWeight: 600,
  letterSpacing: '0.02em',
  wordBreak: 'break-word',
};

const detailValueMutedStyle: CSSProperties = {
  fontSize: '0.95rem',
  color: '#1e293b',
  letterSpacing: '0.04em',
};

const qrColumnStyle: CSSProperties = {
  flex: '0 0 260px',
  display: 'grid',
  gap: '1rem',
  justifyItems: 'center',
  padding: '1.5rem',
  borderRadius: '20px',
  background: '#ffffff',
  border: 'none',
};

const qrFrameStyle: CSSProperties = {
  width: '220px',
  height: '220px',
  background: '#ffffff',
  borderRadius: '18px',
  border: '1px solid rgba(148,163,184,0.35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.75rem',
  boxShadow: '0 16px 28px rgba(15,23,42,0.12)',
};

const qrImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
};

const qrCaptionStyle: CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.32em',
  color: '#475569',
  textAlign: 'center',
  lineHeight: 1.5,
};

const passFooterStyle: CSSProperties = {
  position: 'relative',
  padding: '2.25rem 2.5rem',
  borderTop: '1px solid rgba(0,0,0,0.1)',
  display: 'flex',
  flexWrap: 'wrap',
  gap: '2rem',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  background: '#ffffff',
};

const signatureBlockStyle: CSSProperties = {
  display: 'grid',
  gap: '0.65rem',
};

const signatureLineStyle: CSSProperties = {
  width: '220px',
  height: '2px',
  background: 'rgba(0,0,0,0.2)',
};

const signatureLabelStyle: CSSProperties = {
  fontSize: '0.85rem',
  textTransform: 'uppercase',
  letterSpacing: '0.32em',
  color: '#0f172a',
  fontWeight: 700,
};

const footerMetaStyle: CSSProperties = {
  display: 'grid',
  gap: '0.6rem',
  fontSize: '0.9rem',
  color: '#1e293b',
  maxWidth: '28rem',
};

const footerMetaLabelStyle: CSSProperties = {
  margin: 0,
  fontWeight: 600,
  color: '#0f172a',
  opacity: 0.9,
  fontSize: '0.75rem',
  letterSpacing: '0.18em',
};

const footerMetaTextStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.85rem',
  color: '#334155',
  lineHeight: 1.6,
};

const disclaimerContainerStyle: CSSProperties = {
  marginTop: '1.5rem',
  padding: '1.5rem 2.5rem 2rem',
  background: '#ffffff',
  borderTop: '1px solid rgba(0,0,0,0.05)',
};

const disclaimerTextStyle: CSSProperties = {
  margin: '0 auto',
  fontSize: '0.8rem',
  lineHeight: 1.6,
  color: '#64748b',
  textAlign: 'center',
  maxWidth: '800px',
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) {
    return 'Not available';
  }

  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(date);
  } catch (error) {
    console.warn('Failed to format date', error);
    return value;
  }
};

const MemberPassPage = () => {
  const router = useRouter();
  const pathname = usePathname() ?? '/member/pass';
  const { token, user } = useAuthSession();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [member, setMember] = useState<MemberPassViewer | null>(null);
  const [memberPass, setMemberPass] = useState<MemberPassDetails | null>(null);

  const qrImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setMounted(true);
    ensureSpinnerKeyframes();
    ensurePrintStyles();
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    if (!token) {
      router.replace('/login');
      return;
    }

    if (user?.role !== 'MEMBER') {
      const destination = user?.role ? `/${user.role.toLowerCase()}/dashboard` : '/login';
      router.replace(destination);
    }
  }, [mounted, router, token, user]);

  useEffect(() => {
    if (!mounted || !token || !user?.id) {
      return;
    }

    const loadPass = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!user?.id) {
          setError('User ID is not available. Please log in again.');
          setLoading(false);
          return;
        }
        
        const response: MemberPassResponse = await fetchMemberPass(token, user.id);

        if (!response?.pass) {
          setMember(response?.member ?? null);
          setMemberPass(null);
          setError('No digital pass is currently issued for your account.');
          return;
        }

        setMember(response.member);
        setMemberPass(response.pass);
      } catch (err) {
        console.error('Failed to load member pass', err);
        const message = err instanceof Error ? err.message : null;
        if (message?.includes('404')) {
          setError('We could not find an active Umuganda pass linked to your profile.');
        } else {
          setError(message ?? 'We could not load your Umuganda pass. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadPass();
  }, [mounted, token, user?.id]);

  const navSections = useMemo(() => getRoleNavSections('MEMBER', pathname), [pathname]);
  const sidebarSections = useMemo(() => getRoleSidebarSections('MEMBER'), []);

  const handleDownloadPdf = useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }

    const target = document.getElementById('printable-pass-card');
    if (!target) {
      return;
    }

    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

    // Load the SDA logo
    const logoUrl = '/sda-logo.png';
    const loadImage = (url: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
    };

    try {
      const [canvas, logo] = await Promise.all([
        html2canvas(target, {
          scale: Math.max(3, window.devicePixelRatio * 2),
          backgroundColor: '#ffffff',
          useCORS: true,
        }),
        loadImage(logoUrl)
      ]);

      const pdf = new jsPDF('p', 'mm', 'a4', true);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const cardWidth = canvas.width;
      const cardHeight = canvas.height;
      const margin = 2;
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;
      const ratio = Math.min(availableWidth / cardWidth, availableHeight / cardHeight);
      const pdfWidth = cardWidth * ratio;
      const pdfHeight = cardHeight * ratio;
      const imageX = (pageWidth - pdfWidth) / 2;
      const imageY = (pageHeight - pdfHeight) / 2;

      // Add the main content
      pdf.addImage(canvas, 'PNG', imageX, imageY, pdfWidth, pdfHeight, undefined, 'FAST');

      // Add the watermark
      const logoSize = Math.min(pageWidth, pageHeight) * 0.5;
      const logoX = (pageWidth - logoSize) / 2;
      const logoY = (pageHeight - logoSize) / 2;
      
      // Save the current graphics state
      pdf.saveGraphicsState();
      
      // Set transparency for the watermark
      pdf.setGState(new (pdf as any).GState({ opacity: 0.15 }));
      
      // Add the logo as a watermark
      pdf.addImage(
        logo,
        'PNG',
        logoX,
        logoY,
        logoSize,
        logoSize * (logo.height / logo.width),
        undefined,
        'SLOW'
      );
      
      // Restore the graphics state
      pdf.restoreGraphicsState();

      const fullName = member ? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() || 'member' : 'member';
      const nationalId = member?.nationalId || memberPass?.token || 'pass';
      const slug = `${fullName}-${nationalId}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 90);

      pdf.save(`${slug}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to the original method if there's an error with the logo
      const canvas = await html2canvas(target, {
        scale: Math.max(3, window.devicePixelRatio * 2),
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      const imageData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4', true);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const cardWidth = canvas.width;
      const cardHeight = canvas.height;
      const margin = 2;
      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;
      const ratio = Math.min(availableWidth / cardWidth, availableHeight / cardHeight);
      const pdfWidth = cardWidth * ratio;
      const pdfHeight = cardHeight * ratio;
      const imageX = (pageWidth - pdfWidth) / 2;
      const imageY = (pageHeight - pdfHeight) / 2;

      pdf.addImage(imageData, 'PNG', imageX, imageY, pdfWidth, pdfHeight, undefined, 'FAST');
      
      const fullName = member ? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() || 'member' : 'member';
      const nationalId = member?.nationalId || memberPass?.token || 'pass';
      const slug = `${fullName}-${nationalId}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 90);

      pdf.save(`${slug}.pdf`);
    }
  }, [member, memberPass]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <DashboardShell
        role="MEMBER"
        navSections={navSections}
        sidebarSections={sidebarSections}
        currentUser={user}
      >
        <div style={loadingContainerStyle}>
          <div style={{ textAlign: 'center' }}>
            <div style={loadingSpinnerStyle} />
            <p style={loadingTextStyle}>Preparing your Umuganda pass…</p>
            <p style={loadingSubtextStyle}>We are securely fetching your pass details.</p>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (error || !memberPass || !member) {
    return (
      <DashboardShell
        role="MEMBER"
        navSections={navSections}
        sidebarSections={sidebarSections}
        currentUser={user}
      >
        <div style={errorOuterStyle}>
          <div style={errorCardStyle}>
            <div style={errorBlurPrimary} />
            <div style={errorBlurSecondary} />

            <div style={errorHeaderStyle}>
              <div style={errorHeaderFlex}>
                <span style={errorIconStyle}>
                  <ShieldAlert aria-hidden />
                </span>
                <div>
                  <p style={errorBadgeLabel}>Pass unavailable</p>
                  <h2 style={errorTitleStyle}>Unable to display your Umuganda pass</h2>
                  <p style={errorBodyText}>
                    {error ?? 'We could not find an active Umuganda pass associated with your account.'}
                  </p>
                </div>
              </div>
            </div>

            <div style={errorContentStyle}>
              <ul style={errorListStyle}>
                <li style={errorListItemStyle}>
                  <span style={errorStepBadge}>1</span>
                  <span>Confirm with your church administrator that a pass has been issued to you.</span>
                </li>
                <li style={errorListItemStyle}>
                  <span style={errorStepBadge}>2</span>
                  <span>If you recently registered, allow a few minutes for the digital pass to generate in the system.</span>
                </li>
                <li style={errorListItemStyle}>
                  <span style={errorStepBadge}>3</span>
                  <span>Use the actions below to retry loading or return to your dashboard.</span>
                </li>
              </ul>

              <div style={errorActionsStyle}>
                <button
                  type="button"
                  onClick={() => router.refresh()}
                  style={errorPrimaryButton}
                >
                  <span style={buttonIconBubble}>
                    <RefreshCcw aria-hidden />
                  </span>
                  Try again
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/member/dashboard')}
                  style={errorSecondaryButton}
                >
                  <span style={buttonIconDarkBubble}>
                    <ArrowLeft aria-hidden />
                  </span>
                  Go back to dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      role="MEMBER"
      navSections={navSections}
      sidebarSections={sidebarSections}
      currentUser={user}
    >
      <RequireRole allowed={['MEMBER']}>
        <div style={pageContainerStyle}>
          <section id="print-controls-row" style={printControlsRowStyle}>
            <div style={controlsTextGroupStyle}>
              <h1 style={controlsTitleStyle}>Your Rwanda Union Mission Umuganda pass</h1>
              <p style={controlsSubtitleStyle}>
                Download or print this official community service pass before Umuganda day. Keep a digital copy on your phone and
                carry a printed backup for verification by the police.
              </p>
            </div>
            <div style={controlsButtonGroupStyle}>
              <button type="button" onClick={handlePrint} style={controlButtonPrimaryStyle}>
                <span style={controlButtonIconPrimaryStyle}>
                  <Printer aria-hidden />
                </span>
                Print pass
              </button>
              <button type="button" onClick={handleDownloadPdf} style={controlButtonSecondaryStyle}>
                <span style={controlButtonIconSecondaryStyle}>
                  <Download aria-hidden />
                </span>
                Download PDF
              </button>
            </div>
          </section>

          <div style={passWrapperStyle}>
            <article id="printable-pass-card" style={printableCardStyle}>
              <div style={cardBackgroundOverlayStyle} />
              <header style={passHeaderStyle}>
                <div style={headerBrandStyle}>
                  <div style={headerLogoStyle}>
                    <img src="/sda-logo.png" alt="Rwanda Union Mission logo" style={headerLogoImageStyle} />
                  </div>
                  <div style={headerBrandTextStyle}>
                    <span style={headerOverlineStyle}>Rwanda Union Mission</span>
                  </div>
                </div>
              </header>

              <div style={passMetaStripStyle}>Official Umuganda Pass</div>

              <div style={cardBodyStyle}>
                <section style={identitySectionStyle}>
                  <div style={identityColumnStyle}>
                    <div style={profileHeaderStyle}>
                      <div style={initialBadgeStyle}>
                        {(member.firstName?.[0] ?? '') + (member.lastName?.[0] ?? '') || 'RM'}
                      </div>
                      <div style={profileNameBlockStyle}>
                        <span style={profileNameStyle}>
                          {member.firstName} {member.lastName}
                        </span>
                        <span style={profileInfoLineStyle}>{member.church?.name ?? 'Church assignment pending'}</span>
                        <span style={profileInfoLineStyle}>Issued by Rwanda Union Mission</span>
                      </div>
                    </div>

                    <div style={detailsGridStyle}>
                      <div style={detailGroupStyle}>
                        <span style={detailLabelStyle}>Pass token</span>
                        <span style={detailValueMutedStyle}>{memberPass.token}</span>
                      </div>
                      <div style={detailGroupStyle}>
                        <span style={detailLabelStyle}>National ID</span>
                        <span style={detailValueStyle}>{member.nationalId ?? 'Not available'}</span>
                      </div>
                      <div style={detailGroupStyle}>
                        <span style={detailLabelStyle}>Pass issued</span>
                        <span style={detailValueStyle}>{formatDateTime(memberPass.smsSentAt)}</span>
                      </div>
                      <div style={detailGroupStyle}>
                        <span style={detailLabelStyle}>Pass expires</span>
                        <span style={detailValueStyle}>{formatDateTime(memberPass.expiresAt)}</span>
                      </div>
                      <div style={detailGroupStyle}>
                        <span style={detailLabelStyle}>Member phone</span>
                        <span style={detailValueMutedStyle}>{member.phoneNumber ?? 'Not provided'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={qrColumnStyle}>
                    <div style={qrFrameStyle}>
                      {memberPass.qrPayload?.startsWith('data:image') ? (
                        <img
                          ref={qrImageRef}
                          src={memberPass.qrPayload}
                          alt="Umuganda QR code"
                          style={qrImageStyle}
                        />
                      ) : (
                        <QRCodeSVG
                          value={memberPass.qrPayload}
                          size={210}
                          level="H"
                          includeMargin
                          bgColor="#ffffff"
                          style={qrImageStyle}
                        />
                      )}
                    </div>
                    <p style={qrCaptionStyle}>Scan with official Umuganda verifier application</p>
                  </div>
                </section>

                <section style={disclaimerContainerStyle}>
                  <p style={disclaimerTextStyle}>
                    <strong>OFFICIAL RWANDA UNION MISSION DOCUMENT</strong>
                    <br /><br />
                    This Umuganda Pass is the property of the Seventh-day Adventist Church - Rwanda Union Mission. It is issued to the named member only and is non-transferable. The pass must be presented with a valid government-issued photo ID for verification. Any alteration, duplication, or unauthorized use of this document is strictly prohibited and may result in legal action. The Rwanda Union Mission reserves the right to revoke this pass at any time without prior notice. For verification or reporting lost/stolen passes, please contact your local church administrator or the Rwanda Union Mission office.
                    <br /><br />
                    <small>© {new Date().getFullYear()} SDA Rwanda Union Mission. All Rights Reserved.</small>
                  </p>
                </section>

              </div>

              <footer style={passFooterStyle}>
                <div style={signatureBlockStyle}>
                  <div style={signatureLineStyle} />
                  <span style={signatureLabelStyle}>Rwanda Union Mission Officer</span>
                </div>
                <div style={footerMetaStyle}>
                  <p style={footerMetaLabelStyle}>Church contact</p>
                  <p style={footerMetaTextStyle}>{member.church?.name ?? 'Not assigned yet'}</p>
                  <p style={footerMetaLabelStyle}>Verification</p>
                  <p style={footerMetaTextStyle}>
                    Police officers should scan the QR code to validate authenticity. The pass remains property of the Rwanda Union Mission.
                  </p>
                </div>
              </footer>
            </article>
          </div>
        </div>
      </RequireRole>
    </DashboardShell>
  );
}
export default MemberPassPage;
