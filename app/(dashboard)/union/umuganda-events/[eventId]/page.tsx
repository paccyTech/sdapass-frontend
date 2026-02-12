'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { IconCalendarEvent, IconChevronLeft, IconMapPin } from '@tabler/icons-react';
import { format } from 'date-fns';

import RequireRole from '@/components/RequireRole';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthSession } from '@/hooks/useAuthSession';
import { fetchUmugandaEvents, type UmugandaEventSummary } from '@/lib/api';

export default function UnionUmugandaEventDetailPage() {
  const params = useParams<{ eventId: string }>();
  const { token } = useAuthSession();

  const eventId = params?.eventId;

  const [event, setEvent] = useState<UmugandaEventSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shellConfig = useMemo(
    () => ({
      hero: null,
    }),
    [],
  );

  useDashboardShellConfig(shellConfig);

  useEffect(() => {
    if (!token || !eventId) {
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    fetchUmugandaEvents(token)
      .then((events) => {
        if (!active) {
          return;
        }
        const found = events.find((item) => item.id === eventId) ?? null;
        setEvent(found);
        if (!found) {
          setError('Umuganda event not found.');
        }
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Unable to load event.';
        setError(message);
      })
      .finally(() => {
        if (!active) {
          return;
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [eventId, token]);

  const eventDate = useMemo(() => {
    if (!event?.date) {
      return null;
    }
    const parsed = new Date(event.date);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [event?.date]);

  return (
    <RequireRole allowed="UNION_ADMIN">
      <div style={{
        display: 'grid',
        gap: '2rem',
        padding: '1.5rem',
        width: '100%',
        background: 'white',
        margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <Button variant="outline" asChild style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>
            <Link href="/union/umuganda-events">
              <IconChevronLeft className="mr-2 h-4 w-4" />
              Back to events
            </Link>
          </Button>

          {event && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="outline" asChild style={{ borderColor: '#10b981', color: '#10b981' }}>
                <Link href={`/union/umuganda-events/${event.id}/attendance`}>View Attendance</Link>
              </Button>
            </div>
          )}
        </div>

        {loading && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--surface-border)', padding: '1rem' }}>
            <div style={{ padding: '2rem 0', color: 'var(--muted)', textAlign: 'center' }}>Loading event…</div>
          </div>
        )}

        {error && !loading && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--surface-border)', padding: '1rem' }}>
            <div style={{ padding: '2rem 0', color: 'var(--danger)', textAlign: 'center' }}>{error}</div>
          </div>
        )}

        {event && !loading && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--surface-border)', padding: '1rem' }}>
            <div style={{ paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--shell-foreground)', marginBottom: '0.5rem' }}>{event.theme}</h3>
              <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <IconCalendarEvent style={{ width: '1rem', height: '1rem' }} />
                  <span>{eventDate ? format(eventDate, 'MMMM d, yyyy') : event.date}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <IconMapPin style={{ width: '1rem', height: '1rem' }} />
                  <span>{event.location ?? 'TBA'}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                <div style={{ borderRadius: '8px', border: '1px solid var(--surface-border)', padding: '1rem', backgroundColor: 'white' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Union</div>
                  <div style={{ fontWeight: 600, color: 'var(--shell-foreground)' }}>{event.union?.name ?? event.unionId}</div>
                </div>
                <div style={{ borderRadius: '8px', border: '1px solid var(--surface-border)', padding: '1rem', backgroundColor: 'white' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Created by</div>
                  <div style={{ fontWeight: 600, color: 'var(--shell-foreground)' }}>
                    {[event.createdBy?.firstName, event.createdBy?.lastName].filter(Boolean).join(' ') || event.createdById}
                  </div>
                </div>
                <div style={{ borderRadius: '8px', border: '1px solid var(--surface-border)', padding: '1rem', backgroundColor: 'white' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Total check-ins</div>
                  <div style={{ fontWeight: 600, color: 'var(--shell-foreground)' }}>{event._count?.attendance ?? 0}</div>
                </div>
              </div>

              <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                Event ID: <span style={{ fontFamily: 'monospace' }}>{event.id}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireRole>
  );
}
