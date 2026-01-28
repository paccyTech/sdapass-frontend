'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import Image from 'next/image';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import {
  IconAlertTriangle,
  IconCamera,
  IconPlayerPlay,
  IconPlayerStop,
  IconRefresh,
  IconShieldCheck,
  IconLogout,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

import RequireRole from '@/components/RequireRole';
import { useAuthSession } from '@/hooks/useAuthSession';
import { verifyPassToken, type PassVerificationResponse } from '@/lib/api';
import { useTheme } from '@/components/theme/ThemeProvider';
import { clearAuthSession } from '@/lib/auth';

type ScanStatus = 'idle' | 'scanning' | 'verifying';

type FeedbackState = {
  variant: 'success' | 'error';
  title: string;
  message: string;
  details?: {
    passId: string;
    churchName: string;
    sessionDate: string;
    issuedAt: string;
  };
} | null;

const resetScanner = (reader: BrowserMultiFormatReader) => {
  (reader as unknown as { reset?: () => void }).reset?.();
};

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: 'linear-gradient(145deg, #f5f7fb 0%, #eef3ff 45%, #ffffff 100%)',
  padding: 'clamp(2.4rem, 6vw, 3.5rem) clamp(1rem, 5vw, 6rem)',
  display: 'flex',
  justifyContent: 'center',
};

const layoutStyle: CSSProperties = {
  width: 'min(1180px, 100%)',
  margin: '0 auto',
  display: 'grid',
  gap: 'clamp(1.6rem, 3vw, 2.75rem)',
};

const topBarStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1rem',
  rowGap: '1.15rem',
  padding: 'clamp(1rem, 2.5vw, 1.6rem)',
  borderRadius: '20px',
  border: '1px solid rgba(15, 51, 92, 0.12)',
  background: 'linear-gradient(120deg, rgba(255, 255, 255, 0.82), rgba(238, 243, 255, 0.88))',
  boxShadow: '0 22px 44px rgba(11, 31, 51, 0.12)',
  backdropFilter: 'blur(12px)',
  flexWrap: 'wrap',
};

const topBarBrandStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.05rem',
  minWidth: 0,
  flex: '1 1 260px',
};

const brandLogoStyle: CSSProperties = {
  borderRadius: '12px',
  objectFit: 'contain',
  background: '#ffffffaa',
  padding: '0.35rem',
  width: 'clamp(48px, 9vw, 60px)',
  height: 'auto',
};

const topBarRightStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.9rem',
  marginLeft: 'auto',
  flex: '1 1 280px',
  minWidth: 'min(280px, 100%)',
  justifyContent: 'flex-end',
  flexWrap: 'wrap',
};

const brandTextStyle: CSSProperties = {
  display: 'grid',
  gap: '0.35rem',
  minWidth: 0,
};

const brandSubtitleStyle: CSSProperties = {
  fontSize: '0.72rem',
  letterSpacing: '0.22em',
  textTransform: 'uppercase',
  color: '#184c8c',
  fontWeight: 700,
};

const brandTitleRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.6rem',
  flexWrap: 'wrap',
};

const brandTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(1.15rem, 2vw + 1rem, 1.35rem)',
  color: '#0b1f33',
};

const roleBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.35rem',
  borderRadius: '999px',
  padding: '0.35rem 0.75rem',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.16em',
  background: 'rgba(24, 76, 140, 0.12)',
  color: '#184c8c',
  fontWeight: 700,
};

const topBarButtonsStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.65rem',
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
  flex: '1 1 220px',
  minWidth: 'min(280px, 100%)',
};

const logoutButtonStyle: CSSProperties = {
  border: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
  borderRadius: '12px',
  padding: '0.55rem 1.1rem',
  background: 'rgba(182, 32, 48, 0.12)',
  color: '#B62030',
  fontWeight: 600,
  cursor: 'pointer',
  boxShadow: '0 16px 28px rgba(182, 32, 48, 0.12)',
};

const headingBlockStyle: CSSProperties = {
  display: 'grid',
  gap: '1rem',
  color: '#0b1f33',
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 'clamp(1.5rem, 3vw, 2.5rem)',
};

const scannerCardStyle: CSSProperties = {
  background: '#ffffff',
  borderRadius: '28px',
  padding: 'clamp(1.8rem, 2vw + 1.1rem, 2.4rem)',
  boxShadow: '0 26px 48px rgba(18, 38, 68, 0.12)',
  display: 'grid',
  gap: '1.75rem',
};

