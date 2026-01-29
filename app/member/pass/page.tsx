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
    padding: 0 !important;
    display: grid;
    gap: 8mm;
    justify-items: center;
  }

  #printable-pass-card > article {
    width: 85.6mm !important;
    height: 54mm !important;
    box-shadow: none !important;
    border: none !important;
    page-break-after: always;
  }

  #printable-pass-card > article:last-of-type {
    page-break-after: auto;
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
  color: 'var(--shell-foreground)',
};

const controlsSubtitleStyle: CSSProperties = {
  fontSize: '0.95rem',
  color: 'var(--muted)',
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
  border: '1px solid var(--surface-border)',
  padding: '0.65rem 1.6rem',
  fontSize: '0.92rem',
  fontWeight: 600,
  cursor: 'pointer',
  background: 'var(--surface-primary)',
  color: 'var(--shell-foreground)',
  boxShadow: '0 12px 24px rgba(15,23,42,0.12)',
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
  background: 'rgba(148,163,184,0.15)',
  color: 'var(--primary)',
};

const passWrapperStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  padding: '1.5rem 0',
};

const printableCardContainerStyle: CSSProperties = {
  width: '100%',
  maxWidth: '960px',
  display: 'grid',
  gap: '1.5rem',
  justifyItems: 'center',
};

const printableCardStyle: CSSProperties = {
  position: 'relative',
  width: 'min(540px, 100%)',
  aspectRatio: '85.6 / 54',
  background: 'linear-gradient(135deg, #f8fafc, #ffffff)',
  borderRadius: '18px',
  overflow: 'hidden',
  border: '1px solid rgba(15,23,42,0.08)',
  boxShadow: '0 28px 60px rgba(15,23,42,0.22)',
  display: 'flex',
  flexDirection: 'column',
};

const printableCardBackStyle: CSSProperties = {
  ...printableCardStyle,
  background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
  color: '#e2e8f0',
  border: '1px solid rgba(255,255,255,0.16)',
};

const cardBackgroundOverlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'radial-gradient(circle at top left, rgba(15,23,42,0.08), transparent 60%), radial-gradient(circle at bottom right, rgba(37,99,235,0.08), transparent 55%)',
  pointerEvents: 'none',
};

const cardBackgroundOverlayBackStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'radial-gradient(circle at 20% 30%, rgba(37,99,235,0.28), transparent 55%), radial-gradient(circle at 80% 70%, rgba(14,165,233,0.24), transparent 60%)',
  pointerEvents: 'none',
  opacity: 0.85,
};

const passHeaderStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0.85rem 1.4rem',
  background: 'rgba(15,23,42,0.92)',
  color: '#ffffff',
  gap: '0.75rem',
};

const headerBrandStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
};

const headerLogoStyle: CSSProperties = {
  width: '54px',
  height: '54px',
  borderRadius: '12px',
  background: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.55rem',
  boxShadow: '0 18px 32px rgba(15,23,42,0.28)',
};

const headerLogoImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
};

const headerBrandTextStyle: CSSProperties = {
  display: 'grid',
  gap: '0.2rem',
};

const headerOverlineStyle: CSSProperties = {
  fontFamily: '"Cinzel", "Trajan Pro", serif',
  fontSize: '1rem',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: '#ffffff',
  fontWeight: 700,
  textShadow: '0 6px 18px rgba(15,23,42,0.35)',
};

const passMetaStripStyle: CSSProperties = {
  position: 'relative',
  background: 'rgba(37,99,235,0.16)',
  color: '#0f172a',
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  fontWeight: 600,
  fontSize: '0.62rem',
  fontFamily: '"Montserrat", "Segoe UI", sans-serif',
  textAlign: 'left',
  padding: '0.45rem 1.4rem',
  borderTop: '1px solid rgba(255,255,255,0.12)',
  borderBottom: '1px solid rgba(15,23,42,0.08)',
};

