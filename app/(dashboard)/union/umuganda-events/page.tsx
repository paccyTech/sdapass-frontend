'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { IconCalendarEvent, IconPlus } from '@tabler/icons-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import RequireRole from '@/components/RequireRole';
import { RoleHero } from '@/components/dashboard/RoleHero';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { useAuthSession } from '@/hooks/useAuthSession';
import { createUmugandaEvent, fetchUmugandaEvents, type UmugandaEventSummary } from '@/lib/api';

const formSchema = z.object({
  theme: z.string().min(5, {
    message: 'Theme must be at least 5 characters.',
  }),
  location: z.string().min(3, {
    message: 'Location must be at least 3 characters.',
  }),
  description: z.string().optional(),
});

const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(4, 8, 18, 0.65)',
  zIndex: 90,
  display: 'grid',
  placeItems: 'center',
  padding: '2rem',
};

const modalBodyStyle: CSSProperties = {
  background: 'white',
  borderRadius: '24px',
  width: 'min(720px, 100%)',
  maxHeight: '86vh',
  overflow: 'hidden',
  boxShadow: '0 32px 56px rgba(8, 22, 48, 0.24)',
  display: 'grid',
  gridTemplateRows: 'auto 1fr',
};

const modalHeaderStyle: CSSProperties = {
  padding: '1.35rem 1.75rem',
  borderBottom: '1px solid rgba(24,76,140,0.12)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1rem',
};

const modalContentStyle: CSSProperties = {
  padding: '1.5rem 1.75rem',
  overflowY: 'auto',
};

const fieldLabelStyle: CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: '500',
  marginBottom: '0.5rem',
};

const fieldMessageStyle: CSSProperties = {
  color: 'red',
  fontSize: '0.875rem',
};

const textInputStyle: CSSProperties = {
  padding: '0.5rem',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  width: '100%',
  fontSize: '0.875rem',
};

const textAreaStyle: CSSProperties = {
  minHeight: '120px',
  width: '100%',
  padding: '0.5rem',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
};

const modalOutlineButtonStyle: CSSProperties = {
  padding: '0.5rem 1rem',
  border: '1px solid #d1d5db',
  backgroundColor: 'transparent',
  color: '#374151',
  borderRadius: '6px',
  cursor: 'pointer',
};

const modalPrimaryButtonStyle: CSSProperties = {
  padding: '0.5rem 1rem',
  backgroundColor: 'darkblue',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  minWidth: '160px',
};

const isSunday = (date: Date): boolean => {
  return date.getDay() === 0;
};

const getDaysInMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

const getFirstDayOfMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

const generateCalendarDays = (currentDate: Date): (Date | null)[] => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  
  const days: (Date | null)[] = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  
  // Add all days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  
  return days;
};

const buildHeroStats = (events: UmugandaEventSummary[]) => {
  const total = events.length;

  const avgAttendance = total
    ? Math.round(events.reduce((sum, event) => sum + (event._count?.attendance ?? 0), 0) / total)
    : 0;

  const now = new Date();
  const nextEvent = events
    .map((event) => ({
      ...event,
      parsedDate: new Date(event.date),
    }))
    .filter((event) => !Number.isNaN(event.parsedDate.getTime()))
    .filter((event) => event.parsedDate >= now)
    .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())[0];

  return [
    { label: 'Total Events', value: String(total), trend: 'All time' },
    { label: 'Avg. Attendance', value: String(avgAttendance), trend: 'Per event' },
    {
      label: 'Next Event',
      value: nextEvent ? format(nextEvent.parsedDate, 'MMM d, yyyy') : '—',
      trend: nextEvent?.theme ?? 'No upcoming events',
    },
  ];
};