const videoWrapperStyle: CSSProperties = {
  position: 'relative',
  borderRadius: '22px',
  overflow: 'hidden',
  background: '#020817',
  minHeight: 'clamp(240px, 40vw, 360px)',
  display: 'grid',
  placeItems: 'center',
};

const videoStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const cameraIdleOverlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  textAlign: 'center',
  padding: '2rem',
  color: 'rgba(235, 243, 255, 0.92)',
  background: 'linear-gradient(145deg, rgba(11, 31, 51, 0.72), rgba(24, 76, 140, 0.56))',
  gap: '0.75rem',
};

const overlayFrameStyle: CSSProperties = {
  position: 'absolute',
  inset: '14%',
  border: '3px solid rgba(255,255,255,0.78)',
  borderRadius: '24px',
  boxShadow: '0 0 0 999px rgba(1, 15, 28, 0.45)',
  pointerEvents: 'none',
};

const scanLineStyle: CSSProperties = {
  position: 'absolute',
  left: '16%',
  right: '16%',
  height: '3px',
  background: 'linear-gradient(90deg, transparent, rgba(47, 152, 208, 0.85), transparent)',
  animation: 'scannerPulse 2.4s ease-in-out infinite',
  pointerEvents: 'none',
};

const feedbackCardStyle = (variant: 'success' | 'error'): CSSProperties => ({
  borderRadius: '20px',
  padding: '1.4rem 1.6rem',
  display: 'grid',
  gap: '0.65rem',
  border: variant === 'success' ? '1px solid rgba(31, 157, 119, 0.32)' : '1px solid rgba(135, 32, 58, 0.25)',
  background: variant === 'success' ? 'rgba(31, 157, 119, 0.12)' : 'rgba(135, 32, 58, 0.12)',
  color: '#0b1f33',
});

const statusPillStyle = (status: ScanStatus): CSSProperties => {
  if (status === 'verifying') {
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.45rem',
      borderRadius: '999px',
      padding: '0.4rem 0.9rem',
      fontSize: '0.82rem',
      fontWeight: 600,
      color: '#1f3d5d',
      background: 'rgba(31, 61, 93, 0.12)',
    };
  }

  if (status === 'scanning') {
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.45rem',
      borderRadius: '999px',
      padding: '0.4rem 0.9rem',
      fontSize: '0.82rem',
      fontWeight: 600,
      color: '#183a72',
      background: 'rgba(24, 58, 114, 0.12)',
    };
  }

  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.45rem',
    borderRadius: '999px',
    padding: '0.4rem 0.9rem',
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'rgba(11, 31, 51, 0.78)',
    background: 'rgba(11, 31, 51, 0.08)',
  };
};

const instructionCardStyle: CSSProperties = {
  background: 'rgba(255, 255, 255, 0.58)',
  borderRadius: '26px',
  padding: 'clamp(1.6rem, 2vw + 1.1rem, 2.2rem)',
  display: 'grid',
  gap: '1.4rem',
  border: '1px solid rgba(15, 51, 92, 0.08)',
  boxShadow: '0 22px 42px rgba(12, 24, 40, 0.14)',
  color: '#0b1f33',
};

const listStyle: CSSProperties = {
  display: 'grid',
  gap: '0.9rem',
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const manualFormStyle: CSSProperties = {
  display: 'grid',
  gap: '0.8rem',
  background: '#f4f7fb',
  borderRadius: '18px',
  padding: 'clamp(1rem, 1.5vw + 0.8rem, 1.4rem)',
  border: '1px dashed rgba(24, 76, 140, 0.18)',
};

const headerButtonRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  flexWrap: 'wrap',
};

const inputStyle: CSSProperties = {
  borderRadius: '14px',
  border: '1px solid rgba(24, 76, 140, 0.22)',
  padding: '0.75rem 1rem',
  fontSize: '0.95rem',
  fontFamily: 'inherit',
};

const buttonStyle = (variant: 'primary' | 'ghost' = 'primary'): CSSProperties => ({
  border: 'none',
  borderRadius: '14px',
  padding: '0.7rem 1.3rem',
  fontWeight: 600,
  cursor: 'pointer',
  background:
    variant === 'primary'
      ? 'linear-gradient(135deg, #184c8c, #2f98d0)'
      : 'rgba(24, 76, 140, 0.08)',
  color: variant === 'primary' ? '#ffffff' : '#184c8c',
  boxShadow: variant === 'primary' ? '0 18px 32px rgba(15, 51, 92, 0.18)' : 'none',
  transition: 'transform 0.15s ease',
});