const cardBodyStyle: CSSProperties = {
  position: 'relative',
  padding: '0.95rem 1.2rem 0.65rem',
  display: 'grid',
  gridTemplateRows: 'auto auto',
  gap: '0.65rem',
  flex: 1,
  fontFamily: '"Satoshi", "Inter", sans-serif',
};

const identitySectionStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: '0.75rem',
  alignItems: 'start',
};

const identityColumnStyle: CSSProperties = {
  display: 'grid',
  gap: '0.8rem',
};

const profileHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.7rem',
};

const initialBadgeStyle: CSSProperties = {
  width: '60px',
  height: '60px',
  borderRadius: '16px',
  background: 'linear-gradient(135deg, #1e3a8a, #0f172a)',
  color: '#f8fafc',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
  fontWeight: 700,
  letterSpacing: '0.04em',
  boxShadow: '0 12px 22px rgba(15,23,42,0.22)',
  fontFamily: '"Cinzel", "Trajan Pro", serif',
};

const profileNameBlockStyle: CSSProperties = {
  display: 'grid',
  gap: '0.25rem',
};

const profileNameStyle: CSSProperties = {
  fontSize: '1.08rem',
  fontWeight: 700,
  color: '#0f172a',
  letterSpacing: '0.015em',
  fontFamily: '"Satoshi", "Inter", sans-serif',
};

const profileInfoLineStyle: CSSProperties = {
  fontSize: '0.55rem',
  color: '#475569',
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  fontFamily: '"Montserrat", "Segoe UI", sans-serif',
};

const identityDetailsStyle: CSSProperties = {
  display: 'grid',
  gap: '0.4rem',
};

const detailInlineLabelStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.48rem',
  letterSpacing: '0.08em',
  textTransform: 'none',
  color: '#64748b',
  fontWeight: 400,
  fontFamily: '"Barlow Condensed", "Arial Narrow", sans-serif',
};

const detailInlineValueStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.76rem',
  color: '#1e293b',
  fontWeight: 500,
  letterSpacing: '0.01em',
  fontFamily: '"Satoshi", "Inter", sans-serif',
};

const qrColumnStyle: CSSProperties = {
  display: 'grid',
  gap: '0.5rem',
  justifyItems: 'center',
  padding: '0.55rem',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.85)',
  border: '1px solid rgba(15,23,42,0.08)',
  backdropFilter: 'blur(12px)',
  alignSelf: 'start',
};

const qrFrameStyle: CSSProperties = {
  width: '110px',
  height: '110px',
  background: '#ffffff',
  borderRadius: '10px',
  border: '1px solid rgba(148,163,184,0.32)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.4rem',
  boxShadow: '0 10px 18px rgba(15,23,42,0.12)',
};

const qrImageStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
};

const qrCaptionStyle: CSSProperties = {
  fontSize: '0.46rem',
  textTransform: 'uppercase',
  letterSpacing: '0.18em',
  color: '#475569',
  textAlign: 'center',
  lineHeight: 1.3,
  fontFamily: '"Montserrat", "Segoe UI", sans-serif',
};

const backHeaderStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
  padding: '0.75rem 1.2rem 0.35rem',
};

const backHeaderBadgeStyle: CSSProperties = {
  alignSelf: 'flex-start',
  padding: '0.22rem 0.65rem',
  borderRadius: '999px',
  background: 'rgba(15,23,42,0.14)',
  color: '#e2e8f0',
  fontSize: '0.52rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  fontWeight: 700,
};

const backHeaderTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.95rem',
  fontWeight: 700,
  letterSpacing: '0.03em',
};

const backHeaderSubtitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.6rem',
  color: 'rgba(226,232,240,0.75)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
};

const backBodyStyle: CSSProperties = {
  position: 'relative',
  padding: '0.75rem 1.2rem 0.5rem',
  display: 'grid',
  gap: '0.6rem',
};

const backInfoGridStyle: CSSProperties = {
  display: 'grid',
  gap: '0.6rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
};

