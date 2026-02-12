'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import {
  IconAlertTriangle,
  IconCamera,
  IconPlayerPlay,
  IconPlayerStop,
  IconRefresh,
  IconChevronLeft,
  IconQrcode,
  IconUserPlus,
} from '@tabler/icons-react';

import RequireRole from '@/components/RequireRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthSession } from '@/hooks/useAuthSession';
import { checkInToUmugandaEvent, fetchUmugandaEventById, type UmugandaEventSummary } from '@/lib/api';

const pageContainer: CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
  padding: '1.5rem',
  width: '100%',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1rem',
  flexWrap: 'wrap',
};

const backButton: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const titleStyle: CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 600,
  color: 'var(--shell-foreground)',
};

const subtitleStyle: CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--muted)',
};

const buttonGroup: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
};

const cardStyle: CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '12px',
  border: '1px solid var(--surface-border)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
};

const cardHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '1.5rem 1.5rem 0',
};

const cardTitle: CSSProperties = {
  fontSize: '1.125rem',
  fontWeight: 600,
  color: 'var(--shell-foreground)',
};

const cardContent: CSSProperties = {
  padding: '1.5rem',
  display: 'grid',
  gap: '1rem',
};

const videoContainer: CSSProperties = {
  position: 'relative',
  width: '100%',
  overflow: 'hidden',
  borderRadius: '12px',
  backgroundColor: '#0f172a',
  boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
};

const videoStyle: CSSProperties = {
  width: '100%',
  height: '400px',
  objectFit: 'cover',
};

const overlayStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  color: '#e2e8f0',
  backgroundColor: 'rgba(15, 23, 42, 0.4)',
};

const overlayIcon: CSSProperties = {
  width: '3rem',
  height: '3rem',
  margin: '0 auto',
};

const overlayText: CSSProperties = {
  fontWeight: 600,
};

const overlaySubtext: CSSProperties = {
  fontSize: '0.875rem',
  color: '#cbd5e1',
};

const errorAlert: CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
  padding: '1rem',
  borderRadius: '8px',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  color: 'var(--danger)',
};

const successAlert: CSSProperties = {
  padding: '1rem',
  borderRadius: '8px',
  border: '1px solid rgba(16, 185, 129, 0.3)',
  backgroundColor: 'rgba(16, 185, 129, 0.1)',
  color: '#065f46',
};

const formStyle: CSSProperties = {
  display: 'grid',
  gap: '0.5rem',
};

const formLabel: CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: 600,
  color: 'var(--shell-foreground)',
};

const formRow: CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

type ScanStatus = 'idle' | 'scanning' | 'checking_in';

type FeedbackState =
  | {
      variant: 'success' | 'error';
      title: string;
      message: string;
    }
  | null;

const resetScanner = (reader: BrowserMultiFormatReader) => {
  (reader as unknown as { reset?: () => void }).reset?.();
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
  } catch {
    // ignore
  }

  return trimmed;
};

