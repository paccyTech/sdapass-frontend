'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { IconCalendarEvent, IconQrcode } from '@tabler/icons-react';

import RequireRole from '@/components/RequireRole';
import { RoleHero } from '@/components/dashboard/RoleHero';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';
import { Button } from '@/components/ui/button';
import { useAuthSession } from '@/hooks/useAuthSession';
import { fetchUmugandaEvents, type UmugandaEventSummary } from '@/lib/api';
import { format } from 'date-fns';

const pageContainer: CSSProperties = {
  display: 'grid',
  gap: '2rem',
  padding: '1.5rem',
  width: '100%',
};

const cardStyle: CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '8px',
  border: '1px solid var(--surface-border)',
  padding: '1.5rem',
};

const cardHoverStyle: CSSProperties = {
  transform: 'translateY(-2px)',
  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
};

const sectionTitleStyle: CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  color: 'var(--shell-foreground)',
  marginBottom: '1rem',
};

const eventGrid: CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
};

const eventCardStyle: CSSProperties = {
  ...cardStyle,
  transition: 'all 0.2s ease',
};

const eventHeader: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '1rem',
  marginBottom: '1rem',
};

const eventTitle: CSSProperties = {
  fontSize: '1.125rem',
  fontWeight: 600,
  color: 'var(--shell-foreground)',
};

const eventMeta: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  color: 'var(--muted)',
  fontSize: '0.875rem',
  marginTop: '0.25rem',
};

const eventStats: CSSProperties = {
  textAlign: 'right',
};

const eventStatsValue: CSSProperties = {
  fontSize: '1.75rem',
  fontWeight: 700,
  color: 'var(--shell-foreground)',
};

const eventStatsLabel: CSSProperties = {
  fontSize: '0.875rem',
  color: 'var(--muted)',
};

const buttonContainer: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
};

const loadingCard: CSSProperties = {
  ...cardStyle,
  display: 'grid',
  placeItems: 'center',
  padding: '2rem',
  color: 'var(--muted)',
  fontSize: '0.95rem',
};

const errorCard: CSSProperties = {
  ...cardStyle,
  display: 'grid',
  placeItems: 'center',
  padding: '2rem',
  color: 'var(--danger)',
  fontSize: '0.95rem',
};

const emptyCard: CSSProperties = {
  ...cardStyle,
  display: 'grid',
  placeItems: 'center',
  padding: '2rem',
  color: 'var(--muted)',
  fontSize: '0.95rem',
};

const splitEvents = (events: UmugandaEventSummary[]) => {
  const now = new Date();

  const parsed = events
    .map((event) => ({ ...event, parsedDate: new Date(event.date) }))
    .filter((event) => !Number.isNaN(event.parsedDate.getTime()))
    .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());

  const upcoming: typeof parsed = [];
  const past: typeof parsed = [];

  parsed.forEach((event) => {
    if (event.parsedDate >= now) {
      upcoming.push(event);
    } else {
      past.push(event);
    }
  });

  upcoming.sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

  return { upcoming, past };
};

const ChurchUmugandaEventsPage = () => {
  const session = useAuthSession();
  const [events, setEvents] = useState<UmugandaEventSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session.token) {
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    fetchUmugandaEvents(session.token)
      .then((data) => {
        if (!active) {
          return;
        }
        setEvents(data);
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Unable to load events.';
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
  }, [session.token]);

  const { upcoming, past } = useMemo(() => splitEvents(events), [events]);

  const heroStats = useMemo(
    () => [
      { label: 'Upcoming Events', value: String(upcoming.length), trend: 'Ready for check-in' },
      { label: 'Past Events', value: String(past.length), trend: 'History' },
      {
        label: 'Next Event',
        value: upcoming[0]?.parsedDate ? format(upcoming[0].parsedDate, 'MMM d, yyyy') : '—',
        trend: upcoming[0]?.theme ?? 'No upcoming events',
      },
    ],
    [past.length, upcoming],
  );

  const shellConfig = useMemo(
    () => ({
      hero: (
        <RoleHero
          role="CHURCH_ADMIN"
          headline="Umuganda Events"
          subheadline="View union-wide Umuganda events and scan member QR codes to record attendance for your church."
          stats={heroStats}
        />
      ),
    }),
    [heroStats],
  );

  useDashboardShellConfig(shellConfig);

  const renderSection = (title: string, items: Array<UmugandaEventSummary & { parsedDate: Date }>) => (
    <section style={{ display: 'grid', gap: '1rem' }}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      <div style={eventGrid}>
        {items.map((event) => (
          <div key={event.id} style={eventCardStyle}>
            <div style={eventHeader}>
              <div>
                <div style={eventTitle}>{event.theme}</div>
                <div style={eventMeta}>
                  <IconCalendarEvent style={{ width: '1rem', height: '1rem', marginRight: '0.5rem', color: '#f59e0b' }} />
                  <span style={{ backgroundColor: '#3b82f6', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '12px', fontWeight: 600, fontSize: '0.75rem' }}>{format(event.parsedDate, 'MMMM d, yyyy')}</span>
                  <span style={{ color: '#10b981', marginLeft: '0.5rem', backgroundColor: '#10b981', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '12px', fontStyle: 'italic', fontSize: '0.75rem' }}>{event.location ?? 'TBA'}</span>
                </div>
              </div>
              <div style={eventStats}>
                <div style={eventStatsValue}>{event._count?.attendance ?? 0}</div>
                <div style={eventStatsLabel}>Checked-in</div>
              </div>
            </div>
            <div style={buttonContainer}>
              <Button asChild style={{ color: '#f59e0b' }}>
                <Link href={`/church/umuganda-events/${event.id}/scan`}>
                  <IconQrcode style={{ marginRight: '0.5rem', width: '1rem', height: '1rem' }} />
                  Scan attendance
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <RequireRole allowed="CHURCH_ADMIN">
      <div style={pageContainer}>
        {loading && (
          <div style={loadingCard}>Loading events…</div>
        )}
        {error && (
          <div style={errorCard}>{error}</div>
        )}
        {!loading && !error && events.length === 0 && (
          <div style={emptyCard}>No Umuganda events available.</div>
        )}

        {!loading && !error && events.length > 0 && (
          <div style={{ display: 'grid', gap: '2.5rem' }}>
            {renderSection('Upcoming events', upcoming)}
            {past.length > 0 ? renderSection('Past events', past) : null}
          </div>
        )}
      </div>
    </RequireRole>
  );
};

export default ChurchUmugandaEventsPage;