const backInfoCardStyle: CSSProperties = {
  background: 'rgba(15,23,42,0.32)',
  borderRadius: '11px',
  padding: '0.6rem 0.75rem',
  border: '1px solid rgba(226,232,240,0.14)',
  display: 'grid',
  gap: '0.3rem',
};

const backInfoTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.62rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: '#bae6fd',
  fontWeight: 700,
};

const backInfoTextStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.66rem',
  lineHeight: 1.4,
  color: 'rgba(226,232,240,0.86)',
};

const backContactBlockStyle: CSSProperties = {
  display: 'grid',
  gap: '0.35rem',
  padding: '0.6rem 0.75rem',
  borderRadius: '11px',
  background: 'rgba(30,64,175,0.38)',
  border: '1px solid rgba(96,165,250,0.35)',
};

const backContactTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.6rem',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: '#bfdbfe',
  fontWeight: 700,
};

const backContactTextStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.68rem',
  lineHeight: 1.45,
  color: '#e2e8f0',
};

const backEmergencyLineStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.82rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#fbbf24',
};

const backFooterStyle: CSSProperties = {
  position: 'relative',
  marginTop: 'auto',
  padding: '0.7rem 1.2rem 0.8rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: '0.8rem',
};

const backSealStyle: CSSProperties = {
  display: 'grid',
  gap: '0.25rem',
  justifyItems: 'center',
  background: 'rgba(15,23,42,0.42)',
  border: '1px solid rgba(226,232,240,0.2)',
  borderRadius: '13px',
  padding: '0.5rem 0.7rem',
  minWidth: '120px',
};

const backSealTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.6rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: '#bae6fd',
  fontWeight: 700,
};

const backSealTextStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.6rem',
  lineHeight: 1.3,
  color: 'rgba(226,232,240,0.85)',
};

const passFooterStyle: CSSProperties = {
position: 'relative',
display: 'grid',
gridTemplateColumns: 'minmax(0, 1fr) auto',
gap: '0.5rem',
alignItems: 'end',
padding: '0.55rem 1.1rem 0.65rem',
borderTop: '1px solid rgba(15,23,42,0.08)',
background: 'rgba(255,255,255,0.75)',
};

const signatureBlockStyle: CSSProperties = {
display: 'grid',
gap: '0.2rem',
};

const signatureLineStyle: CSSProperties = {
width: '95px',
height: '2px',
background: 'rgba(15,23,42,0.3)',
};

const signatureLabelStyle: CSSProperties = {
fontSize: '0.48rem',
textTransform: 'uppercase',
letterSpacing: '0.18em',
color: '#0f172a',
fontWeight: 700,
};

const footerMetaStyle: CSSProperties = {
display: 'grid',
gap: '0.2rem',
justifyItems: 'flex-end',
fontSize: '0.6rem',
color: '#1e293b',
};

const footerMetaLabelStyle: CSSProperties = {
margin: 0,
fontWeight: 600,
color: '#0f172a',
opacity: 0.9,
fontSize: '0.5rem',
letterSpacing: '0.15em',
textTransform: 'uppercase',
};

const footerMetaTextStyle: CSSProperties = {
margin: 0,
fontSize: '0.58rem',
color: '#334155',
lineHeight: 1.22,
};

const disclaimerContainerStyle: CSSProperties = {
display: 'grid',
gap: '0.12rem',
padding: '0.3rem 1.1rem 0.45rem',
};

