'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { IconCalendarEvent, IconFilter, IconSearch, IconX } from '@tabler/icons-react';

import RequireRole from '@/components/RequireRole';
import { RoleHero } from '@/components/dashboard/RoleHero';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';
import { Button } from '@/components/ui/button';
import { useAuthSession } from '@/hooks/useAuthSession';
import { fetchUmugandaEvents, fetchChurches, type UmugandaEventSummary, type ChurchSummary } from '@/lib/api';
import { format, isAfter, isBefore, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';

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

const filtersContainer: CSSProperties = {
  ...cardStyle,
  display: 'grid',
  gap: '1.5rem',
};

const filterRow: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1rem',
  alignItems: 'end',
};

const filterGroup: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
};

const filterLabel: CSSProperties = {
  fontSize: '0.875rem',
  fontWeight: '500',
  color: 'var(--shell-foreground)',
};

const filterInput: CSSProperties = {
  padding: '0.5rem',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '0.875rem',
  backgroundColor: 'white',
};

const filterSelect: CSSProperties = {
  ...filterInput,
  cursor: 'pointer',
};

const activeFiltersContainer: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
  marginTop: '1rem',
};

const activeFilterTag: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '0.25rem 0.5rem',
  backgroundColor: '#3b82f6',
  color: 'white',
  borderRadius: '4px',
  fontSize: '0.75rem',
};

const eventGrid: CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
};

const eventCard: CSSProperties = {
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
  fontWeight: '600',
  color: 'var(--shell-foreground)',
};

const eventMeta: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
  alignItems: 'center',
  marginTop: '0.5rem',
};

const eventBadge: CSSProperties = {
  padding: '0.25rem 0.5rem',
  borderRadius: '12px',
  fontSize: '0.75rem',
  fontWeight: '600',
};

const eventStats: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: '1rem',
  marginTop: '1rem',
};

const statItem: CSSProperties = {
  textAlign: 'center',
};

const statValue: CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: '700',
  color: 'var(--shell-foreground)',
};

const statLabel: CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--muted)',
  marginTop: '0.25rem',
};

const searchContainer: CSSProperties = {
  position: 'relative',
};

const searchIcon: CSSProperties = {
  position: 'absolute',
  left: '0.75rem',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '1rem',
  height: '1rem',
  color: '#6b7280',
};

const searchInput: CSSProperties = {
  ...filterInput,
  paddingLeft: '2.5rem',
  width: '100%',
};

type FilterState = {
  search: string;
  churchIds: string[];
  dateFrom: string;
  dateTo: string;
  attendanceMin: string;
  attendanceMax: string;
  theme: string;
  location: string;
  eventStatus: 'all' | 'upcoming' | 'past';
};