const UmugandaEventsPage = () => {
  const session = useAuthSession();
  const [events, setEvents] = useState<UmugandaEventSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      theme: '',
      location: '',
      description: '',
    },
  });

  const loadEvents = useCallback(async () => {
    if (!session.token) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchUmugandaEvents(session.token);
      setEvents(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load events.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [session.token]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };

    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
    setIsSubmitting(false);
    setSelectedDate(undefined);
    setIsCalendarOpen(false);
    form.reset({
      theme: '',
      location: '',
      description: '',
    });
  }, [form]);

  const onCreateSubmit = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      try {
        setIsSubmitting(true);

        if (!session.token) {
          throw new Error('Session expired. Please sign in again.');
        }

        if (!selectedDate) {
          toast({
            title: 'Error',
            description: 'Please select a date for the event.',
            variant: 'destructive',
          });
          return;
        }

        console.log('Creating event with:', {
          date: selectedDate.toISOString(),
          theme: values.theme,
          location: values.location,
          description: values.description,
        });

        await createUmugandaEvent(session.token, {
          date: selectedDate.toISOString(),
          theme: values.theme,
          location: values.location,
          description: values.description ? values.description : null,
        });

        toast({
          title: 'Event created successfully',
          description: 'The Umuganda event has been scheduled.',
          variant: 'success',
        });

        closeCreateModal();
        await loadEvents();
      } catch (err) {
        console.error('Error creating event:', err);
        const message = err instanceof Error ? err.message : 'Failed to create event. Please try again.';
        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [closeCreateModal, loadEvents, session.token, selectedDate],
  );

  const shellConfig = useMemo(
    () => ({
      hero: (
        <RoleHero
          role="UNION_ADMIN"
          headline="Umuganda Events Management"
          subheadline="Schedule and track community service events across your union. Monitor attendance and participation metrics."
          stats={buildHeroStats(events)}
          actions={
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <IconPlus className="mr-2 h-4 w-4" />
              New Event
            </Button>
          }
        />
      ),
    }),
    [events],
  );

  useDashboardShellConfig(shellConfig);

  return (
    <RequireRole allowed="UNION_ADMIN">
      <div style={{ display: 'grid', gap: '1.5rem', padding: '1.5rem', maxWidth: '1800px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>Upcoming Events</h2>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            style={{ backgroundColor: 'darkblue', color: 'white', borderColor: 'darkblue', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'box-shadow 0.2s ease', width: '140px' }}
          >
            <IconPlus className="mr-2 h-4 w-4" />
            New Event
          </Button>
        </div>

        {isCreateModalOpen && (
          <div
            style={modalOverlayStyle}
            role="dialog"
            aria-modal="true"
            onClick={(event) => {
              if (event.target === event.currentTarget && !isSubmitting) {
                closeCreateModal();
              }
            }}
          >
            <div style={modalBodyStyle} onClick={(event) => event.stopPropagation()}>
              <div style={modalHeaderStyle}>
                <div style={{ display: 'grid', gap: '0.2rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--shell-foreground)' }}>New Umuganda Event</h3>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--muted)' }}>Fill in the details to schedule a new event.</p>
                </div>
                <Button type="button" variant="outline" disabled={isSubmitting} onClick={closeCreateModal} style={modalOutlineButtonStyle}>
                  Close
                </Button>
              </div>

              <div style={modalContentStyle}>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onCreateSubmit)} style={{ display: 'grid', gap: '1.25rem' }}>
                    <FormField
                      control={form.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem style={{ display: 'flex', flexDirection: 'column' }}>
                          <FormLabel style={fieldLabelStyle}>Event Theme</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g., Community Cleanup Initiative" style={textInputStyle} {...field} />
                          </FormControl>
                          <FormMessage style={fieldMessageStyle} />
                        </FormItem>
                      )}
                    />

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={fieldLabelStyle}>Event Date</label>
                      <div style={{ position: 'relative' }} ref={calendarRef}>
                        <button
                          type="button"
                          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                          style={{
                            ...textInputStyle,
                            justifyContent: 'left',
                            fontWeight: 'normal',
                            textAlign: 'left',
                            height: 'auto',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            width: '100%',
                            backgroundColor: 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                          }}
                        >
                          {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
                        </button>
                        {isCalendarOpen && (
                          <div style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            zIndex: 50,
                            backgroundColor: 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: '8px',
                            padding: '16px',
                            marginTop: '4px',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                          }}>
                            {/* Calendar Header */}
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: '16px',
                            }}>
                              <button
                                type="button"
                                onClick={() => {
                                  const newMonth = new Date(calendarMonth);
                                  newMonth.setMonth(newMonth.getMonth() - 1);
                                  setCalendarMonth(newMonth);
                                }}
                                style={{
                                  padding: '6px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  backgroundColor: 'white',
                                  cursor: 'pointer',
                                  fontSize: '16px',
                                }}
                              >
                                ‹
                              </button>
                              <div style={{
                                fontSize: '16px',
                                fontWeight: '500',
                                color: '#111827',
                              }}>
                                {format(calendarMonth, 'MMMM yyyy')}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newMonth = new Date(calendarMonth);
                                  newMonth.setMonth(newMonth.getMonth() + 1);
                                  setCalendarMonth(newMonth);
                                }}
                                style={{
                                  padding: '6px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  backgroundColor: 'white',
                                  cursor: 'pointer',
                                  fontSize: '16px',
                                }}
                              >
                                ›
                              </button>
                            </div>

                            {/* Days of Week */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(7, 1fr)',
                              gap: '4px',
                              marginBottom: '8px',
                            }}>
                              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                                <div key={day} style={{
                                  textAlign: 'center',
                                  fontSize: '12px',
                                  fontWeight: '500',
                                  color: '#6b7280',
                                  padding: '4px',
                                }}>
                                  {day}
                                </div>
                              ))}
                            </div>

                            {/* Calendar Days */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(7, 1fr)',
                              gap: '4px',
                            }}>
                              {generateCalendarDays(calendarMonth).map((date, index) => {
                                if (!date) {
                                  return <div key={`empty-${index}`} style={{ padding: '8px' }} />;
                                }
                                
                                const isSundayDate = isSunday(date);
                                const isSelected = selectedDate && 
                                  selectedDate.getDate() === date.getDate() &&
                                  selectedDate.getMonth() === date.getMonth() &&
                                  selectedDate.getFullYear() === date.getFullYear();
                                
                                return (
                                  <button
                                    key={date.toISOString()}
                                    type="button"
                                    onClick={() => {
                                      if (isSundayDate) {
                                        setSelectedDate(date);
                                        setIsCalendarOpen(false);
                                      }
                                    }}
                                    disabled={!isSundayDate}
                                    style={{
                                      padding: '8px',
                                      border: '1px solid #d1d5db',
                                      borderRadius: '6px',
                                      backgroundColor: isSelected ? '#2563eb' : 'white',
                                      color: isSelected ? 'white' : (isSundayDate ? '#111827' : '#d1d5db'),
                                      cursor: isSundayDate ? 'pointer' : 'not-allowed',
                                      fontSize: '14px',
                                      fontWeight: isSelected ? '600' : 'normal',
                                      opacity: isSundayDate ? 1 : 0.5,
                                      transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                      if (isSundayDate && !isSelected) {
                                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (isSundayDate && !isSelected) {
                                        e.currentTarget.style.backgroundColor = 'white';
                                      }
                                    }}
                                  >
                                    {date.getDate()}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                        Only Sundays are available for Umuganda events
                      </div>
                      {!selectedDate && (
                        <div style={{ fontSize: '0.875rem', color: 'red', marginTop: '0.25rem' }}>
                          Event date is required
                        </div>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem style={{ display: 'flex', flexDirection: 'column' }}>
                          <FormLabel style={fieldLabelStyle}>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g., Kigali City Center" style={textInputStyle} {...field} />
                          </FormControl>
                          <FormMessage style={fieldMessageStyle} />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                          <FormLabel style={fieldLabelStyle}>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any extra notes for this event (meeting point, what to bring, etc.)"
                              style={textAreaStyle}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage style={fieldMessageStyle} />
                        </FormItem>
                      )}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
                      <Button type="button" variant="outline" disabled={isSubmitting} onClick={closeCreateModal} style={modalOutlineButtonStyle}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting} style={modalPrimaryButtonStyle}>
                        {isSubmitting ? 'Creating…' : 'Create Event'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {loading && (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--surface-border)', padding: '1rem' }}>
              <div style={{ padding: '2rem 0', color: 'var(--muted)', textAlign: 'center' }}>Loading events…</div>
            </div>
          )}
          {error && (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--surface-border)', padding: '1rem' }}>
              <div style={{ padding: '2rem 0', color: 'var(--danger)', textAlign: 'center' }}>{error}</div>
            </div>
          )}
          {!loading && !error && events.length === 0 && (
            <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--surface-border)', padding: '1rem' }}>
              <div style={{ padding: '2rem 0', color: 'var(--muted)', textAlign: 'center' }}>
                No Umuganda events found. Create your first one.
              </div>
            </div>
          )}
          {events.map((event) => (
            <div key={event.id} style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--surface-border)', padding: '1rem', transition: 'box-shadow 0.2s ease', cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--shell-foreground)' }}>{event.theme}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                      <IconCalendarEvent style={{ marginRight: '0.25rem', width: '1rem', height: '1rem' }} />
                      {format(new Date(event.date), 'MMMM d, yyyy')}
                      <span style={{ margin: '0 0.5rem' }}>•</span>
                      {event.location ?? 'TBA'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--shell-foreground)' }}>{event._count?.attendance ?? 0}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Participants</div>
                  </div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <Button variant="outline" asChild style={{ border: 'none', color: '#3b82f6' }}>
                    <Link href={`/union/umuganda-events/${event.id}`}>View Details</Link>
                  </Button>
                  <Button variant="outline" asChild style={{ border: 'none', color: '#10b981' }}>
                    <Link href={`/union/umuganda-events/${event.id}/attendance`}>
                      View Attendance
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </RequireRole>
  );
};

export default UmugandaEventsPage;
