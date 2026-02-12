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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  background: '#ffffff',
  padding: 'clamp(1.5rem, 4vw, 2rem) clamp(0.75rem, 3vw, 3rem)',
  display: 'flex',
  justifyContent: 'center',
};

const layoutStyle: CSSProperties = {
  width: 'min(100%, 1200px)',
  margin: '0 auto',
  display: 'grid',
  gap: 'clamp(1rem, 2.5vw, 1.5rem)',
};

const topBarStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 'clamp(0.5rem, 2vw, 0.75rem)',
  rowGap: '0.75rem',
  padding: 'clamp(1rem, 2vw, 1.4rem)',
  borderRadius: '16px',
  border: '1px solid rgba(15, 51, 92, 0.12)',
  background: 'linear-gradient(120deg, rgba(255, 255, 255, 0.82), rgba(238, 243, 255, 0.88))',
  boxShadow: '0 22px 44px rgba(11, 31, 51, 0.12)',
  backdropFilter: 'blur(12px)',
  flexWrap: 'wrap',
};

const topBarBrandStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
  minWidth: 0,
  flex: '1 1 300px',
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
  borderRadius: '20px',
  overflow: 'hidden',
  background: 'linear-gradient(145deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
  minHeight: 'clamp(280px, 45vw, 400px)',
  display: 'grid',
  placeItems: 'center',
  boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.1), 0 8px 32px rgba(0, 0, 0, 0.3)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
};

const videoStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  filter: 'brightness(1.1) contrast(1.05)',
};

const cameraIdleOverlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  textAlign: 'center',
  padding: '2.5rem',
  color: 'rgba(255, 255, 255, 0.95)',
  background: 'linear-gradient(145deg, rgba(10, 10, 10, 0.9) 0%, rgba(20, 20, 20, 0.8) 50%, rgba(10, 10, 10, 0.9) 100%)',
  gap: '1.5rem',
  backdropFilter: 'blur(8px)',
};

const overlayFrameStyle: CSSProperties = {
  position: 'absolute',
  left: '18%',
  right: '18%',
  top: '18%',
  bottom: '18%',
  border: '3px solid rgba(255,255,255,0.85)',
  borderRadius: '20px',
  boxShadow:
    '0 0 0 2px rgba(255,255,255,0.2), ' +
    '0 0 0 6px rgba(255,255,255,0.1), ' +
    'inset 0 0 0 1px rgba(255,255,255,0.3)',
  pointerEvents: 'none',
  animation: 'scanPulse 3s ease-in-out infinite',
};