export default function ChurchUmugandaScanPage() {
  const router = useRouter();
  const params = useParams<{ eventId: string }>();
  const session = useAuthSession();

  const eventId = params?.eventId;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const processingRef = useRef(false);
  const lastTokenRef = useRef<string | null>(null);

  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualToken, setManualToken] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [event, setEvent] = useState<UmugandaEventSummary | null>(null);

  const canScan = Boolean(session.token) && typeof eventId === 'string' && Boolean(eventId);

  const checkIn = useCallback(
    async (raw: string, options: { force?: boolean } = {}) => {
      if (!session.token) {
        setFeedback({
          variant: 'error',
          title: 'Session expired',
          message: 'Sign in again to continue scanning.',
        });
        return;
      }

      if (!eventId) {
        setFeedback({
          variant: 'error',
          title: 'Missing event',
          message: 'Unable to resolve the event for this scan.',
        });
        return;
      }

      const token = extractToken(raw);
      if (!token) {
        setFeedback({
          variant: 'error',
          title: 'Unreadable QR code',
          message: 'We could not extract a member token from the QR code.',
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
      setScanStatus('checking_in');
      setFeedback(null);

      try {
        const attendance = await checkInToUmugandaEvent(session.token, eventId, token);
        const memberName = `${attendance.member.firstName} ${attendance.member.lastName}`.trim();
        const nationalId = attendance.member.nationalId ? ` (${attendance.member.nationalId})` : '';
        setFeedback({
          variant: 'success',
          title: 'Attendance recorded',
          message: `${memberName}${nationalId}`,
        });
        lastTokenRef.current = token;
      } catch (error) {
        const status =
          typeof error === 'object' && error && 'status' in error
            ? (error as { status?: number }).status
            : undefined;
        const message = error instanceof Error ? error.message : 'Unable to record attendance right now.';
        setFeedback({
          variant: 'error',
          title: status === 409 ? 'Already checked in' : 'Check-in failed',
          message: status === 409 ? 'Attendance already recorded for this member.' : message,
        });
      } finally {
        processingRef.current = false;
        setScanStatus(cameraActive ? 'scanning' : 'idle');
      }
    },
    [cameraActive, eventId, session.token],
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
          checkIn(result.getText());
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
  }, [checkIn]);

  useEffect(() => {
    if (!canScan || !videoRef.current || !cameraActive) {
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
  }, [cameraActive, canScan, startCamera]);

  useEffect(() => {
    if (eventId && session.token) {
      fetchUmugandaEventById(session.token, eventId).then(setEvent).catch(() => setEvent(null));
    }
  }, [eventId, session.token]);

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    processingRef.current = false;
    setScanStatus('idle');
    setCameraActive(false);
  }, []);

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
      await checkIn(manualToken, { force: true });
      setManualSubmitting(false);
      setManualToken('');
    },
    [checkIn, manualToken],
  );

  const statusLabel = useMemo(() => {
    switch (scanStatus) {
      case 'checking_in':
        return 'Recording attendance…';
      case 'scanning':
        return 'Camera active — present QR code';
      default:
        return 'Camera inactive';
    }
  }, [scanStatus]);

  if (!eventId) {
    return (
      <RequireRole allowed="CHURCH_ADMIN">
        <div style={cardStyle}>
          <div style={{ padding: '2rem', color: 'var(--danger)', textAlign: 'center' }}>Missing event ID.</div>
        </div>
      </RequireRole>
    );
  }

  return (
    <RequireRole allowed="CHURCH_ADMIN">
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={pageContainer}>
        <div style={headerStyle}>
          <Button variant="ghost" asChild style={{ ...backButton, color: '#3b82f6' }}>
            <Link href="/church/umuganda-events">
              <IconChevronLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
              Back
            </Link>
          </Button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={titleStyle}>Scan attendance</h1>
            <p style={subtitleStyle}>Event Name: {event ? event.theme : 'Loading...'}</p>
          </div>
          <div style={buttonGroup}>
            {cameraActive ? (
              <Button onClick={stopCamera} disabled={scanStatus === 'checking_in'} style={{ backgroundColor: 'transparent', color: '#f59e0b', border: '1px solid #f59e0b', borderRadius: '8px', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)', transition: 'all 0.2s' }}>
                <IconPlayerStop style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Stop camera
              </Button>
            ) : (
              <Button onClick={handleStartCamera} disabled={!canScan} style={{ backgroundColor: 'transparent', color: '#f59e0b', border: '1px solid #f59e0b', borderRadius: '8px', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)', transition: 'all 0.2s' }}>
                <IconPlayerPlay style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                Start camera
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleResetCamera}
              disabled={!cameraActive || scanStatus === 'checking_in'}
              style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)', transition: 'all 0.2s' }}
            >
              <IconRefresh style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
              Rescan
            </Button>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardHeader}>
            <IconCamera style={{ width: '1.25rem', height: '1.25rem' }} />
            <h2 style={cardTitle}>{statusLabel}</h2>
          </div>
          <div style={cardContent}>
            <div style={videoContainer}>
              <video ref={videoRef} style={videoStyle} muted playsInline />
              {!cameraActive && (
                <div style={overlayStyle}>
                  <div style={{ display: 'grid', gap: '0.5rem', textAlign: 'center' }}>
                    <IconQrcode style={overlayIcon} />
                    <strong style={overlayText}>Camera paused</strong>
                    <span style={overlaySubtext}>Start the camera to scan member QR codes.</span>
                  </div>
                </div>
              )}
            </div>

            {cameraError && (
              <div style={errorAlert}>
                <IconAlertTriangle style={{ width: '1.25rem', height: '1.25rem', marginTop: '0.125rem' }} />
                <div>
                  <div style={{ fontWeight: 600 }}>Camera unavailable</div>
                  <div style={{ fontSize: '0.875rem' }}>{cameraError}</div>
                </div>
              </div>
            )}

            {feedback && (
              <div style={feedback.variant === 'success' ? successAlert : errorAlert}>
                <div style={{ fontWeight: 600 }}>{feedback.title}</div>
                <div style={{ fontSize: '0.875rem', marginTop: '0.25rem', whiteSpace: 'pre-line' }}>{feedback.message}</div>
              </div>
            )}

            <div style={{
              marginTop: '1.5rem',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, var(--surface-primary) 0%, rgba(59, 130, 246, 0.05) 100%)',
              borderRadius: '16px',
              border: '1px solid rgba(59, 130, 246, 0.15)',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                }}>
                  <IconQrcode size={16} style={{ color: 'white' }} />
                </div>
                <div>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--shell-foreground)',
                    letterSpacing: '-0.01em',
                  }}>
                    Manual Token Entry
                  </h3>
                  <p style={{
                    margin: '0.25rem 0 0',
                    fontSize: '0.85rem',
                    color: 'var(--muted)',
                    lineHeight: 1.4,
                  }}>
                    Paste or type a member token for manual check-in
                  </p>
                </div>
              </div>

              <form onSubmit={handleManualSubmit} style={{
                display: 'grid',
                gap: '1rem',
              }}>
                <div style={{
                  position: 'relative',
                }}>
                  <Input
                    value={manualToken}
                    onChange={(event) => setManualToken(event.target.value)}
                    placeholder="Enter member token..."
                    style={{
                      width: '100%',
                      padding: '1rem 1.25rem',
                      borderRadius: '12px',
                      border: '2px solid rgba(59, 130, 246, 0.2)',
                      background: 'white',
                      fontSize: '0.95rem',
                      fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.5px',
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6';
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(59, 130, 246, 0.2)';
                      e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
                    }}
                  />
                  {manualToken && (
                    <button
                      type="button"
                      onClick={() => setManualToken('')}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  justifyContent: 'flex-end',
                }}>
                  <Button
                    type="submit"
                    disabled={!manualToken.trim() || manualSubmitting}
                    style={{
                      padding: '0.875rem 1.5rem',
                      borderRadius: '12px',
                      border: 'none',
                      background: manualToken.trim() && !manualSubmitting
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'rgba(156, 163, 175, 0.5)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '0.95rem',
                      cursor: manualToken.trim() && !manualSubmitting ? 'pointer' : 'not-allowed',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.2s ease',
                      boxShadow: manualToken.trim() && !manualSubmitting
                        ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                        : 'none',
                      minWidth: '120px',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      if (manualToken.trim() && !manualSubmitting) {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (manualToken.trim() && !manualSubmitting) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                      }
                    }}
                  >
                    {manualSubmitting ? (
                      <>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          borderTop: '2px solid white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                        }} />
                        Checking…
                      </>
                    ) : (
                      <>
                        <IconUserPlus size={16} />
                        Check In
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
