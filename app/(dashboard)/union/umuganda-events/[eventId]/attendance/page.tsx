'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { IconChevronLeft } from '@tabler/icons-react';

import RequireRole from '@/components/RequireRole';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthSession } from '@/hooks/useAuthSession';
import { fetchUmugandaEventAttendance, type UmugandaEventAttendance } from '@/lib/api';

export default function UnionUmugandaEventAttendancePage() {
  const params = useParams<{ eventId: string }>();
  const eventId = params?.eventId;
  const { token } = useAuthSession();

  const [attendance, setAttendance] = useState<UmugandaEventAttendance[]>([]);
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

    fetchUmugandaEventAttendance(token, eventId)
      .then((items) => {
        if (!active) {
          return;
        }
        setAttendance(items);
      })
      .catch((err) => {
        if (!active) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Unable to load attendance.';
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

  return (
    <RequireRole allowed="UNION_ADMIN">
      <div style={{ display: 'grid', gap: '1.5rem', padding: '1.5rem', maxWidth: '1800px', margin: '0 auto', width: '100%' }}>
        <Button variant="outline" asChild style={{ borderColor: '#3b82f6', color: '#3b82f6' }}>
          <Link href="/union/umuganda-events">
            <IconChevronLeft className="mr-2 h-4 w-4" />
            Back to events
          </Link>
        </Button>

        <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--surface-border)', padding: '1rem' }}>
          <div style={{ paddingBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>Event attendance</h3>
          </div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
              Event ID: <span style={{ fontFamily: 'monospace' }}>{eventId ?? '—'}</span>
            </div>

            {loading && <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Loading attendance…</div>}
            {error && <div style={{ fontSize: '0.875rem', color: 'var(--danger)' }}>{error}</div>}

            {!loading && !error && attendance.length === 0 && (
              <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>No attendance recorded yet.</div>
            )}

            {!loading && !error && attendance.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--surface-border)' }}>
                      <th style={{ padding: '0.5rem 1rem 0.5rem 0' }}>Member</th>
                      <th style={{ padding: '0.5rem 1rem 0.5rem 0' }}>National ID</th>
                      <th style={{ padding: '0.5rem 1rem 0.5rem 0' }}>Church</th>
                      <th style={{ padding: '0.5rem 1rem 0.5rem 0' }}>Checked in at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((record) => (
                      <tr key={record.id} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                        <td style={{ padding: '0.5rem 1rem 0.5rem 0' }}>
                          {[record.member?.firstName, record.member?.lastName]
                            .filter(Boolean)
                            .join(' ') || 'Member'}
                        </td>
                        <td style={{ padding: '0.5rem 1rem 0.5rem 0' }}>{record.member?.nationalId ?? '—'}</td>
                        <td style={{ padding: '0.5rem 1rem 0.5rem 0' }}>{record.church?.name ?? '—'}</td>
                        <td style={{ padding: '0.5rem 1rem 0.5rem 0' }}>
                          {record.checkedInAt
                            ? new Date(record.checkedInAt).toLocaleString()
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </RequireRole>
  );
}