const formatDateTime = (value: string) => {
  try {
    const date = new Date(value);
    return `${date.toLocaleDateString()} • ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch (error) {
    return value;
  }
};

const extractToken = (raw: string): string | null => {
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (typeof parsed === 'string') {
      return parsed;
    }
    if (parsed && typeof parsed === 'object' && 'token' in parsed) {
      const token = (parsed as { token?: unknown }).token;
      return typeof token === 'string' ? token : null;
    }
  } catch (error) {
    // Not JSON, fall back to raw string
  }

  return trimmed;
};

const formatRoleLabel = (role?: string | null) => {
  if (!role) {
    return 'Unknown role';
  }
  return role
    .toLowerCase()
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

const PoliceVerifyPage = () => {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const previousThemeRef = useRef<typeof theme | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const processingRef = useRef(false);
  const lastTokenRef = useRef<string | null>(null);

  const session = useAuthSession();

  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const isAuthReady = Boolean(session.token);

  const officerName = useMemo(() => {
    const user = session.user;
    if (!user) {
      return 'Police officer';
    }
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    if (fullName) {
      return fullName;
    }
    if (user.email) {
      return user.email;
    }
    return 'Police officer';
  }, [session.user]);

  useEffect(() => {
    previousThemeRef.current = theme;
    setTheme('light');

    return () => {
      if (previousThemeRef.current) {
        setTheme(previousThemeRef.current);
      }
    };
  }, [setTheme, theme]);

  const applyFeedback = useCallback((result: PassVerificationResponse) => {
    if (result.valid) {
      const memberName = result.member 
        ? `${result.member.firstName} ${result.member.lastName}`.trim() 
        : 'Member';
      const nationalId = result.member?.nationalId ? `ID: ${result.member.nationalId}` : '';
      
      setFeedback({
        variant: 'success',
        title: 'Pass Verified Successfully',
        message: `${memberName}\n${nationalId}`,
        details: {
          passId: result.passId,
          churchName: result.church?.name ?? 'Unassigned church',
          sessionDate: new Date(result.sessionDate).toLocaleDateString(),
          issuedAt: formatDateTime(result.issuedAt),
        },
      });
    } else {
      const reason = result.reason === 'expired' 
        ? 'This pass has expired.\nPlease ask the member to request a new one.' 
        : 'No active pass matches this QR code.';
      setFeedback({
        variant: 'error',
        title: 'Verification Failed',
        message: reason,
      });
    }
    setIsModalOpen(true);
  }, []);

  const verifyToken = useCallback(
    async (raw: string, options: { force?: boolean } = {}) => {
      if (!session.token) {
        setFeedback({
          variant: 'error',
          title: 'Session expired',
          message: 'Sign in again to continue verifying passes.',
        });
        return;
      }

      const token = extractToken(raw);
      if (!token) {
        setFeedback({
          variant: 'error',
          title: 'Unreadable QR code',
          message: 'We could not extract a pass token. Ask the member to refresh their pass.',
        });
        return;
      }

      if (!options.force && lastTokenRef.current === token) {
        return;
      }

      if (processingRef.current) {
        return;
      }

      processingRef.current = true;
      setScanStatus('verifying');
      try {
        const result = await verifyPassToken(session.token, token);
        applyFeedback(result);
        lastTokenRef.current = token;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to verify pass right now.';
        setFeedback({
          variant: 'error',
          title: 'Verification error',
          message,
        });
      } finally {
        processingRef.current = false;
        setScanStatus('scanning');
      }
    },
    [applyFeedback, session.token],
  );

  const startCamera = useCallback(async () => {
    if (!videoRef.current) {
      return;
    }

    controlsRef.current?.stop();
    controlsRef.current = null;

    setScanStatus('scanning');
    setCameraError(null);

    const reader = new BrowserMultiFormatReader();

    try {
      await reader.decodeFromVideoDevice(undefined, videoRef.current, (result, error, controls) => {
        if (controls) {
          controlsRef.current = controls;
        }

        if (result) {
          verifyToken(result.getText());
        }

        if (error && error.name !== 'NotFoundException') {
          setCameraError('Camera error: ' + error.message);
        }
      });
    } catch (error) {
      resetScanner(reader);
      throw error;
    }

    return () => {
      resetScanner(reader);
    };
  }, [verifyToken]);

  useEffect(() => {
    if (!isAuthReady || !videoRef.current || !cameraActive) {
      if (!cameraActive) {
        controlsRef.current?.stop();
        controlsRef.current = null;
        processingRef.current = false;
        lastTokenRef.current = null;
        setScanStatus('idle');
      }
      return;
    }

    let cleanup: (() => void) | undefined;
    startCamera()
      .then((fn) => {
        cleanup = fn;
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : 'Unable to access camera';
        setCameraError(message);
        setCameraActive(false);
        setScanStatus('idle');
      });

    return () => {
      cleanup?.();
      controlsRef.current?.stop();
      controlsRef.current = null;
      processingRef.current = false;
    };
  }, [cameraActive, isAuthReady, startCamera]);

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    processingRef.current = false;
    setScanStatus('idle');
    setCameraActive(false);
  }, []);

  const handleLogout = useCallback(() => {
    stopCamera();
    clearAuthSession();
    router.push('/login');
  }, [router, stopCamera]);

  const handleStartCamera = useCallback(() => {
    lastTokenRef.current = null;
    processingRef.current = false;
    setFeedback(null);
    setCameraError(null);
    setCameraActive(true);
  }, []);

  const handleResetCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    lastTokenRef.current = null;
    processingRef.current = false;
    setFeedback(null);
    setCameraError(null);
    if (!cameraActive) {
      return;
    }
    startCamera().catch((error) => {
      const message = error instanceof Error ? error.message : 'Unable to access camera';
      setCameraError(message);
      setCameraActive(false);
      setScanStatus('idle');
    });
  }, [cameraActive, startCamera]);

  const handleManualSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!manualToken.trim()) {
        return;
      }
      setManualSubmitting(true);
      await verifyToken(manualToken, { force: true });
      setManualSubmitting(false);
      setManualToken('');
    },
    [manualToken, verifyToken],
  );

  const statusLabel = useMemo(() => {
    switch (scanStatus) {
      case 'verifying':
        return 'Validating pass…';
      case 'scanning':
        return 'Camera active—present QR code';
      default:
        return 'Camera inactive';
    }
  }, [scanStatus]);

  return (
    <RequireRole allowed="POLICE_VERIFIER">
      <div style={pageStyle}>
        <style>{`
          @keyframes scannerPulse {
            0% { top: 18%; opacity: 0; }
            10% { opacity: 1; }
            50% { top: 72%; opacity: 1; }
            100% { top: 18%; opacity: 0; }
          }
        `}</style>
        <div style={layoutStyle}>
          <div style={topBarStyle}>
            <div style={topBarBrandStyle}>
              <Image
                src="/RNP_LOGO.png"
                alt="Rwanda National Police"
                width={60}
                height={60}
                priority
                style={brandLogoStyle}
              />
              <div style={brandTextStyle}>
                <span style={brandSubtitleStyle}>Rwanda National Police</span>
                <div style={brandTitleRowStyle}>
                  <span style={brandTitleStyle}>Umuganda Pass Verifier</span>
                  <span style={roleBadgeStyle}>{formatRoleLabel(session.user?.role)}</span>
                </div>
              </div>
            </div>
            <div style={topBarRightStyle}>
              <div style={topBarButtonsStyle}>
                {cameraActive ? (
                  <button type="button" style={buttonStyle('ghost')} onClick={stopCamera}>
                    <IconPlayerStop size={16} style={{ marginRight: '0.35rem' }} /> Pause camera
                  </button>
                ) : (
                <button type="button" style={buttonStyle('primary')} onClick={handleStartCamera}>
                  <IconPlayerPlay size={16} style={{ marginRight: '0.35rem' }} /> Start camera
                </button>
              )}
              <button
                type="button"
                style={buttonStyle('ghost')}
                onClick={handleResetCamera}
                disabled={!cameraActive || scanStatus === 'verifying'}
              >
                <IconRefresh size={16} style={{ marginRight: '0.35rem' }} /> Rescan
              </button>
              <button type="button" style={logoutButtonStyle} onClick={handleLogout}>
                <IconLogout size={16} /> Log out
              </button>
              </div>
              <Image
                src="/sda-logo.png"
                alt="Seventh-day Adventist Church"
                width={72}
                height={72}
                priority
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
          <header style={headingBlockStyle}>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 'clamp(2.2rem, 3vw + 1rem, 3.6rem)', lineHeight: 1.05 }}>
              Scan Umuganda passes instantly.
            </h1>
            <p style={{ margin: 0, maxWidth: '680px', color: 'rgba(11, 31, 51, 0.72)', fontSize: '1.02rem', lineHeight: 1.7 }}>
              Use the secure camera feed below to verify member QR codes in the field. Every scan is auditable and does not expose personal data.
            </p>
          </header>

          <div style={gridStyle}>
            <section style={scannerCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={statusPillStyle(scanStatus)}>
                  <IconCamera size={18} />
                  {statusLabel}
                </div>
              </div>

              <div style={videoWrapperStyle}>
                <video ref={videoRef} style={videoStyle} muted playsInline />
                {cameraActive ? (
                  <>
                    <div style={overlayFrameStyle} />
                    {scanStatus !== 'verifying' && <div style={scanLineStyle} />}
                  </>
                ) : (
                  <div style={cameraIdleOverlayStyle}>
                    <IconCamera size={48} />
                    <strong style={{ fontSize: '1.05rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Camera paused</strong>
                    <p style={{ margin: 0, maxWidth: '260px', lineHeight: 1.6 }}>
                      When ready, start the camera to begin scanning QR passes.
                    </p>
                  </div>
                )}
              </div>

              {cameraError && (
                <div style={feedbackCardStyle('error')}>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <IconAlertTriangle size={20} /> Camera unavailable
                  </strong>
                  <p style={{ margin: 0, lineHeight: 1.55 }}>{cameraError}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(11, 31, 51, 0.62)' }}>
                    Check browser permissions or switch to manual token entry below.
                  </p>
                </div>
              )}

              {/* Modal for feedback */}
              <style jsx global>{`
                @keyframes fadeIn {
                  from { opacity: 0; }
                  to { opacity: 1; }
                }
                @keyframes slideUp {
                  from { 
                    opacity: 0;
                    transform: translateY(20px);
                  }
                  to { 
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
                @keyframes scaleIn {
                  from { 
                    opacity: 0;
                    transform: scale(0.8);
                  }
                  to { 
                    opacity: 1;
                    transform: scale(1);
                  }
                }
                @keyframes pulseSuccess {
                  0% { 
                    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
                    transform: scale(1);
                  }
                  70% { 
                    box-shadow: 0 0 0 15px rgba(16, 185, 129, 0);
                    transform: scale(1.05);
                  }
                  100% { 
                    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
                    transform: scale(1);
                  }
                }
                @keyframes pulseError {
                  0% { 
                    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
                    transform: scale(1);
                  }
                  70% { 
                    box-shadow: 0 0 0 15px rgba(239, 68, 68, 0);
                    transform: scale(1.05);
                  }
                  100% { 
                    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
                    transform: scale(1);
                  }
                }
                @keyframes iconBounce {
                  0%, 100% { transform: translateY(0); }
                  50% { transform: translateY(-5px); }
                }
              `}</style>
              {isModalOpen && feedback && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000,
                  padding: '1rem',
                  opacity: 0,
                  animation: 'fadeIn 0.3s ease-out forwards',
                  backdropFilter: 'blur(4px)',
                }}>
                  <div style={{
                    backgroundColor: 'white',
                    borderRadius: '20px',
                    padding: '2.5rem 2rem',
                    maxWidth: '500px',
                    width: '100%',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
                    textAlign: 'center',
                    opacity: 0,
                    transform: 'translateY(20px)',
                    animation: 'slideUp 0.4s 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                    border: `1px solid ${feedback.variant === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                  }}>
                    <div style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: '50%',
                      backgroundColor: feedback.variant === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 1.75rem',
                      position: 'relative',
                      animation: feedback.variant === 'success' ? 'pulseSuccess 2s infinite' : 'pulseError 2s infinite',
                    }}>
                      <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        backgroundColor: feedback.variant === 'success' ? '#e6f7ed' : '#fde8e8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'scaleIn 0.4s 0.2s cubic-bezier(0.36, 0, 0.66, -0.56) both',
                      }}>
                        {feedback.variant === 'success' ? (
                          <IconShieldCheck 
                            size={42} 
                            color="#10b981" 
                            style={{
                              animation: 'iconBounce 0.6s 0.4s ease-in-out',
                            }} 
                          />
                        ) : (
                          <IconAlertTriangle 
                            size={42} 
                            color="#ef4444" 
                            style={{
                              animation: 'iconBounce 0.6s 0.4s ease-in-out',
                            }} 
                          />
                        )}
                      </div>
                    </div>
                    <h2 style={{
                      margin: '0 0 1rem',
                      fontSize: '1.5rem',
                      fontWeight: 600,
                      color: feedback.variant === 'success' ? '#065f46' : '#991b1b',
                    }}>
                      {feedback.title}
                    </h2>
                    <p style={{
                      margin: '0 0 1.5rem',
                      fontSize: '1.1rem',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-line',
                      color: '#1f2937',
                    }}>
                      {feedback.message}
                    </p>
                    {feedback.variant === 'success' && feedback.details && (
                      <div style={{
                        backgroundColor: '#f9fafb',
                        borderRadius: '12px',
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        textAlign: 'left',
                      }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '100px 1fr',
                          gap: '0.75rem',
                          fontSize: '0.95rem',
                        }}>
                          <span style={{ color: '#6b7280' }}>Church:</span>
                          <span style={{ fontWeight: 500 }}>{feedback.details.churchName}</span>
                          
                          <span style={{ color: '#6b7280' }}>Session:</span>
                          <span>{feedback.details.sessionDate}</span>
                          
                          <span style={{ color: '#6b7280' }}>Issued:</span>
                          <span>{feedback.details.issuedAt}</span>
                          
                          <span style={{ color: '#6b7280' }}>Pass ID:</span>
                          <code style={{
                            fontFamily: 'var(--font-mono, monospace)',
                            backgroundColor: '#e5e7eb',
                            padding: '0.2rem 0.4rem',
                            borderRadius: '4px',
                            fontSize: '0.85em',
                            wordBreak: 'break-all',
                          }}>
                            {feedback.details.passId}
                          </code>
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setIsModalOpen(false);
                        // Reset feedback if it's an error to allow rescanning
                        if (feedback?.variant === 'error') {
                          setFeedback(null);
                        }
                      }}
                      style={{
                        backgroundColor: feedback.variant === 'success' ? '#10b981' : '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.75rem 1.5rem',
                        fontSize: '1rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        minWidth: '120px',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = feedback.variant === 'success' ? '#059669' : '#dc2626';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = feedback.variant === 'success' ? '#10b981' : '#ef4444';
                      }}
                    >
                      {feedback.variant === 'success' ? 'Continue' : 'Try Again'}
                    </button>
                  </div>
                </div>
              )}

              <form style={manualFormStyle} onSubmit={handleManualSubmit}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: '0.95rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#184c8c' }}>
                    Manual token entry
                  </strong>
                  <span style={{ fontSize: '0.82rem', color: 'rgba(11, 31, 51, 0.54)' }}>Paste the pass token if scanning fails.</span>
                </div>
                <input
                  value={manualToken}
                  onChange={(event) => setManualToken(event.target.value)}
                  placeholder="Paste token from QR payload"
                  style={inputStyle}
                />
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button type="submit" style={buttonStyle('primary')} disabled={!manualToken.trim() || manualSubmitting}>
                    {manualSubmitting ? 'Checking…' : 'Verify token'}
                  </button>
                  <button type="button" style={buttonStyle('ghost')} onClick={() => setManualToken('')}>
                    Clear
                  </button>
                </div>
              </form>
            </section>

            <aside style={instructionCardStyle}>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.8rem' }}>Field protocol</h2>
                <p style={{ margin: 0, color: 'rgba(11, 31, 51, 0.7)', lineHeight: 1.65 }}>
                  Present the QR code inside the frame. The scanner automatically attempts verification and provides immediate feedback.
                </p>
              </div>
              <ol style={listStyle}>
                {[
                  'Ensure the device camera lens is clean and pointed directly at the QR code.',
                  'Hold steady until you see a success or failure response.',
                  'If a pass fails, confirm the member data and escalate to church administration.',
                ].map((step) => (
                  <li key={step} style={{ display: 'flex', gap: '0.7rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#2f98d0', marginTop: '0.4rem' }} />
                    <span style={{ lineHeight: 1.6 }}>{step}</span>
                  </li>
                ))}
              </ol>
              <div style={{ background: 'rgba(47, 152, 208, 0.12)', borderRadius: '18px', padding: '1.1rem 1.25rem', border: '1px solid rgba(47, 152, 208, 0.22)', display: 'grid', gap: '0.45rem' }}>
                <strong style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#184c8c' }}>Escalation</strong>
                <p style={{ margin: 0, color: 'rgba(11, 31, 51, 0.68)', lineHeight: 1.6 }}>
                  For tampered or suspicious passes, notify the supervising district pastor and record the incident. All scans are logged for audit purposes.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </RequireRole>
  );
};

export default PoliceVerifyPage;