const DistrictUmugandaEventsPage = () => {
  const session = useAuthSession();
  const [events, setEvents] = useState<UmugandaEventSummary[]>([]);
  const [churches, setChurches] = useState<ChurchSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    churchIds: [],
    dateFrom: '',
    dateTo: '',
    attendanceMin: '',
    attendanceMax: '',
    theme: '',
    location: '',
    eventStatus: 'all',
  });

  useEffect(() => {
    if (!session.token) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [eventsData, churchesData] = await Promise.all([
          fetchUmugandaEvents(session.token),
          fetchChurches(session.token),
        ]);
        setEvents(eventsData);
        setChurches(churchesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [session.token]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const eventDate = new Date(event.date);
      const now = new Date();

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !event.theme?.toLowerCase().includes(searchLower) &&
          !event.location?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Church filter (would need attendance data for this)
      if (filters.churchIds.length > 0) {
        // This would need to be implemented with attendance data
        // For now, we'll skip this filter
      }

      // Date range filter
      if (filters.dateFrom && isBefore(eventDate, new Date(filters.dateFrom))) {
        return false;
      }
      if (filters.dateTo && isAfter(eventDate, new Date(filters.dateTo))) {
        return false;
      }

      // Attendance filter
      const attendance = event._count?.attendance || 0;
      if (filters.attendanceMin && attendance < parseInt(filters.attendanceMin)) {
        return false;
      }
      if (filters.attendanceMax && attendance > parseInt(filters.attendanceMax)) {
        return false;
      }

      // Theme filter
      if (filters.theme && !event.theme?.toLowerCase().includes(filters.theme.toLowerCase())) {
        return false;
      }

      // Location filter
      if (filters.location && !event.location?.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }

      // Event status filter
      if (filters.eventStatus === 'upcoming' && eventDate < now) {
        return false;
      }
      if (filters.eventStatus === 'past' && eventDate >= now) {
        return false;
      }

      return true;
    });
  }, [events, filters]);

  const updateFilter = (key: keyof FilterState, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      churchIds: [],
      dateFrom: '',
      dateTo: '',
      attendanceMin: '',
      attendanceMax: '',
      theme: '',
      location: '',
      eventStatus: 'all',
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.churchIds.length > 0) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.attendanceMin) count++;
    if (filters.attendanceMax) count++;
    if (filters.theme) count++;
    if (filters.location) count++;
    if (filters.eventStatus !== 'all') count++;
    return count;
  };

  const heroStats = useMemo(() => [
    { label: 'Total Events', value: String(events.length), trend: 'All time' },
    { label: 'Filtered Events', value: String(filteredEvents.length), trend: 'Current filters' },
    { label: 'Churches', value: String(churches.length), trend: 'In district' },
  ], [events.length, filteredEvents.length, churches.length]);

  const shellConfig = useMemo(() => ({
    hero: (
      <RoleHero
        role="DISTRICT_ADMIN"
        headline="Umuganda Events"
        subheadline="Monitor and filter umuganda events across all churches in your district."
        stats={heroStats}
      />
    ),
  }), [heroStats]);

  useDashboardShellConfig(shellConfig);

  const renderEventCard = (event: UmugandaEventSummary) => {
    const eventDate = new Date(event.date);
    const isUpcoming = eventDate >= new Date();
    const attendance = event._count?.attendance || 0;

    return (
      <div key={event.id} style={eventCard}>
        <div style={eventHeader}>
          <div style={{ flex: 1 }}>
            <div style={eventTitle}>{event.theme || 'Untitled Event'}</div>
            <div style={eventMeta}>
              <IconCalendarEvent style={{ width: '1rem', height: '1rem', color: '#f59e0b' }} />
              <span style={{ ...eventBadge, backgroundColor: '#3b82f6', color: 'white' }}>
                {format(eventDate, 'MMMM d, yyyy')}
              </span>
              {event.location && (
                <span style={{ ...eventBadge, backgroundColor: '#10b981', color: 'white' }}>
                  {event.location}
                </span>
              )}
              <span style={{ ...eventBadge, backgroundColor: isUpcoming ? '#f59e0b' : '#6b7280', color: 'white' }}>
                {isUpcoming ? 'Upcoming' : 'Past'}
              </span>
            </div>
          </div>
        </div>
        
        <div style={eventStats}>
          <div style={statItem}>
            <div style={statValue}>{attendance}</div>
            <div style={statLabel}>Total Attendance</div>
          </div>
          <div style={statItem}>
            <div style={statValue}>{churches.length}</div>
            <div style={statLabel}>Churches in District</div>
          </div>
          <div style={statItem}>
            <div style={statValue}>{attendance > 0 ? Math.round(attendance / churches.length) : 0}</div>
            <div style={statLabel}>Avg per Church</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <RequireRole allowed="DISTRICT_ADMIN">
      <div style={pageContainer}>
        {/* Filters Section */}
        <div style={filtersContainer}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
              <IconFilter style={{ display: 'inline', marginRight: '0.5rem' }} />
              Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                style={{ fontSize: '0.875rem' }}
              >
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
              {getActiveFiltersCount() > 0 && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  style={{ fontSize: '0.875rem' }}
                >
                  <IconX style={{ marginRight: '0.25rem', width: '1rem', height: '1rem' }} />
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {showFilters && (
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {/* Search */}
              <div style={filterRow}>
                <div style={filterGroup}>
                  <label style={filterLabel}>Search Events</label>
                  <div style={searchContainer}>
                    <IconSearch style={searchIcon} />
                    <input
                      type="text"
                      placeholder="Search by theme or location..."
                      style={searchInput}
                      value={filters.search}
                      onChange={(e) => updateFilter('search', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Date and Attendance Filters */}
              <div style={filterRow}>
                <div style={filterGroup}>
                  <label style={filterLabel}>From Date</label>
                  <input
                    type="date"
                    style={filterSelect}
                    value={filters.dateFrom}
                    onChange={(e) => updateFilter('dateFrom', e.target.value)}
                  />
                </div>
                <div style={filterGroup}>
                  <label style={filterLabel}>To Date</label>
                  <input
                    type="date"
                    style={filterSelect}
                    value={filters.dateTo}
                    onChange={(e) => updateFilter('dateTo', e.target.value)}
                  />
                </div>
                <div style={filterGroup}>
                  <label style={filterLabel}>Min Attendance</label>
                  <input
                    type="number"
                    placeholder="0"
                    style={filterInput}
                    value={filters.attendanceMin}
                    onChange={(e) => updateFilter('attendanceMin', e.target.value)}
                  />
                </div>
                <div style={filterGroup}>
                  <label style={filterLabel}>Max Attendance</label>
                  <input
                    type="number"
                    placeholder="999"
                    style={filterInput}
                    value={filters.attendanceMax}
                    onChange={(e) => updateFilter('attendanceMax', e.target.value)}
                  />
                </div>
              </div>

              {/* Theme, Location, and Status Filters */}
              <div style={filterRow}>
                <div style={filterGroup}>
                  <label style={filterLabel}>Theme Contains</label>
                  <input
                    type="text"
                    placeholder="Search theme..."
                    style={filterInput}
                    value={filters.theme}
                    onChange={(e) => updateFilter('theme', e.target.value)}
                  />
                </div>
                <div style={filterGroup}>
                  <label style={filterLabel}>Location Contains</label>
                  <input
                    type="text"
                    placeholder="Search location..."
                    style={filterInput}
                    value={filters.location}
                    onChange={(e) => updateFilter('location', e.target.value)}
                  />
                </div>
                <div style={filterGroup}>
                  <label style={filterLabel}>Event Status</label>
                  <select
                    style={filterSelect}
                    value={filters.eventStatus}
                    onChange={(e) => updateFilter('eventStatus', e.target.value)}
                  >
                    <option value="all">All Events</option>
                    <option value="upcoming">Upcoming Only</option>
                    <option value="past">Past Only</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {getActiveFiltersCount() > 0 && (
            <div style={activeFiltersContainer}>
              {filters.search && (
                <span style={activeFilterTag}>
                  Search: {filters.search}
                  <IconX 
                    style={{ cursor: 'pointer', width: '0.75rem', height: '0.75rem' }}
                    onClick={() => updateFilter('search', '')}
                  />
                </span>
              )}
              {filters.dateFrom && (
                <span style={activeFilterTag}>
                  From: {format(new Date(filters.dateFrom), 'MMM d, yyyy')}
                  <IconX 
                    style={{ cursor: 'pointer', width: '0.75rem', height: '0.75rem' }}
                    onClick={() => updateFilter('dateFrom', '')}
                  />
                </span>
              )}
              {filters.dateTo && (
                <span style={activeFilterTag}>
                  To: {format(new Date(filters.dateTo), 'MMM d, yyyy')}
                  <IconX 
                    style={{ cursor: 'pointer', width: '0.75rem', height: '0.75rem' }}
                    onClick={() => updateFilter('dateTo', '')}
                  />
                </span>
              )}
              {filters.eventStatus !== 'all' && (
                <span style={activeFilterTag}>
                  Status: {filters.eventStatus}
                  <IconX 
                    style={{ cursor: 'pointer', width: '0.75rem', height: '0.75rem' }}
                    onClick={() => updateFilter('eventStatus', 'all')}
                  />
                </span>
              )}
            </div>
          )}
        </div>

        {/* Events List */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>
            Umuganda Events ({filteredEvents.length})
          </h2>
          
          {loading && (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
              Loading events...
            </div>
          )}
          
          {error && (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '2rem', color: 'var(--danger)' }}>
              {error}
            </div>
          )}
          
          {!loading && !error && filteredEvents.length === 0 && (
            <div style={{ ...cardStyle, textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
              {getActiveFiltersCount() > 0 ? 'No events match your filters.' : 'No umuganda events found.'}
            </div>
          )}
          
          {!loading && !error && filteredEvents.length > 0 && (
            <div style={eventGrid}>
              {filteredEvents.map(renderEventCard)}
            </div>
          )}
        </div>
      </div>
    </RequireRole>
  );
};

export default DistrictUmugandaEventsPage;