const disclaimerTextStyle: CSSProperties = {
  margin: 0,
  fontSize: '0.46rem',
  lineHeight: 1.25,
  color: '#475569',
  textAlign: 'center',
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

    const cardFaces = Array.from(target.querySelectorAll<HTMLElement>('article[data-pass-face]'));
    if (cardFaces.length === 0) {
      return;
    }

    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);

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

    const CARD_WIDTH_MM = 85.6;
    const CARD_HEIGHT_MM = 54;
    const CARD_MARGIN_MM = 2;

    const fullName = member ? `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() || 'member' : 'member';
    const nationalId = member?.nationalId || memberPass?.token || 'pass';
    const slug = `${fullName}-${nationalId}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90);

    let canvases: HTMLCanvasElement[] = [];

    const renderPdf = (pdfInstance: any, canvasList: HTMLCanvasElement[], watermarkLogo: HTMLImageElement | null) => {
      canvasList.forEach((canvas, index) => {
        if (index > 0) {
          pdfInstance.addPage([CARD_WIDTH_MM, CARD_HEIGHT_MM], 'landscape');
        }

        const pageWidth = pdfInstance.internal.pageSize.getWidth();
        const pageHeight = pdfInstance.internal.pageSize.getHeight();
        const cardWidth = canvas.width;
        const cardHeight = canvas.height;
        const availableWidth = pageWidth - CARD_MARGIN_MM * 2;
        const availableHeight = pageHeight - CARD_MARGIN_MM * 2;
        const ratio = Math.min(availableWidth / cardWidth, availableHeight / cardHeight);
        const pdfWidth = cardWidth * ratio;
        const pdfHeight = cardHeight * ratio;
        const imageX = (pageWidth - pdfWidth) / 2;
        const imageY = (pageHeight - pdfHeight) / 2;

        pdfInstance.addImage(canvas, 'PNG', imageX, imageY, pdfWidth, pdfHeight, undefined, 'FAST');

        if (watermarkLogo && (pdfInstance as any).GState) {
          const watermarkWidth = pageWidth * 0.6;
          const watermarkHeight = watermarkWidth * (watermarkLogo.height / watermarkLogo.width);
          const watermarkX = (pageWidth - watermarkWidth) / 2;
          const watermarkY = (pageHeight - watermarkHeight) / 2;

          pdfInstance.saveGraphicsState();
          pdfInstance.setGState(new (pdfInstance as any).GState({ opacity: 0.08 }));
          pdfInstance.addImage(
            watermarkLogo,
            'PNG',
            watermarkX,
            watermarkY,
            watermarkWidth,
            watermarkHeight,
            undefined,
            'SLOW',
            -28
          );
          pdfInstance.restoreGraphicsState();
        }
      });
    };

    try {
      canvases = await Promise.all(
        cardFaces.map((face) =>
          html2canvas(face, {
            scale: Math.max(3, window.devicePixelRatio * 2),
            backgroundColor: '#ffffff',
            useCORS: true,
          })
        )
      );

      let watermarkLogo: HTMLImageElement | null = null;
      try {
        watermarkLogo = await loadImage(logoUrl);
      } catch (logoError) {
        console.warn('Failed to load watermark logo, continuing without it.', logoError);
      }

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [CARD_WIDTH_MM, CARD_HEIGHT_MM],
        putOnlyUsedFonts: true,
      });

      renderPdf(pdf, canvases, watermarkLogo);
      pdf.save(`${slug}.pdf`);
      return;
    } catch (error) {
      console.error('Error generating PDF:', error);
    }

    try {
      if (!canvases.length) {
        canvases = await Promise.all(
          cardFaces.map((face) =>
            html2canvas(face, {
              scale: Math.max(2, window.devicePixelRatio * 1.5),
              backgroundColor: '#ffffff',
              useCORS: true,
            })
          )
        );
      }

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [CARD_WIDTH_MM, CARD_HEIGHT_MM],
        putOnlyUsedFonts: true,
      });

      renderPdf(pdf, canvases, null);
      pdf.save(`${slug}.pdf`);
    } catch (fallbackError) {
      console.error('Error generating fallback PDF:', fallbackError);
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
            <div id="printable-pass-card" style={printableCardContainerStyle}>
              <article data-pass-face="front" style={printableCardStyle}>
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
                        </div>
                      </div>

                      <div style={identityDetailsStyle}>
                        <div>
                          <p style={detailInlineLabelStyle}>Church</p>
                          <p style={detailInlineValueStyle}>{member.church?.name ?? 'Church assignment pending'}</p>
                        </div>
                        <div>
                          <p style={detailInlineLabelStyle}>National ID</p>
                          <p style={detailInlineValueStyle}>{member.nationalId ?? 'Not available'}</p>
                        </div>
                        <div>
                          <p style={detailInlineLabelStyle}>Phone number</p>
                          <p style={detailInlineValueStyle}>{member.phoneNumber ?? 'Not provided'}</p>
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
                            size={96}
                            level="H"
                            includeMargin
                            bgColor="#ffffff"
                            style={qrImageStyle}
                          />
                        )}
                      </div>
                      <p style={qrCaptionStyle}>Official Scan</p>
                    </div>
                  </section>
                </div>

                <section style={disclaimerContainerStyle}>
                  <p style={disclaimerTextStyle}>Official Rwanda Union Mission pass. Present with national ID on Umuganda day.</p>
                  <p style={disclaimerTextStyle}>Non-transferable • Report misuse, loss, or damage immediately.</p>
                </section>

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

              <article data-pass-face="back" style={printableCardBackStyle}>
                <div style={cardBackgroundOverlayBackStyle} />
                <header style={backHeaderStyle}>
                  <span style={backHeaderBadgeStyle}>Rwanda Union Mission</span>
                  <h2 style={backHeaderTitleStyle}>Community Service Identification</h2>
                  <p style={backHeaderSubtitleStyle}>Member obligations & verification</p>
                </header>

                <div style={backBodyStyle}>
                  <div style={backInfoGridStyle}>
                    <div style={backInfoCardStyle}>
                      <h3 style={backInfoTitleStyle}>Usage guidelines</h3>
                      <p style={backInfoTextStyle}>
                        Carry this pass with your national ID during Umuganda activities. Provide both documents to authorized
                        officers when asked for verification.
                      </p>
                      <p style={backInfoTextStyle}>
                        Keep the pass clean and legible. Damaged credentials must be returned to your church administrator for
                        replacement.
                      </p>
                    </div>
                    <div style={backInfoCardStyle}>
                      <h3 style={backInfoTitleStyle}>Compliance notice</h3>
                      <p style={backInfoTextStyle}>
                        Property of the Seventh-day Adventist Church – Rwanda Union Mission. Any alteration, duplication, lending, or
                        misuse voids this pass and may result in disciplinary or legal action.
                      </p>
                      <p style={backInfoTextStyle}>
                        Maintain up-to-date contact details with your church within 48 hours of any change.
                      </p>
                    </div>
                  </div>

                  <div style={backContactBlockStyle}>
                    <h3 style={backContactTitleStyle}>Union contact</h3>
                    <p style={backContactTextStyle}>KN 123 St, Kigali • Tel +250 788 000 000</p>
                    <p style={backContactTextStyle}>support@umuganda.rw • Report lost or stolen passes immediately.</p>
                    <p style={backEmergencyLineStyle}>Emergency line: 112</p>
                  </div>

                  <div style={backInfoCardStyle}>
                    <h3 style={backInfoTitleStyle}>Rights & acknowledgements</h3>
                    <p style={backInfoTextStyle}>
                      Using this pass confirms your agreement with the Umuganda participation guidelines of the Rwanda Union Mission.
                      Serve with integrity, uphold community safety, and respect local leadership at all times.
                    </p>
                    <p style={backInfoTextStyle}>© {new Date().getFullYear()} SDA Rwanda Union Mission. All rights reserved.</p>
                  </div>
                </div>

                <footer style={backFooterStyle}>
                  <div style={backSealStyle}>
                    <p style={backSealTitleStyle}>Official seal</p>
                    <p style={backSealTextStyle}>Return this pass to the Rwanda Union Mission if found.</p>
                  </div>
                </footer>
              </article>
            </div>
          </div>
        </div>
      </RequireRole>
    </DashboardShell>
  );
}
export default MemberPassPage;