const scanLineStyle: CSSProperties = {
  position: 'absolute',
  left: '20%',
  right: '20%',
  height: '4px',
  background: 'linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.9), transparent)',
  animation: 'scanMove 2.5s ease-in-out infinite',
  pointerEvents: 'none',
  boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
  borderRadius: '2px',
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
    console.log('startCamera called');
    if (!videoRef.current) {
      console.log('videoRef.current is null');
      return;
    }

    controlsRef.current?.stop();
    controlsRef.current = null;

    setScanStatus('scanning');
    setCameraError(null);

    try {
      console.log('requesting camera permission');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      console.log('camera permission granted, stream:', stream);
      // Stop the stream since ZXing will handle it
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.log('camera permission denied', error);
      setCameraError('Camera access denied. Please allow camera permissions and try again.');
      setCameraActive(false);
      setScanStatus('idle');
      return;
    }

    const reader = new BrowserMultiFormatReader();
    console.log('created reader');

    try {
      console.log('calling decodeFromVideoDevice');
      await reader.decodeFromVideoDevice(undefined, videoRef.current, (result, error, controls) => {
        console.log('decode callback', { result, error, controls });
        if (controls) {
          controlsRef.current = controls;
        }

        if (result) {
          console.log('result found', result.getText());
          verifyToken(result.getText());
        }

        if (error && error.name !== 'NotFoundException') {
          console.log('error in callback', error);
          setCameraError('Camera error: ' + error.message);
        }
      });
      console.log('decodeFromVideoDevice resolved');
    } catch (error) {
      console.log('decodeFromVideoDevice threw error', error);
      resetScanner(reader);
      throw error;
    }

    return () => {
      console.log('cleanup function called');
      resetScanner(reader);
    };
  }, [verifyToken]);

  useEffect(() => {
    console.log('useEffect cameraActive:', cameraActive, 'isAuthReady:', isAuthReady, 'videoRef.current:', videoRef.current);
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
    console.log('calling startCamera');
    startCamera()
      .then((fn) => {
        console.log('startCamera resolved');
        cleanup = fn;
      })
      .catch((error) => {
        console.log('startCamera error:', error);
        const message = error instanceof Error ? error.message : 'Unable to access camera';
        setCameraError(message);
        setCameraActive(false);
        setScanStatus('idle');
      });

    return () => {
      console.log('cleanup called');
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
    alert('Start camera clicked');
    console.log('handleStartCamera called');
    lastTokenRef.current = null;
    processingRef.current = false;
    setFeedback(null);
    setCameraError(null);
    setIsModalOpen(false);
    setCameraActive(true);
    console.log('setCameraActive to true');
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
        <div style={layoutStyle}>
          {/* RNP Branding Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem 2rem',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)',
          }}>
            <Image
              src="/RNP_LOGO.png"
              alt="Rwanda National Police Logo"
              width={48}
              height={48}
              style={{
                objectFit: 'contain',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '0.25rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            />
            <div style={{
              display: 'grid',
              gap: '0.25rem',
              textAlign: 'center',
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#1e40af',
                letterSpacing: '-0.01em',
              }}>
                Rwanda National Police
              </h3>
              <p style={{
                margin: 0,
                fontSize: '0.85rem',
                color: '#6b7280',
                fontWeight: 500,
              }}>
                Pass Verification System
              </p>
            </div>
          </div>

          {/* Control Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '1.5rem',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.05)',
          }}>
            {/* Status indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '12px',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: scanStatus === 'scanning' ? '#10b981' : scanStatus === 'verifying' ? '#f59e0b' : '#6b7280',
                animation: scanStatus === 'scanning' ? 'pulse 2s infinite' : 'none',
              }} />
              <span>{statusLabel}</span>
            </div>

            {/* Control buttons */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {!cameraActive ? (
                <button
                  onClick={handleStartCamera}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.625rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)';
                  }}
                >
                  <IconPlayerPlay style={{ width: '1rem', height: '1rem' }} />
                  Start camera
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  disabled={scanStatus === 'verifying'}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.625rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: scanStatus === 'verifying' ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    opacity: scanStatus === 'verifying' ? 0.6 : 1,
                    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                  }}
                  onMouseEnter={(e) => {
                    if (scanStatus !== 'verifying') {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (scanStatus !== 'verifying') {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.2)';
                    }
                  }}
                >
                  <IconPlayerStop style={{ width: '1rem', height: '1rem' }} />
                  Stop camera
                </button>
              )}

              <button
                onClick={handleResetCamera}
                disabled={!cameraActive || scanStatus === 'verifying'}
                style={{
                  backgroundColor: (!cameraActive || scanStatus === 'verifying') ? '#f3f4f6' : '#3b82f6',
                  color: (!cameraActive || scanStatus === 'verifying') ? '#9ca3af' : 'white',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '10px',
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: (!cameraActive || scanStatus === 'verifying') ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  opacity: (!cameraActive || scanStatus === 'verifying') ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (cameraActive && scanStatus !== 'verifying') {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (cameraActive && scanStatus !== 'verifying') {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <IconRefresh style={{ width: '1rem', height: '1rem' }} />
                Rescan
              </button>

              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: 'transparent',
                  color: '#6b7280',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: '10px',
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.1)';
                  e.currentTarget.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                <IconLogout style={{ width: '1rem', height: '1rem' }} />
                Log out
              </button>
            </div>
          </div>

          <div style={gridStyle}>
            <Card className="border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconCamera className="h-5 w-5" />
                  {statusLabel}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div style={videoWrapperStyle}>
                  <video ref={videoRef} style={videoStyle} muted playsInline width={640} height={480} />
                  {!cameraActive && (
                    <div style={cameraIdleOverlayStyle}>
                      <div style={{
                        display: 'grid',
                        gap: '1.5rem',
                        textAlign: 'center',
                        alignItems: 'center',
                      }}>
                        <div style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          animation: 'pulse 3s ease-in-out infinite',
                        }}>
                          <IconCamera
                            size={36}
                            color="rgba(255, 255, 255, 0.9)"
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }}
                          />
                        </div>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                          <strong style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: 'rgba(255, 255, 255, 0.95)',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                          }}>
                            Camera Ready
                          </strong>
                          <span style={{
                            fontSize: '1rem',
                            color: 'rgba(255, 255, 255, 0.8)',
                            lineHeight: 1.5,
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                          }}>
                            Click "Start camera" to begin scanning QR codes for pass verification.
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {cameraError && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive flex gap-3">
                    <IconAlertTriangle className="h-5 w-5 mt-0.5" />
                    <div>
                      <div className="font-semibold">Camera unavailable</div>
                      <div className="text-sm">{cameraError}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Check browser permissions or use manual token entry below.
                      </div>
                    </div>
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
                    transform: translateY(30px) scale(0.95);
                  }
                  to { 
                    opacity: 1;
                    transform: translateY(0) scale(1);
                  }
                }
                @keyframes pulseSuccess {
                  0%, 100% {
                    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4), 0 0 0 0 rgba(16, 185, 129, 0.1) inset;
                  }
                  50% {
                    box-shadow: 0 0 0 20px rgba(16, 185, 129, 0), 0 0 0 10px rgba(16, 185, 129, 0.1) inset;
                  }
                }
                @keyframes pulseError {
                  0%, 100% {
                    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4), 0 0 0 0 rgba(239, 68, 68, 0.1) inset;
                  }
                  50% {
                    box-shadow: 0 0 0 20px rgba(239, 68, 68, 0), 0 0 0 10px rgba(239, 68, 68, 0.1) inset;
                  }
                }
                @keyframes iconBounce {
                  0%, 100% { transform: translateY(0) rotate(0deg); }
                  25% { transform: translateY(-8px) rotate(5deg); }
                  50% { transform: translateY(-4px) rotate(-3deg); }
                  75% { transform: translateY(-8px) rotate(2deg); }
                }
                @keyframes shimmer {
                  0% { background-position: -200px 0; }
                  100% { background-position: calc(200px + 100%) 0; }
                }
                .shimmer-bg {
                  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
                  background-size: 200px 100%;
                  animation: shimmer 2s infinite;
                }
                @keyframes pulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.5; }
                }
                @keyframes scanPulse {
                  0%, 100% {
                    opacity: 0.6;
                    transform: scale(1);
                  }
                  50% {
                    opacity: 1;
                    transform: scale(1.02);
                  }
                }
                @keyframes scanMove {
                  0% { top: 20%; }
                  50% { top: 50%; }
                  100% { top: 80%; }
                }
              `}</style>
              {isModalOpen && feedback && (
                <div
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '1rem',
                    animation: 'fadeIn 0.3s ease-out',
                    backdropFilter: 'blur(8px)',
                  }}
                  onClick={() => setIsModalOpen(false)}
                >
                  <div
                    style={{
                      background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%)',
                      borderRadius: '24px',
                      padding: '2.5rem 2rem',
                      maxWidth: '520px',
                      width: '100%',
                      boxShadow: '0 32px 64px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.8)',
                      border: `2px solid ${feedback.variant === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      animation: 'slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Background decoration */}
                    <div
                      className="shimmer-bg"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        pointerEvents: 'none',
                        opacity: 0.3,
                      }}
                    />

                    {/* Close button */}
                    <button
                      onClick={() => setIsModalOpen(false)}
                      style={{
                        position: 'absolute',
                        top: '1.25rem',
                        right: '1.25rem',
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#6b7280',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        zIndex: 1,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      ×
                    </button>

                    {/* Icon container */}
                    <div
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        background: feedback.variant === 'success'
                          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.25))'
                          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.25))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 2rem',
                        position: 'relative',
                        animation: feedback.variant === 'success' ? 'pulseSuccess 2s infinite' : 'pulseError 2s infinite',
                        boxShadow: feedback.variant === 'success'
                          ? '0 0 0 4px rgba(16, 185, 129, 0.1), inset 0 2px 4px rgba(16, 185, 129, 0.1)'
                          : '0 0 0 4px rgba(239, 68, 68, 0.1), inset 0 2px 4px rgba(239, 68, 68, 0.1)',
                      }}
                    >
                      <div
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.9)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backdropFilter: 'blur(10px)',
                          animation: 'scaleIn 0.5s 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        {feedback.variant === 'success' ? (
                          <IconShieldCheck
                            size={44}
                            color="#10b981"
                            style={{
                              animation: 'iconBounce 0.8s 0.4s ease-in-out',
                              filter: 'drop-shadow(0 2px 4px rgba(16, 185, 129, 0.3))',
                            }}
                          />
                        ) : (
                          <IconAlertTriangle
                            size={44}
                            color="#ef4444"
                            style={{
                              animation: 'iconBounce 0.8s 0.4s ease-in-out',
                              filter: 'drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3))',
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <h2
                        style={{
                          margin: '0 0 1.25rem',
                          fontSize: '1.75rem',
                          fontWeight: 700,
                          color: feedback.variant === 'success' ? '#065f46' : '#991b1b',
                          textAlign: 'center',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {feedback.title}
                      </h2>

                      <p
                        style={{
                          margin: '0 0 2rem',
                          fontSize: '1.125rem',
                          lineHeight: 1.6,
                          whiteSpace: 'pre-line',
                          color: '#374151',
                          textAlign: 'center',
                          fontWeight: 400,
                        }}
                      >
                        {feedback.message}
                      </p>

                      {/* Success details */}
                      {feedback.variant === 'success' && feedback.details && (
                        <div
                          style={{
                            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            marginBottom: '2rem',
                            border: '1px solid rgba(0, 0, 0, 0.05)',
                            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.05)',
                          }}
                        >
                          <div
                            style={{
                              display: 'grid',
                              gap: '1rem',
                              fontSize: '0.95rem',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#6b7280', fontWeight: 500 }}>Church:</span>
                              <span style={{ fontWeight: 600, color: '#1f2937' }}>{feedback.details.churchName}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#6b7280', fontWeight: 500 }}>Session:</span>
                              <span style={{ color: '#1f2937' }}>{feedback.details.sessionDate}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: '#6b7280', fontWeight: 500 }}>Issued:</span>
                              <span style={{ color: '#1f2937' }}>{feedback.details.issuedAt}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              <span style={{ color: '#6b7280', fontWeight: 500 }}>Pass ID:</span>
                              <code
                                style={{
                                  fontFamily: 'var(--font-mono, monospace)',
                                  background: 'rgba(0, 0, 0, 0.05)',
                                  padding: '0.5rem 0.75rem',
                                  borderRadius: '8px',
                                  fontSize: '0.85em',
                                  wordBreak: 'break-all',
                                  border: '1px solid rgba(0, 0, 0, 0.1)',
                                  color: '#1f2937',
                                }}
                              >
                                {feedback.details.passId}
                              </code>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Action button */}
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button
                          onClick={() => {
                            setIsModalOpen(false);
                            if (feedback?.variant === 'error') {
                              setFeedback(null);
                            }
                          }}
                          style={{
                            background: feedback.variant === 'success'
                              ? 'linear-gradient(135deg, #10b981, #059669)'
                              : 'linear-gradient(135deg, #ef4444, #dc2626)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '0.875rem 2rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: feedback.variant === 'success'
                              ? '0 8px 24px rgba(16, 185, 129, 0.3)'
                              : '0 8px 24px rgba(239, 68, 68, 0.3)',
                            minWidth: '140px',
                            position: 'relative',
                            overflow: 'hidden',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = feedback.variant === 'success'
                              ? '0 12px 32px rgba(16, 185, 129, 0.4)'
                              : '0 12px 32px rgba(239, 68, 68, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = feedback.variant === 'success'
                              ? '0 8px 24px rgba(16, 185, 129, 0.3)'
                              : '0 8px 24px rgba(239, 68, 68, 0.3)';
                          }}
                        >
                          <span style={{ position: 'relative', zIndex: 1 }}>
                            {feedback.variant === 'success' ? 'Continue Scanning' : 'Try Again'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
                {cameraError && (
                  <div style={feedbackCardStyle('error')}>
                    <IconAlertTriangle className="h-5 w-5 mt-0.5" />
                    <div>
                      <div className="font-semibold">Camera unavailable</div>
                      <div className="text-sm">{cameraError}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Check browser permissions or use manual token entry below.
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleManualSubmit} style={manualFormStyle}>
                  <div className="text-sm font-semibold">Manual token entry</div>
                  <div style={headerButtonRowStyle}>
                    <Input
                      value={manualToken}
                      onChange={(event) => setManualToken(event.target.value)}
                      placeholder="Paste token from QR payload"
                      style={inputStyle}
                    />
                    <Button type="submit" disabled={!manualToken.trim() || manualSubmitting} style={buttonStyle()}>
                      {manualSubmitting ? 'Checking…' : 'Verify token'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setManualToken('')} style={buttonStyle('ghost')}>
                      Clear
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card style={instructionCardStyle}>
              <CardHeader>
                <CardTitle>Field protocol</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>
                  Present the QR code in front of the camera. The verifier will automatically validate and show the result.
                </p>
                <ol style={listStyle}>
                  <li>Ensure the camera lens is clean and pointed directly at the QR code.</li>
                  <li>Hold steady until you see a success or failure response.</li>
                  <li>If a pass fails, confirm the member data and escalate to church administration.</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RequireRole>
  );
};

export default PoliceVerifyPage;
