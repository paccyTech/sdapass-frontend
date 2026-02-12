'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import RequireRole from '@/components/RequireRole';
import { RoleHero } from '@/components/dashboard/RoleHero';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { useAuthSession } from '@/hooks/useAuthSession';
import { createUmugandaEvent } from '@/lib/api';

const formSchema = z.object({
  date: z.date({
    required_error: 'Event date is required',
  }),
  theme: z.string().min(5, {
    message: 'Theme must be at least 5 characters.',
  }),
  location: z.string().min(3, {
    message: 'Location must be at least 3 characters.',
  }),
  description: z.string().optional(),
});

const NewUmugandaEventPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const session = useAuthSession();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      theme: '',
      location: '',
      description: '',
    },
  });

  const shellConfig = {
    hero: (
      <RoleHero
        role="UNION_ADMIN"
        headline="Schedule a New Umuganda Event"
        subheadline="Fill in the details below to create a new community service event for your union."
      />
    ),
  };

  useDashboardShellConfig(shellConfig);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true);

      if (!session.token) {
        throw new Error('Session expired. Please sign in again.');
      }

      await createUmugandaEvent(session.token, {
        date: values.date.toISOString(),
        theme: values.theme,
        location: values.location,
        description: values.description ? values.description : null,
      });
      
      toast({
        title: 'Event created successfully',
        description: 'The Umuganda event has been scheduled.',
      });
      
      router.push('/union/umuganda-events');
    } catch (error) {
      console.error('Error creating event:', error);
      const message = error instanceof Error ? error.message : 'Failed to create event. Please try again.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <RequireRole allowed="UNION_ADMIN">
      <div style={{ marginLeft: 'auto', marginRight: 'auto', width: '100%', maxWidth: '48rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0 }}>Event details</h3>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              Provide the theme, date, and location so church admins can check in members on the day.
            </p>
          </div>
          <div style={{ padding: '1.5rem' }}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <FormField
                    control={form.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem style={{ display: 'flex', flexDirection: 'column' }}>
                        <FormLabel style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Event Theme</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., Community Cleanup Initiative" style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%', fontSize: '0.875rem' }} {...field} />
                        </FormControl>
                        <FormMessage style={{ color: 'red', fontSize: '0.875rem' }} />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem style={{ display: 'flex', flexDirection: 'column' }}>
                        <FormLabel style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Event Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                            min={format(new Date(), 'yyyy-MM-dd')}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value ? new Date(`${value}T00:00:00`) : undefined);
                            }}
                            style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%', fontSize: '0.875rem' }}
                          />
                        </FormControl>
                        <FormMessage style={{ color: 'red', fontSize: '0.875rem' }} />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem style={{ display: 'flex', flexDirection: 'column' }}>
                        <FormLabel style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., Kigali City Center" style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%', fontSize: '0.875rem' }} {...field} />
                        </FormControl>
                        <FormMessage style={{ color: 'red', fontSize: '0.875rem' }} />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <FormLabel style={{ fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any extra notes for this event (meeting point, what to bring, etc.)"
                            style={{ minHeight: '120px', width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage style={{ color: 'red', fontSize: '0.875rem' }} />
                      </FormItem>
                    )}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '0.75rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.25rem', alignItems: 'stretch' }}>
                  <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting} style={{ padding: '0.5rem 1rem', border: '1px solid #d1d5db', backgroundColor: 'transparent', color: '#374151', borderRadius: '6px', cursor: 'pointer' }}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} style={{ padding: '0.5rem 1rem', backgroundColor: 'darkblue', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', minWidth: '160px' }}>
                    {isSubmitting ? 'Creating…' : 'Create Event'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </RequireRole>
  );
};

export default NewUmugandaEventPage;
