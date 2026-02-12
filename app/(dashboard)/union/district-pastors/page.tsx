/* original content restored */

'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import { IconAlertTriangle, IconChartHistogram, IconMapPin, IconUsersGroup, IconEye, IconEyeOff } from '@tabler/icons-react';

import RequireRole from '@/components/RequireRole';
import { RoleHero, type HeroStat } from '@/components/dashboard/RoleHero';
import { useDashboardShellConfig } from '@/components/dashboard/DashboardShellContext';
import { useAuthSession } from '@/hooks/useAuthSession';
import {
  assignChurchesToPastor,
  createChurch as createChurchRequest,
  createDistrict as createDistrictRequest,
  createDistrictPastor as createDistrictPastorRequest,
  deleteChurch as deleteChurchRequest,
  deleteDistrict as deleteDistrictRequest,
  deleteDistrictPastor as deleteDistrictPastorRequest,
  fetchChurches,
  fetchDistrictPastors,
  fetchDistricts,
  fetchUnions,
  updateChurch as updateChurchRequest,
  updateDistrict as updateDistrictRequest,
  updateDistrictPastor as updateDistrictPastorRequest,
  type ChurchSummary,
  type DistrictPastorSummary,
  type DistrictSummary,
  type DistrictPayload,
  type UnionSummary,
} from '@/lib/api';

const cardStyle: CSSProperties = {
  background: 'transparent',
  borderRadius: '20px',
  padding: '2rem',
  border: 'none',
  boxShadow: 'none',
  display: 'grid',
  gap: '1.25rem',
};

type CoverageInsight = {
  id: string;
  label: string;
  percent: number;
  color: string;
  churches: number;
  activePastors: number;
};

type PastorTrend = {
  label: string;
  value: number;
};

const buildCoverageInsights = (
  districts: DistrictSummary[],
  pastors: DistrictPastorSummary[],
  churchesByDistrict: Record<string, ChurchSummary[]>,
): CoverageInsight[] =>
  districts.map((district, index) => {
    const churches = churchesByDistrict[district.id] ?? [];
    const pastorCount = pastors.filter((pastor) => pastor.districtId === district.id && pastor.isActive).length;
    const coverage = churches.length === 0 ? 0 : Math.min(100, Math.round((pastorCount / churches.length) * 100));
    const palette = ['var(--accent)', 'var(--primary)', 'var(--danger)', 'var(--muted)'];
    return {
      id: district.id,
      label: district.name,
      percent: coverage,
      color: palette[index % palette.length],
      churches: churches.length,
      activePastors: pastorCount,
    };
  });

const buildPastorTrends = (pastors: DistrictPastorSummary[]): PastorTrend[] =>
  pastors.slice(0, 6).map((pastor) => ({
    label: pastor.lastName ?? pastor.firstName,
    value: pastor.pastorChurches.length,
  }));

const mutedText: CSSProperties = {
  color: 'var(--muted)',
  lineHeight: 1.6,
};

const badgeStyle = (): CSSProperties => ({
  padding: '0.2rem 0.6rem',
  borderRadius: '999px',
  fontSize: '0.7rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  background: 'var(--surface-soft)',
  color: 'var(--accent)',
  fontWeight: 600,
});

const buttonStyle = (variant: 'primary' | 'ghost' | 'danger' = 'primary'): CSSProperties => {
  if (variant === 'ghost') {
    return {
      border: '1px solid var(--surface-border)',
      background: 'transparent',
      color: 'var(--shell-foreground)',
      fontWeight: 600,
      borderRadius: '14px',
      padding: '0.55rem 1.15rem',
      cursor: 'pointer',
      transition: 'transform 0.2s ease',
    };
  }

  if (variant === 'danger') {
    return {
      border: 'none',
      background: 'var(--danger)',
      color: 'var(--on-primary)',
      fontWeight: 600,
      borderRadius: '14px',
      padding: '0.6rem 1.2rem',
      cursor: 'pointer',
      boxShadow: '0 14px 32px rgba(135, 32, 58, 0.26)',
      transition: 'transform 0.2s ease',
    };
  }

  return {
    border: 'none',
    background: 'var(--primary)',
    color: 'var(--on-primary)',
    fontWeight: 600,
    borderRadius: '16px',
    padding: '0.65rem 1.3rem',
    cursor: 'pointer',
    boxShadow: '0 18px 32px rgba(17, 24, 39, 0.18)',
    transition: 'transform 0.2s ease',
  };
};

const chipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.45rem',
  padding: '0.35rem 0.75rem',
  borderRadius: '999px',
  background: 'var(--surface-soft)',
  border: '1px solid var(--surface-border)',
  color: 'var(--shell-foreground)',
  fontWeight: 500,
  fontSize: '0.85rem',
};

const analyticsGridStyle: CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
};

const metricCardStyle: CSSProperties = {
  ...cardStyle,
  padding: '1.75rem',
  gap: '1.15rem',
  background: 'transparent',
  border: 'none',
};

const metricIconStyle: CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: '16px',
  background: 'var(--surface-soft)',
  display: 'grid',
  placeItems: 'center',
  boxShadow: '0 12px 24px rgba(8, 22, 48, 0.14)',
  color: 'var(--primary)',
};

const metricValueStyle: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '2.25rem',
  color: 'var(--shell-foreground)',
  margin: 0,
};

const metricLabelStyle: CSSProperties = {
  fontSize: '0.9rem',
  color: 'var(--muted)',
  margin: 0,
};

const chartCardStyle: CSSProperties = {
  ...cardStyle,
  padding: '1.75rem',
  display: 'grid',
  gap: '1.25rem',
  background: 'transparent',
  border: 'none',
};

const chartHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
};

const chartTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontSize: '1.35rem',
  color: 'var(--primary)',
};

const coverageRowStyle: CSSProperties = {
  display: 'grid',
  gap: '0.4rem',
};

const coverageLabelStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.75rem',
  fontSize: '0.9rem',
  color: 'var(--muted)',
};

const coverageTrackStyle: CSSProperties = {
  height: '10px',
  borderRadius: '999px',
  background: 'var(--surface-soft)',
  overflow: 'hidden',
};

const coverageFillStyle = (percent: number, color: string): CSSProperties => ({
  width: `${Math.max(0, Math.min(100, percent))}%`,
  height: '100%',
  borderRadius: '999px',
  background: color,
  transition: 'width 0.4s ease',
});

const calloutListStyle: CSSProperties = {
  display: 'grid',
  gap: '0.75rem',
};

const calloutItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.85rem',
  padding: '0.85rem 1rem',
  borderRadius: '16px',
  background: 'var(--surface-soft)',
  border: '1px solid var(--surface-border)',
  color: 'var(--shell-foreground)',
  fontSize: '0.9rem',
};

const actionsGridStyle: CSSProperties = {
  display: 'grid',
  gap: '1.75rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  alignItems: 'stretch',
};

const rosterListStyle: CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
};

const rosterHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1rem',
  flexWrap: 'wrap',
};

const sparklineMetaStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: '0.75rem',
  flexWrap: 'wrap',
  color: 'var(--muted)',
  fontSize: '0.8rem',
};

type SparklinePoint = {
  label: string;
  value: number;
};

const Sparkline = ({ data, accentColor = '#1f9d77' }: { data: SparklinePoint[]; accentColor?: string }) => {
  if (data.length === 0) {
    return <p style={{ margin: 0, color: 'var(--muted)' }}>Not enough data yet.</p>;
  }

  const width = 320;
  const height = 110;
  const paddingX = 12;
  const paddingY = 16;
  const values = data.map((point) => point.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const coordinates = data.map((point, index) => {
    const x = paddingX + (index / Math.max(data.length - 1, 1)) * (width - 2 * paddingX);
    const y = height - paddingY - ((point.value - min) / range) * (height - 2 * paddingY);
    return { x, y };
  });

  const linePath = coordinates
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  const areaPath = `${linePath} L ${coordinates[coordinates.length - 1]?.x.toFixed(2)} ${height - paddingY} L ${coordinates[0]?.x.toFixed(2)} ${height - paddingY} Z`;

  return (
    <div style={{ display: 'grid', gap: '0.6rem' }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-hidden="true"
        style={{ overflow: 'visible' }}
      >
        <path d={areaPath} fill={`${accentColor}22`} stroke="none" />
        <path d={linePath} fill="none" stroke={accentColor} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        {coordinates.map((point, index) => (
          <circle key={data[index]?.label ?? index} cx={point.x} cy={point.y} r={3.5} fill="#fff" stroke={accentColor} strokeWidth={2} />
        ))}
      </svg>
      <div style={sparklineMetaStyle}>
        {data.map((point) => (
          <div key={point.label} style={{ display: 'grid', gap: '0.15rem', minWidth: '40px' }}>
            <span>{point.label}</span>
            <strong style={{ color: '#0b1f33' }}>{point.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

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
  width: 'min(620px, 100%)',
  maxHeight: '80vh',
  overflow: 'hidden',
  boxShadow: '0 32px 56px rgba(8, 22, 48, 0.24)',
  display: 'grid',
  gridTemplateRows: 'auto 1fr auto',
};

const modalContentStyle: CSSProperties = {
  padding: '1.8rem 2rem',
  overflowY: 'auto',
  display: 'grid',
  gap: '1rem',
};

const modalFooterStyle: CSSProperties = {
  padding: '1.5rem 2rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: 'rgba(24,76,140,0.05)',
  borderTop: '1px solid rgba(24,76,140,0.12)',
};

const fieldLabel: CSSProperties = {
  display: 'grid',
  gap: '0.5rem',
  fontWeight: 600,
  color: 'var(--primary)',
};

const textInputStyle: CSSProperties = {
  borderRadius: '12px',
  border: '1px solid rgba(24,76,140,0.25)',
  padding: '0.65rem 0.85rem',
  fontSize: '0.95rem',
  fontFamily: 'inherit',
};

const selectStyle: CSSProperties = {
  ...textInputStyle,
  appearance: 'none',
};

type AssignState = {
  pastor: DistrictPastorSummary | null;
  selectedChurchIds: string[];
  isSubmitting: boolean;
  isLoadingChurches: boolean;
  error: string | null;
};

type CreateChurchState = {
  districtId: string;
  name: string;
  location: string;
  isSubmitting: boolean;
  error: string | null;
  success: string | null;
};

type ChurchEditState = {
  church: ChurchSummary | null;
  name: string;
  location: string;
  isSubmitting: boolean;
  error: string | null;
};

type DistrictFormState = {
  mode: 'create' | 'edit';
  districtId: string | null;
  name: string;
  location: string;
  unionId: string;
  isSubmitting: boolean;
  error: string | null;
};

type PastorFormState = {
  mode: 'create' | 'edit';
  pastor: DistrictPastorSummary | null;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  districtId: string;
  password: string;
  confirmPassword: string;
  isActive: boolean;
  isSubmitting: boolean;
  error: string | null;
  success: string | null;
};

type DeletePromptState<T> = {
  target: T | null;
  isSubmitting: boolean;
  error: string | null;
};

type GlobalFeedback = { type: 'success' | 'error'; message: string } | null;

const initialAssignState: AssignState = {
  pastor: null,
  selectedChurchIds: [],
  isSubmitting: false,
  isLoadingChurches: false,
  error: null,
};

const initialCreateState: CreateChurchState = {
  districtId: '',
  name: '',
  location: '',
  isSubmitting: false,
  error: null,
  success: null,
};

const initialChurchEditState: ChurchEditState = {
  church: null,
  name: '',
  location: '',
  isSubmitting: false,
  error: null,
};

const initialChurchDeleteState: DeletePromptState<ChurchSummary> = {
  target: null,
  isSubmitting: false,
  error: null,
};

const initialDistrictFormState: DistrictFormState = {
  mode: 'create',
  districtId: null,
  name: '',
  location: '',
  unionId: '',
  isSubmitting: false,
  error: null,
};

const initialDistrictDeleteState: DeletePromptState<DistrictSummary> = {
  target: null,
  isSubmitting: false,
  error: null,
};

const initialPastorFormState: PastorFormState = {
  mode: 'create',
  pastor: null,
  firstName: '',
  lastName: '',
  phoneNumber: '',
  email: '',
  districtId: '',
  password: '',
  confirmPassword: '',
  isActive: true,
  isSubmitting: false,
  error: null,
  success: null,
};

const initialPastorDeleteState: DeletePromptState<DistrictPastorSummary> = {
  target: null,
  isSubmitting: false,
  error: null,
};

const DistrictPastorsPage = () => {
  const { token, user } = useAuthSession();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pastors, setPastors] = useState<DistrictPastorSummary[]>([]);
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [churchesByDistrict, setChurchesByDistrict] = useState<Record<string, ChurchSummary[]>>({});
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('');
  const [assignState, setAssignState] = useState<AssignState>(initialAssignState);
  const [createState, setCreateState] = useState<CreateChurchState>(initialCreateState);
  const [districtFormState, setDistrictFormState] = useState<DistrictFormState>(initialDistrictFormState);
  const [districtDeleteState, setDistrictDeleteState] = useState<DeletePromptState<DistrictSummary>>(initialDistrictDeleteState);
  const [churchEditState, setChurchEditState] = useState<ChurchEditState>(initialChurchEditState);
  const [churchDeleteState, setChurchDeleteState] = useState<DeletePromptState<ChurchSummary>>(initialChurchDeleteState);
  const [pastorFormState, setPastorFormState] = useState<PastorFormState>(initialPastorFormState);
  const [pastorDeleteState, setPastorDeleteState] = useState<DeletePromptState<DistrictPastorSummary>>(initialPastorDeleteState);
  const [globalFeedback, setGlobalFeedback] = useState<GlobalFeedback>(null);
  const [unions, setUnions] = useState<UnionSummary[]>([]);
  const [isLoadingUnions, setIsLoadingUnions] = useState(false);
  const [unionError, setUnionError] = useState<string | null>(null);
  const [isDistrictModalOpen, setIsDistrictModalOpen] = useState(false);
  const [isDistrictDeleteOpen, setIsDistrictDeleteOpen] = useState(false);
  const [isPastorModalOpen, setIsPastorModalOpen] = useState(false);
  const [isPastorDeleteOpen, setIsPastorDeleteOpen] = useState(false);
  const [isChurchEditOpen, setIsChurchEditOpen] = useState(false);
  const [isChurchDeleteOpen, setIsChurchDeleteOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissFeedback = useCallback(() => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
    setGlobalFeedback(null);
  }, []);

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    setGlobalFeedback({ type, message });
    feedbackTimeoutRef.current = setTimeout(() => {
      setGlobalFeedback(null);
      feedbackTimeoutRef.current = null;
    }, 5000);
  }, []);

  useEffect(
    () => () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    },
    [],
  );

  const sortDistricts = useCallback(
    (items: DistrictSummary[]) => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [],
  );

  const sortPastors = useCallback(
    (items: DistrictPastorSummary[]) =>
      [...items].sort((a, b) => {
        const byLast = a.lastName.localeCompare(b.lastName);
        if (byLast !== 0) {
          return byLast;
        }
        return a.firstName.localeCompare(b.firstName);
      }),
    [],
  );

  const unionOptions = useMemo(() => {
    if (!user?.unionId) {
      return unions;
    }

    const hasUserUnion = unions.some((union) => union.id === user.unionId);
    if (hasUserUnion) {
      return unions;
    }

    return [
      ...unions,
      {
        id: user.unionId,
        name: 'Assigned union',
        description: null,
      },
    ];
  }, [unions, user?.unionId]);

  const toDistrictSummary = useCallback(
    (district: DistrictPayload): DistrictSummary => ({
      id: district.id,
      name: district.name,
      unionId: district.unionId,
      location: district.location ?? null,
    }),
    [],
  );

  const openDistrictForm = useCallback(
    (mode: DistrictFormState['mode'], district?: DistrictSummary) => {
      const fallbackUnionId =
        (district?.unionId && unionOptions.some((union) => union.id === district.unionId)
          ? district.unionId
          : unionOptions[0]?.id) ?? '';

      setDistrictFormState({
        mode,
        districtId: district?.id ?? null,
        name: district?.name ?? '',
        location: district?.location ?? '',
        unionId: fallbackUnionId,
        isSubmitting: false,
        error: null,
      });
      setIsDistrictModalOpen(true);
    }, [unionOptions],
  );

  const resetDistrictForm = useCallback(() => {
    setDistrictFormState(initialDistrictFormState);
    setIsDistrictModalOpen(false);
  }, []);

  const confirmDeleteDistrict = useCallback((district: DistrictSummary) => {
    setDistrictDeleteState({ target: district, isSubmitting: false, error: null });
    setIsDistrictDeleteOpen(true);
  }, []);

  const cancelDeleteDistrict = useCallback(() => {
    setDistrictDeleteState(initialDistrictDeleteState);
    setIsDistrictDeleteOpen(false);
  }, []);

  const openPastorForm = useCallback(
    (mode: PastorFormState['mode'], pastor?: DistrictPastorSummary) => {
      setPastorFormState({
        mode,
        pastor: pastor ?? null,
        firstName: pastor?.firstName ?? '',
        lastName: pastor?.lastName ?? '',
        phoneNumber: pastor?.phoneNumber ?? '',
        email: pastor?.email ?? '',
        districtId:
          pastor?.districtId ?? (selectedDistrictFilter || districts[0]?.id || ''),
        password: '',
        confirmPassword: '',
        isActive: pastor?.isActive ?? true,
        isSubmitting: false,
        error: null,
        success: null,
      });
      setIsPastorModalOpen(true);
    },
    [districts, selectedDistrictFilter],
  );

  const resetPastorForm = useCallback(() => {
    setPastorFormState(initialPastorFormState);
    setIsPastorModalOpen(false);
  }, []);

  const confirmDeletePastor = useCallback((pastor: DistrictPastorSummary) => {
    setPastorDeleteState({ target: pastor, isSubmitting: false, error: null });
    setIsPastorDeleteOpen(true);
  }, []);

  const cancelDeletePastor = useCallback(() => {
    setPastorDeleteState(initialPastorDeleteState);
    setIsPastorDeleteOpen(false);
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const [pastorData, districtData, churchData] = await Promise.all([
          fetchDistrictPastors(token),
          fetchDistricts(token),
          fetchChurches(token),
        ]);

        if (!active) {
          return;
        }

        const orderedPastors = sortPastors(pastorData);
        const orderedDistricts = sortDistricts(districtData);
        const groupedChurches = churchData.reduce<Record<string, ChurchSummary[]>>((acc, church) => {
          if (!church.districtId) {
            return acc;
          }
          const next = acc[church.districtId] ?? [];
          acc[church.districtId] = [...next, church];
          return acc;
        }, {});

        setPastors(orderedPastors);
        setDistricts(orderedDistricts);
        setChurchesByDistrict(groupedChurches);
        setCreateState((prev) => ({
          ...prev,
          districtId: prev.districtId || orderedDistricts[0]?.id || '',
        }));
        setPastorFormState((prev) => ({
          ...prev,
          districtId: prev.districtId || orderedDistricts[0]?.id || '',
          password: '',
          confirmPassword: '',
        }));
      } catch (err) {
        if (!active) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Failed to load leadership data';
        setError(message);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [token, sortPastors, sortDistricts]);

  useEffect(() => {
    if (!token) {
      setUnions([]);
      setIsLoadingUnions(false);
      return;
    }

    let active = true;
    setIsLoadingUnions(true);
    setUnionError(null);

    (async () => {
      try {
        const data = await fetchUnions(token);
        if (!active) {
          return;
        }
        const ordered = [...data].sort((a, b) => a.name.localeCompare(b.name));
        setUnions(ordered);
      } catch (err) {
        if (!active) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Failed to load unions';
        setUnionError(message);
      } finally {
        if (active) {
          setIsLoadingUnions(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    setDistrictFormState((prev) => {
      const hasValidUnion = prev.unionId && unionOptions.some((union) => union.id === prev.unionId);
      if (hasValidUnion) {
        return prev;
      }

      const fallback = unionOptions[0]?.id ?? '';
      if (!fallback || prev.unionId === fallback) {
        return prev;
      }

      return { ...prev, unionId: fallback };
    });
  }, [unionOptions]);

  const heroStats: HeroStat[] = useMemo(() => {
    const activePastors = pastors.filter((pastor) => pastor.isActive).length;
    const churchesCovered = pastors.reduce((total, pastor) => total + pastor.pastorChurches.length, 0);
    const uncoveredDistricts = districts.filter(
      (district) => !pastors.some((pastor) => pastor.districtId === district.id && pastor.isActive),
    ).length;

    return [
      {
        label: 'Active district pastors',
        value: activePastors.toString(),
        trend: `${pastors.length - activePastors} awaiting activation`.replace('-', '−'),
      },
      {
        label: 'Churches under coverage',
        value: churchesCovered.toString(),
        trend: `${districts.length} districts in union`,
      },
      {
        label: 'Districts needing assignment',
        value: uncoveredDistricts.toString(),
        trend: uncoveredDistricts === 0 ? 'All districts covered' : 'Prioritize critical gaps',
      },
    ];
  }, [districts, pastors]);

  const hero = useMemo(
    () => (
      <RoleHero
        role="UNION_ADMIN"
        headline=""
        subheadline=""
        stats={heroStats}
      />
    ),
    [heroStats],
  );

  const shellConfig = useMemo(
    () => ({
      hero,
    }),
    [hero],
  );

  useDashboardShellConfig(shellConfig);

  const filteredPastors = useMemo(() => {
    if (!selectedDistrictFilter) {
      return pastors;
    }
    return pastors.filter((pastor) => pastor.districtId === selectedDistrictFilter);
  }, [pastors, selectedDistrictFilter]);

  const totalChurches = useMemo(
    () =>
      Object.values(churchesByDistrict).reduce((sum, districtChurches) => sum + districtChurches.length, 0),
    [churchesByDistrict],
  );

  const activePastorCount = useMemo(() => pastors.filter((pastor) => pastor.isActive).length, [pastors]);
  const inactivePastorCount = pastors.length - activePastorCount;

  const coverageInsights = useMemo(
    () => buildCoverageInsights(districts, pastors, churchesByDistrict),
    [districts, pastors, churchesByDistrict],
  );

  const coverageAverage = useMemo(
    () =>
      coverageInsights.length === 0
        ? 0
        : Math.round(
            coverageInsights.reduce((total, insight) => total + insight.percent, 0) /
              coverageInsights.length,
          ),
    [coverageInsights],
  );

  const coverageInsightsSorted = useMemo(
    () => [...coverageInsights].sort((a, b) => b.percent - a.percent),
    [coverageInsights],
  );

  const uncoveredDistricts = useMemo(
    () => coverageInsightsSorted.filter((insight) => insight.percent === 0),
    [coverageInsightsSorted],
  );

  const lowCoverageDistricts = useMemo(
    () => coverageInsightsSorted.filter((insight) => insight.percent > 0 && insight.percent < 60),
    [coverageInsightsSorted],
  );

  const overviewMetrics = useMemo(
    () => [
      {
        label: 'Active district pastors',
        value: activePastorCount.toString(),
        context:
          inactivePastorCount > 0
            ? `${inactivePastorCount} awaiting activation`
            : 'All registered pastors are active',
        icon: <IconUsersGroup size={22} stroke={1.7} />,
      },
      {
        label: 'District coverage average',
        value: `${coverageAverage}%`,
        context:
          coverageInsightsSorted.length === 0
            ? 'Add districts to begin tracking coverage'
            : `${coverageInsightsSorted.filter((insight) => insight.percent === 100).length} fully covered districts`,
        icon: <IconChartHistogram size={22} stroke={1.7} />,
      },
      {
        label: 'Churches connected',
        value: totalChurches.toString(),
        context: `${districts.length} districts in union`,
        icon: <IconMapPin size={22} stroke={1.7} />,
      },
    ],
    [activePastorCount, inactivePastorCount, coverageAverage, coverageInsightsSorted, totalChurches, districts.length],
  );

  const pastorTrendData = useMemo(() => buildPastorTrends(pastors), [pastors]);

  const handleCreateFieldChange = useCallback(
    (field: 'districtId' | 'name' | 'location') =>
      (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = event.target.value;
        setCreateState((prev) => ({ ...prev, [field]: value, error: null, success: null }));
      },
    [],
  );

  const startEditChurch = useCallback((church: ChurchSummary) => {
    setChurchEditState({
      church,
      name: church.name,
      location: church.location ?? '',
      isSubmitting: false,
      error: null,
    });
    setIsChurchEditOpen(true);
  }, []);

  const resetEditChurch = useCallback(() => {
    setChurchEditState(initialChurchEditState);
    setIsChurchEditOpen(false);
  }, []);

  const confirmDeleteChurch = useCallback((church: ChurchSummary) => {
    setChurchDeleteState({ target: church, isSubmitting: false, error: null });
    setIsChurchDeleteOpen(true);
  }, []);

  const cancelDeleteChurch = useCallback(() => {
    setChurchDeleteState({ target: null, isSubmitting: false, error: null });
    setIsChurchDeleteOpen(false);
  }, []);

  const handleChurchEditFieldChange = useCallback(
    (field: 'name' | 'location') => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setChurchEditState((prev) => ({ ...prev, [field]: value, error: null }));
    },
    [],
  );

  const handleDistrictFieldChange = useCallback(
    (field: 'name' | 'location') => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setDistrictFormState((prev) => ({ ...prev, [field]: value, error: null }));
    },
    [],
  );

  const handleDistrictUnionChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setDistrictFormState((prev) => ({ ...prev, unionId: value, error: null }));
  }, []);

  const handlePastorFieldChange = useCallback(
    (
      field:
        | 'firstName'
        | 'lastName'
        | 'phoneNumber'
        | 'email'
        | 'districtId'
        | 'password'
        | 'confirmPassword',
    ) =>
      (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value = event.target.value;
        setPastorFormState((prev) => ({
          ...prev,
          [field]: value,
          error: null,
          success: null,
        }));
      },
    [],
  );

  const handlePastorActiveToggle = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { checked } = event.target;
    setPastorFormState((prev) => ({ ...prev, isActive: checked, error: null, success: null }));
  }, []);

  const handleDistrictSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!token) {
        setDistrictFormState((prev) => ({ ...prev, error: 'Authentication required to manage districts.' }));
        return;
      }

      const name = districtFormState.name.trim();
      const location = districtFormState.location.trim();

      if (!name) {
        setDistrictFormState((prev) => ({ ...prev, error: 'District name is required.' }));
        return;
      }

      setDistrictFormState((prev) => ({ ...prev, isSubmitting: true, error: null }));

      try {
        const unionIsValid = districtFormState.unionId && unionOptions.some((union) => union.id === districtFormState.unionId);

        if (districtFormState.mode === 'create') {
          const unionId =
            (unionIsValid ? districtFormState.unionId : unionOptions[0]?.id) ?? '';
          if (!unionId) {
            setDistrictFormState((prev) => ({
              ...prev,
              isSubmitting: false,
              error: 'Union context is required to create a district.',
            }));
            return;
          }

          const response = await createDistrictRequest(token, {
            unionId,
            name,
            location: location || undefined,
          });

          const summary = toDistrictSummary(response.district);

          setDistricts((prev) => sortDistricts([...prev.filter((item) => item.id !== summary.id), summary]));
          setCreateState((prev) => ({
            ...prev,
            districtId: prev.districtId || summary.id,
          }));
          setSelectedDistrictFilter((prev) => prev || summary.id);
          showFeedback('success', `Created district ${summary.name}.`);
        } else if (districtFormState.districtId) {
          const unionId = unionIsValid ? districtFormState.unionId : unionOptions[0]?.id;
          const response = await updateDistrictRequest(token, districtFormState.districtId, {
            name,
            location: location || undefined,
            unionId,
          });

          const summary = toDistrictSummary(response.district);

          setDistricts((prev) => sortDistricts(prev.map((item) => (item.id === summary.id ? summary : item))));
          setPastors((prev) =>
            prev.map((pastor) =>
              pastor.districtId === summary.id
                ? {
                    ...pastor,
                    district: {
                      id: summary.id,
                      name: summary.name,
                      unionId: summary.unionId,
                    },
                  }
                : pastor,
            ),
          );
          showFeedback('success', `Updated district ${summary.name}.`);
        }

        resetDistrictForm();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save district';
        setDistrictFormState((prev) => ({ ...prev, isSubmitting: false, error: message }));
        showFeedback('error', message);
      }
    },
    [
      token,
      districtFormState,
      user?.unionId,
      createDistrictRequest,
      sortDistricts,
      toDistrictSummary,
      showFeedback,
      resetDistrictForm,
      updateDistrictRequest,
      setSelectedDistrictFilter,
      unionOptions,
    ],
  );

  const handleDeleteDistrict = useCallback(async () => {
    if (!token || !districtDeleteState.target) {
      return;
    }

    setDistrictDeleteState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      await deleteDistrictRequest(token, districtDeleteState.target.id);

      setDistricts((prev) => prev.filter((district) => district.id !== districtDeleteState.target?.id));
      setPastors((prev) =>
        prev.map((pastor) =>
          pastor.districtId === districtDeleteState.target?.id
            ? { ...pastor, districtId: null, district: null }
            : pastor,
        ),
      );
      setChurchesByDistrict((prev) => {
        const next = { ...prev };
        delete next[districtDeleteState.target?.id ?? ''];
        return next;
      });
      setCreateState((prev) => ({
        ...prev,
        districtId: prev.districtId === districtDeleteState.target?.id ? '' : prev.districtId,
      }));
      setSelectedDistrictFilter((prev) => (prev === districtDeleteState.target?.id ? '' : prev));
      showFeedback('success', `Deleted district ${districtDeleteState.target?.name}.`);
      cancelDeleteDistrict();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete district';
      setDistrictDeleteState((prev) => ({ ...prev, isSubmitting: false, error: message }));
    }
  }, [
    token,
    districtDeleteState,
    deleteDistrictRequest,
    showFeedback,
    cancelDeleteDistrict,
  ]);

  const handlePastorSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!token) {
        setPastorFormState((prev) => ({ ...prev, error: 'Authentication required to manage pastors.' }));
        return;
      }

      const firstName = pastorFormState.firstName.trim();
      const lastName = pastorFormState.lastName.trim();
      const phoneNumber = pastorFormState.phoneNumber.trim();
      const email = pastorFormState.email.trim();
      const districtId = pastorFormState.districtId;

      if (!firstName || !lastName || !phoneNumber) {
        setPastorFormState((prev) => ({
          ...prev,
          error: 'First name, last name, and phone number are required.',
        }));
        return;
      }

      if (pastorFormState.mode === 'create') {
        if (!email || !districtId) {
          setPastorFormState((prev) => ({
            ...prev,
            error: 'Email and district are required to create a district pastor.',
          }));
          return;
        }

        const password = pastorFormState.password.trim();
        const confirmPassword = pastorFormState.confirmPassword.trim();

        if (!password || password.length < 8) {
          setPastorFormState((prev) => ({
            ...prev,
            error: 'Password must be at least 8 characters long.',
          }));
          return;
        }

        if (password !== confirmPassword) {
          setPastorFormState((prev) => ({
            ...prev,
            error: 'Passwords do not match.',
          }));
          return;
        }
      }

      if (pastorFormState.mode === 'edit' && !email) {
        setPastorFormState((prev) => ({
          ...prev,
          error: 'Email is required to update a district pastor.',
        }));
        return;
      }

      setPastorFormState((prev) => ({ ...prev, isSubmitting: true, error: null, success: null }));

      try {
        if (pastorFormState.mode === 'create') {
          const response = await createDistrictPastorRequest(token, {
            firstName,
            lastName,
            phoneNumber,
            email,
            districtId,
            password: pastorFormState.password,
          });

          setPastors((prev) => sortPastors([...prev, response.pastor]));
          setPastorFormState((prev) => ({
            ...prev,
            isSubmitting: false,
            success: `Created ${response.pastor.firstName} ${response.pastor.lastName}. Password was set during creation.`,
            phoneNumber,
            email,
            password: '',
            confirmPassword: '',
          }));
          showFeedback('success', `District pastor ${response.pastor.firstName} ${response.pastor.lastName} created.`);
        } else if (pastorFormState.pastor) {
          const response = await updateDistrictPastorRequest(token, pastorFormState.pastor.id, {
            firstName,
            lastName,
            phoneNumber,
            email: email || undefined,
            districtId: districtId || null,
            isActive: pastorFormState.isActive,
          });

          setPastors((prev) =>
            sortPastors(prev.map((pastor) => (pastor.id === response.pastor.id ? response.pastor : pastor))),
          );
          showFeedback('success', `Updated ${response.pastor.firstName} ${response.pastor.lastName}.`);
          resetPastorForm();
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save district pastor';
        setPastorFormState((prev) => ({ ...prev, isSubmitting: false, error: message }));
        showFeedback('error', message);
      }
    },
    [
      token,
      pastorFormState,
      createDistrictPastorRequest,
      sortPastors,
      showFeedback,
      updateDistrictPastorRequest,
      resetPastorForm,
    ],
  );

  const handleDeletePastor = useCallback(async () => {
    if (!token || !pastorDeleteState.target) {
      return;
    }

    setPastorDeleteState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      await deleteDistrictPastorRequest(token, pastorDeleteState.target.id);

      setPastors((prev) => prev.filter((pastor) => pastor.id !== pastorDeleteState.target?.id));
      setAssignState((prev) => (prev.pastor?.id === pastorDeleteState.target?.id ? initialAssignState : prev));
      showFeedback('success', `Deleted ${pastorDeleteState.target?.firstName} ${pastorDeleteState.target?.lastName}.`);
      cancelDeletePastor();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete district pastor';
      setPastorDeleteState((prev) => ({ ...prev, isSubmitting: false, error: message }));
    }
  }, [
    token,
    pastorDeleteState,
    deleteDistrictPastorRequest,
    showFeedback,
    cancelDeletePastor,
    setAssignState,
  ]);

  const handleUpdateChurch = useCallback(async () => {
    if (!token || !churchEditState.church) {
      return;
    }

    const name = churchEditState.name.trim();
    const location = churchEditState.location.trim();

    if (!name) {
      setChurchEditState((prev) => ({ ...prev, error: 'Church name is required.' }));
      return;
    }

    setChurchEditState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const response = await updateChurchRequest(token, churchEditState.church.id, {
        name,
        location: location || undefined,
      });

      setChurchesByDistrict((prev) => {
        const next = { ...prev };
        const districtId = response.church.districtId;
        if (districtId) {
          const churches = next[districtId] ?? [];
          const updatedList = churches.some((item) => item.id === response.church.id)
            ? churches.map((item) => (item.id === response.church.id ? response.church : item))
            : [...churches, response.church];
          next[districtId] = updatedList;
        }
        return next;
      });

      setPastors((prev) =>
        prev.map((pastor) => ({
          ...pastor,
          pastorChurches: pastor.pastorChurches.map((church) =>
            church.id === response.church.id ? response.church : church,
          ),
        })),
      );

      setChurchEditState(initialChurchEditState);
      setIsChurchEditOpen(false);
      showFeedback('success', `Updated ${response.church.name}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update church';
      setChurchEditState((prev) => ({ ...prev, isSubmitting: false, error: message }));
      showFeedback('error', message);
    }
  }, [token, churchEditState, showFeedback]);

  const handleDeleteChurch = useCallback(async () => {
    if (!token || !churchDeleteState.target) {
      return;
    }

    setChurchDeleteState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      await deleteChurchRequest(token, churchDeleteState.target.id);

      setChurchesByDistrict((prev) => {
        const next = { ...prev };
        const districtId = churchDeleteState.target?.districtId;
        if (districtId && next[districtId]) {
          next[districtId] = next[districtId].filter((church) => church.id !== churchDeleteState.target?.id);
        }
        return next;
      });

      setPastors((prev) =>
        prev.map((pastor) => ({
          ...pastor,
          pastorChurches: pastor.pastorChurches.filter((church) => church.id !== churchDeleteState.target?.id),
        })),
      );

      setChurchDeleteState({ target: null, isSubmitting: false, error: null });
      setIsChurchDeleteOpen(false);
      showFeedback('success', 'Church deleted successfully.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete church';
      setChurchDeleteState((prev) => ({ ...prev, isSubmitting: false, error: message }));
      showFeedback('error', message);
    }
  }, [token, churchDeleteState, showFeedback]);

  const handleCreateChurch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setCreateState((prev) => ({ ...prev, error: 'Authentication required to create a church.' }));
      return;
    }

    const districtId = createState.districtId;
    const name = createState.name.trim();
    const location = createState.location.trim();

    if (!districtId || !name) {
      setCreateState((prev) => ({ ...prev, error: 'District and church name are required.' }));
      return;
    }

    setCreateState((prev) => ({ ...prev, isSubmitting: true, error: null, success: null }));

    try {
      const church = await createChurchRequest(token, {
        districtId,
        name,
        location: location || undefined,
      });

      setChurchesByDistrict((prev) => {
        const next = { ...prev };
        const existing = next[districtId] ?? [];
        next[districtId] = [...existing.filter((item) => item.id !== church.id), church];
        return next;
      });

      setCreateState((prev) => ({
        ...prev,
        name: '',
        location: '',
        isSubmitting: false,
        success: `Church “${church.name}” created successfully.`,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create church';
      setCreateState((prev) => ({ ...prev, isSubmitting: false, error: message }));
      showFeedback('error', message);
    }
  };

  const openAssignModal = useCallback(
    async (pastor: DistrictPastorSummary) => {
      if (!token) {
        setAssignState({
          ...initialAssignState,
          error: 'Authentication required to assign churches.',
        });
        setIsAssignModalOpen(true);
        return;
      }

      if (!pastor.districtId) {
        setAssignState({
          pastor,
          selectedChurchIds: [],
          isSubmitting: false,
          isLoadingChurches: false,
          error: 'Assign this pastor to a district before linking churches.',
        });
        setIsAssignModalOpen(true);
        return;
      }

      setAssignState({
        pastor,
        selectedChurchIds: pastor.pastorChurches.map((church) => church.id),
        isSubmitting: false,
        isLoadingChurches: true,
        error: null,
      });
      setIsAssignModalOpen(true);

      try {
        const churches = await fetchChurches(token, { districtId: pastor.districtId });
        setChurchesByDistrict((prev) => ({ ...prev, [pastor.districtId as string]: churches }));
        setAssignState((prev) =>
          prev.pastor?.id === pastor.id
            ? { ...prev, isLoadingChurches: false }
            : prev,
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load churches';
        setAssignState((prev) =>
          prev.pastor?.id === pastor.id
            ? { ...prev, isLoadingChurches: false, error: message }
            : prev,
        );
        showFeedback('error', message);
      }
    },
    [token],
  );

  const closeAssignModal = useCallback(() => {
    setAssignState(initialAssignState);
    setIsAssignModalOpen(false);
  }, []);

  const toggleChurchSelection = useCallback((churchId: string) => {
    setAssignState((prev) => {
      if (!prev.pastor) {
        return prev;
      }

      const isSelected = prev.selectedChurchIds.includes(churchId);
      const selectedChurchIds = isSelected
        ? prev.selectedChurchIds.filter((id) => id !== churchId)
        : [...prev.selectedChurchIds, churchId];

      return { ...prev, selectedChurchIds };
    });
  }, []);

  const handleAssignSubmit = useCallback(async () => {
    if (!token || !assignState.pastor) {
      return;
    }

    if (!assignState.pastor.districtId) {
      setAssignState((prev) => ({ ...prev, error: 'Pastor must belong to a district first.' }));
      return;
    }

    setAssignState((prev) => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const updated = await assignChurchesToPastor(token, assignState.pastor.id, assignState.selectedChurchIds);

      setPastors((prev) => prev.map((pastor) => (pastor.id === updated.id ? updated : pastor)));

      setAssignState(initialAssignState);
      setIsAssignModalOpen(false);
      showFeedback('success', `Updated assignments for ${updated.firstName} ${updated.lastName}.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign churches';
      setAssignState((prev) => ({ ...prev, isSubmitting: false, error: message }));
      showFeedback('error', message);
    }
  }, [assignState.pastor, assignState.selectedChurchIds, showFeedback, token]);

  const districtFormId = 'district-form';
  const pastorFormId = 'pastor-form';
  const churchEditFormId = 'church-edit-form';

  const districtModal = isDistrictModalOpen ? (
    <div style={modalOverlayStyle} role="dialog" aria-modal="true">
      <div style={modalBodyStyle}>
        <header
          style={{
            padding: '1.8rem 2rem',
            borderBottom: '1px solid rgba(24,76,140,0.12)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'grid', gap: '0.4rem' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--primary)' }}>
              {districtFormState.mode === 'create' ? 'Create district' : 'Edit district'}
            </h2>
            <p style={mutedText}>
              Capture the district identity so union leadership, pastors, and churches stay aligned.
            </p>
          </div>
          <button
            type="button"
            onClick={resetDistrictForm}
            style={{ ...buttonStyle('ghost'), padding: '0.45rem 1rem' }}
            disabled={districtFormState.isSubmitting}
          >
            Close
          </button>
        </header>
        <form id={districtFormId} onSubmit={handleDistrictSubmit} style={modalContentStyle}>
          <label style={fieldLabel}>
            Union
            <select
              value={districtFormState.unionId}
              onChange={handleDistrictUnionChange}
              style={selectStyle}
              disabled={districtFormState.isSubmitting || isLoadingUnions}
              required
            >
              <option value="">Select union</option>
              {unionOptions.map((union) => (
                <option key={union.id} value={union.id}>
                  {union.name}
                </option>
              ))}
            </select>
          </label>
          {!isLoadingUnions && unionOptions.length === 0 && (
            <div
              style={{
                padding: '1rem',
                borderRadius: '16px',
                background: 'rgba(24,76,140,0.08)',
                border: '1px solid rgba(24,76,140,0.2)',
              }}
            >
              <strong style={{ color: 'var(--primary)' }}>No unions available</strong>
              <p style={{ ...mutedText, margin: '0.4rem 0 0' }}>
                Create a union record first or switch to an account assigned to a union before creating districts.
              </p>
            </div>
          )}
          <label style={fieldLabel}>
            District name
            <input
              type="text"
              value={districtFormState.name}
              onChange={handleDistrictFieldChange('name')}
              style={textInputStyle}
              placeholder="E.g. Gasabo District"
              maxLength={120}
              required
            />
          </label>
          <label style={fieldLabel}>
            Location (optional)
            <input
              type="text"
              value={districtFormState.location}
              onChange={handleDistrictFieldChange('location')}
              style={textInputStyle}
              placeholder="City, region, or guidance"
              maxLength={160}
            />
          </label>
          <div style={{ fontSize: '0.85rem', color: 'rgba(24,76,140,0.65)' }}>
            Union context: <strong>{districtFormState.unionId || user?.unionId || 'Not set'}</strong>
          </div>
          {unionError && (
            <div
              style={{
                padding: '1rem',
                borderRadius: '16px',
                background: 'rgba(135,32,58,0.1)',
                border: '1px solid rgba(135,32,58,0.25)',
              }}
            >
              <strong style={{ color: '#87203a' }}>Unable to load unions</strong>
              <p style={{ ...mutedText, color: '#87203a', margin: '0.4rem 0 0' }}>{unionError}</p>
            </div>
          )}
          {districtFormState.error && (
            <div style={{
              padding: '1rem',
              borderRadius: '16px',
              background: 'rgba(135,32,58,0.1)',
              border: '1px solid rgba(135,32,58,0.25)',
            }}>
              <strong style={{ color: '#87203a' }}>Unable to save district</strong>
              <p style={{ ...mutedText, color: '#87203a', margin: '0.4rem 0 0' }}>{districtFormState.error}</p>
            </div>
          )}
        </form>
        <footer style={modalFooterStyle}>
          <button
            type="button"
            onClick={resetDistrictForm}
            style={buttonStyle('ghost')}
            disabled={districtFormState.isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form={districtFormId}
            style={buttonStyle()}
            disabled={districtFormState.isSubmitting}
          >
            {districtFormState.isSubmitting
              ? districtFormState.mode === 'create'
                ? 'Creating…'
                : 'Updating…'
              : districtFormState.mode === 'create'
                ? 'Create district'
                : 'Save changes'}
          </button>
        </footer>
      </div>
    </div>
  ) : null;

  const districtDeleteModal = isDistrictDeleteOpen && districtDeleteState.target ? (
    <div style={modalOverlayStyle} role="alertdialog" aria-modal="true">
      <div style={modalBodyStyle}>
        <header
          style={{
            padding: '1.8rem 2rem',
            borderBottom: '1px solid rgba(24,76,140,0.12)',
          }}
        >
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', color: '#87203a' }}>Delete district</h2>
        </header>
        <div style={modalContentStyle}>
          <p style={mutedText}>
            Removing <strong>{districtDeleteState.target.name}</strong> will detach every linked pastor and church. You can reassign them later.
          </p>
          {districtDeleteState.error && (
            <p style={{ ...mutedText, color: '#87203a' }}>{districtDeleteState.error}</p>
          )}
        </div>
        <footer style={modalFooterStyle}>
          <button
            type="button"
            onClick={cancelDeleteDistrict}
            style={buttonStyle('ghost')}
            disabled={districtDeleteState.isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeleteDistrict}
            style={buttonStyle('danger')}
            disabled={districtDeleteState.isSubmitting}
          >
            {districtDeleteState.isSubmitting ? 'Deleting…' : 'Delete district'}
          </button>
        </footer>
      </div>
    </div>
  ) : null;

  const pastorModal = isPastorModalOpen ? (
    <div style={modalOverlayStyle} role="dialog" aria-modal="true">
      <div style={modalBodyStyle}>
        <header
          style={{
            padding: '1.8rem 2rem',
            borderBottom: '1px solid rgba(24,76,140,0.12)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'grid', gap: '0.35rem' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--primary)' }}>
              {pastorFormState.mode === 'create' ? 'Create district pastor' : 'Edit district pastor'}
            </h2>
            <p style={mutedText}>
              Manage leadership credentials and coverage.
            </p>
          </div>
          <button
            type="button"
            onClick={resetPastorForm}
            style={{ ...buttonStyle('ghost'), padding: '0.45rem 1rem' }}
            disabled={pastorFormState.isSubmitting}
          >
            Close
          </button>
        </header>
        <form id={pastorFormId} onSubmit={handlePastorSubmit} style={modalContentStyle}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <label style={fieldLabel}>
              First name
              <input
                type="text"
                value={pastorFormState.firstName}
                onChange={handlePastorFieldChange('firstName')}
                style={textInputStyle}
                placeholder="E.g. Emmanuel"
                maxLength={60}
                required
              />
            </label>
            <label style={fieldLabel}>
              Last name
              <input
                type="text"
                value={pastorFormState.lastName}
                onChange={handlePastorFieldChange('lastName')}
                style={textInputStyle}
                placeholder="E.g. Ndayisenga"
                maxLength={60}
                required
              />
            </label>
            <label style={fieldLabel}>
              Phone number
              <input
                type="tel"
                value={pastorFormState.phoneNumber}
                onChange={handlePastorFieldChange('phoneNumber')}
                style={textInputStyle}
                placeholder="E.g. +250788000000"
                maxLength={30}
                required
              />
            </label>
            <label style={fieldLabel}>
              Email
              <input
                type="email"
                value={pastorFormState.email}
                onChange={handlePastorFieldChange('email')}
                style={textInputStyle}
                placeholder="name@example.com"
                required={pastorFormState.mode === 'create'}
              />
            </label>
            <label style={fieldLabel}>
              District
              <select
                value={pastorFormState.districtId}
                onChange={handlePastorFieldChange('districtId')}
                style={selectStyle}
                required={pastorFormState.mode === 'create'}
              >
                <option value="">Unassigned</option>
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
            </label>
            {pastorFormState.mode === 'create' && (
              <>
                <label style={fieldLabel}>
                  Password
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={pastorFormState.password}
                      onChange={handlePastorFieldChange('password')}
                      style={{
                        ...textInputStyle,
                        paddingRight: '3rem',
                        width: '100%'
                      }}
                      placeholder="Set an initial password"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        color: 'var(--muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                    </button>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(24,76,140,0.65)', fontWeight: 400 }}>
                    Must be at least 8 characters. Share securely with the pastor.
                  </span>
                </label>
                <label style={fieldLabel}>
                  Confirm password
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={pastorFormState.confirmPassword}
                      onChange={handlePastorFieldChange('confirmPassword')}
                      style={{
                        ...textInputStyle,
                        paddingRight: '3rem',
                        width: '100%'
                      }}
                      placeholder="Re-enter password"
                      minLength={8}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '0.25rem',
                        color: 'var(--muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showConfirmPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                    </button>
                  </div>
                </label>
              </>
            )}
            {pastorFormState.mode === 'edit' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={pastorFormState.isActive}
                  onChange={handlePastorActiveToggle}
                  style={{ width: '1.1rem', height: '1.1rem' }}
                />
                Pastor is active
              </label>
            )}
            {pastorFormState.error && (
              <div style={{
                padding: '1rem',
                borderRadius: '16px',
                background: 'rgba(135,32,58,0.1)',
                border: '1px solid rgba(135,32,58,0.25)',
              }}>
                <strong style={{ color: '#87203a' }}>Unable to save pastor</strong>
                <p style={{ ...mutedText, color: '#87203a', margin: '0.4rem 0 0' }}>{pastorFormState.error}</p>
              </div>
            )}
            {pastorFormState.success && (
              <div style={{
                padding: '1rem',
                borderRadius: '16px',
                background: 'rgba(31,157,119,0.12)',
                border: '1px solid rgba(31,157,119,0.32)',
                display: 'grid',
                gap: '0.5rem',
              }}>
                <strong style={{ color: '#1f9d77' }}>Success</strong>
                <p style={{ ...mutedText, color: '#1f9d77', margin: 0 }}>{pastorFormState.success}</p>
              </div>
            )}
          </div>
        </form>
        <footer style={modalFooterStyle}>
          <button
            type="button"
            onClick={resetPastorForm}
            style={buttonStyle('ghost')}
            disabled={pastorFormState.isSubmitting}
          >
            {pastorFormState.mode === 'create' && pastorFormState.success ? 'Done' : 'Cancel'}
          </button>
          <button
            type="submit"
            form={pastorFormId}
            style={buttonStyle()}
            disabled={pastorFormState.isSubmitting}
          >
            {pastorFormState.isSubmitting
              ? pastorFormState.mode === 'create'
                ? 'Creating…'
                : 'Updating…'
              : pastorFormState.mode === 'create'
                ? 'Create pastor'
                : 'Save changes'}
          </button>
        </footer>
      </div>
    </div>
  ) : null;

  const pastorDeleteModal = isPastorDeleteOpen && pastorDeleteState.target ? (
    <div style={modalOverlayStyle} role="alertdialog" aria-modal="true">
      <div style={modalBodyStyle}>
        <header
          style={{
            padding: '1.8rem 2rem',
            borderBottom: '1px solid rgba(24,76,140,0.12)',
          }}
        >
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', color: '#87203a' }}>Remove district pastor</h2>
        </header>
        <div style={modalContentStyle}>
          <p style={mutedText}>
            Are you sure you want to delete{' '}
            <strong>
              {pastorDeleteState.target.firstName} {pastorDeleteState.target.lastName}
            </strong>
            ? Their access will be revoked immediately.
          </p>
          {pastorDeleteState.error && (
            <p style={{ ...mutedText, color: '#87203a' }}>{pastorDeleteState.error}</p>
          )}
        </div>
        <footer style={modalFooterStyle}>
          <button
            type="button"
            onClick={cancelDeletePastor}
            style={buttonStyle('ghost')}
            disabled={pastorDeleteState.isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeletePastor}
            style={buttonStyle('danger')}
            disabled={pastorDeleteState.isSubmitting}
          >
            {pastorDeleteState.isSubmitting ? 'Deleting…' : 'Delete pastor'}
          </button>
        </footer>
      </div>
    </div>
  ) : null;

  const availableAssignChurches = assignState.pastor?.districtId
    ? churchesByDistrict[assignState.pastor.districtId] ?? []
    : [];

  const assignModal = isAssignModalOpen && assignState.pastor ? (
    <div style={modalOverlayStyle} role="dialog" aria-modal="true">
      <div style={{ ...modalBodyStyle, width: 'min(720px, 100%)' }}>
        <header
          style={{
            padding: '1.8rem 2rem',
            borderBottom: '1px solid rgba(24,76,140,0.12)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'grid', gap: '0.35rem' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--primary)' }}>
              Manage churches for {assignState.pastor.firstName} {assignState.pastor.lastName}
            </h2>
            <p style={mutedText}>Toggle the congregations this pastor is responsible for.</p>
          </div>
          <button
            type="button"
            onClick={closeAssignModal}
            style={{ ...buttonStyle('ghost'), padding: '0.45rem 1rem' }}
            disabled={assignState.isSubmitting}
          >
            Close
          </button>
        </header>
        <div style={modalContentStyle}>
          {assignState.error && (
            <div style={{
              padding: '1rem',
              borderRadius: '16px',
              background: 'rgba(135,32,58,0.1)',
              border: '1px solid rgba(135,32,58,0.25)',
            }}>
              <strong style={{ color: '#87203a' }}>Assignment blocked</strong>
              <p style={{ ...mutedText, color: '#87203a', margin: '0.4rem 0 0' }}>{assignState.error}</p>
            </div>
          )}
          {assignState.isLoadingChurches ? (
            <p style={mutedText}>Loading churches for this district…</p>
          ) : availableAssignChurches.length === 0 ? (
            <p style={mutedText}>
              No churches found for this district yet. Create one to start assigning coverage.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '320px', overflowY: 'auto' }}>
              {availableAssignChurches.map((church) => {
                const checked = assignState.selectedChurchIds.includes(church.id);
                return (
                  <label
                    key={church.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: '16px',
                      border: checked
                        ? '2px solid var(--accent)'
                        : '1px solid rgba(24,76,140,0.16)',
                      background: checked ? 'rgba(24,76,140,0.08)' : 'var(--surface-primary)',
                      cursor: 'pointer',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ display: 'grid', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{church.name}</span>
                      {church.location && <span style={{ fontSize: '0.85rem', color: 'rgba(24,76,140,0.65)' }}>{church.location}</span>}
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleChurchSelection(church.id)}
                      style={{ width: '1.2rem', height: '1.2rem' }}
                    />
                  </label>
                );
              })}
            </div>
          )}
        </div>
        <footer style={modalFooterStyle}>
          <button
            type="button"
            onClick={closeAssignModal}
            style={buttonStyle('ghost')}
            disabled={assignState.isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssignSubmit}
            style={buttonStyle()}
            disabled={assignState.isSubmitting || assignState.isLoadingChurches}
          >
            {assignState.isSubmitting ? 'Saving assignments…' : 'Save assignments'}
          </button>
        </footer>
      </div>
    </div>
  ) : null;

  const editChurchModal = isChurchEditOpen && churchEditState.church ? (
    <div style={modalOverlayStyle} role="dialog" aria-modal="true">
      <div style={modalBodyStyle}>
        <header
          style={{
            padding: '1.8rem 2rem',
            borderBottom: '1px solid rgba(24,76,140,0.12)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'grid', gap: '0.35rem' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--primary)' }}>Edit church</h2>
            <p style={mutedText}>Update congregation identity or location.</p>
          </div>
          <button
            type="button"
            onClick={resetEditChurch}
            style={{ ...buttonStyle('ghost'), padding: '0.45rem 1rem' }}
            disabled={churchEditState.isSubmitting}
          >
            Close
          </button>
        </header>
        <form id={churchEditFormId} onSubmit={(event) => { event.preventDefault(); handleUpdateChurch(); }} style={modalContentStyle}>
          <label style={fieldLabel}>
            Church name
            <input
              type="text"
              value={churchEditState.name}
              onChange={handleChurchEditFieldChange('name')}
              style={textInputStyle}
              maxLength={120}
              required
            />
          </label>
          <label style={fieldLabel}>
            Location
            <input
              type="text"
              value={churchEditState.location}
              onChange={handleChurchEditFieldChange('location')}
              style={textInputStyle}
              maxLength={160}
            />
          </label>
          {churchEditState.error && (
            <p style={{ ...mutedText, color: '#87203a' }}>{churchEditState.error}</p>
          )}
        </form>
        <footer style={modalFooterStyle}>
          <button
            type="button"
            onClick={resetEditChurch}
            style={buttonStyle('ghost')}
            disabled={churchEditState.isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            form={churchEditFormId}
            style={buttonStyle()}
            disabled={churchEditState.isSubmitting}
          >
            {churchEditState.isSubmitting ? 'Saving…' : 'Save changes'}
          </button>
        </footer>
      </div>
    </div>
  ) : null;

  const deleteChurchModal = isChurchDeleteOpen && churchDeleteState.target ? (
    <div style={modalOverlayStyle} role="alertdialog" aria-modal="true">
      <div style={modalBodyStyle}>
        <header
          style={{
            padding: '1.8rem 2rem',
            borderBottom: '1px solid rgba(24,76,140,0.12)',
          }}
        >
          <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', color: '#87203a' }}>Delete church</h2>
        </header>
        <div style={modalContentStyle}>
          <p style={mutedText}>
            This will remove <strong>{churchDeleteState.target.name}</strong> from the union records.
          </p>
          {churchDeleteState.error && (
            <p style={{ ...mutedText, color: '#87203a' }}>{churchDeleteState.error}</p>
          )}
        </div>
        <footer style={modalFooterStyle}>
          <button
            type="button"
            onClick={cancelDeleteChurch}
            style={buttonStyle('ghost')}
            disabled={churchDeleteState.isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeleteChurch}
            style={buttonStyle('danger')}
            disabled={churchDeleteState.isSubmitting}
          >
            {churchDeleteState.isSubmitting ? 'Deleting…' : 'Delete church'}
          </button>
        </footer>
      </div>
    </div>
  ) : null;

  return (
    <>
      {districtModal}
      {districtDeleteModal}
      {pastorModal}
      {pastorDeleteModal}
      {assignModal}
      {editChurchModal}
      {deleteChurchModal}
      <RequireRole allowed="UNION_ADMIN">
        <div style={{ display: 'grid', gap: '1.5rem', padding: '0', width: '100%' }}>
          <div style={{ padding: '0' }}>

            {globalFeedback && (
              <div
                style={{
                  position: 'fixed',
                  top: '5.5rem',
                  right: '2.5rem',
                  zIndex: 95,
                  background: 'linear-gradient(135deg, rgba(24,76,140,0.92), rgba(67,153,213,0.92))',
                  color: '#fff',
                  padding: '1rem 1.25rem',
                  borderRadius: '18px',
                  boxShadow: '0 20px 40px rgba(24,76,140,0.25)',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'grid', gap: '0.25rem' }}>
                  <strong>{globalFeedback.type === 'success' ? 'Success' : 'Heads up'}</strong>
                  <span>{globalFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={dismissFeedback}
                  style={{ ...buttonStyle('ghost'), color: '#fff', borderColor: 'rgba(255,255,255,0.5)' }}
                >
                  Dismiss
                </button>
              </div>
            )}

            <section style={{ display: 'grid', gap: '2.5rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', color: 'var(--primary)' }}>Union leadership controls</h2>
                  <p style={mutedText}>Launch districts, onboard pastors, and align churches directly from this command center.</p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <button type="button" onClick={() => openPastorForm('create')} style={buttonStyle()}>
                    Add district pastor
                  </button>
                  <button type="button" onClick={() => openDistrictForm('create')} style={buttonStyle('ghost')}>
                    Create district
                  </button>
                </div>
              </div>

              {error && (
                <div
                  style={{
                    ...cardStyle,
                    border: '1px solid rgba(135,32,58,0.3)',
                    background: 'rgba(135,32,58,0.08)',
                  }}
                >
                  <strong style={{ color: '#87203a' }}>We hit a snag loading data</strong>
                  <p style={{ ...mutedText, color: '#87203a' }}>{error}</p>
                </div>
              )}

              <div style={actionsGridStyle}>
                <article style={{ ...cardStyle, gap: '1.5rem' }}>
                  <header style={{ display: 'grid', gap: '0.35rem' }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.16em',
                        color: 'rgba(24,76,140,0.6)',
                      }}
                    >
                      Create new church
                    </span>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.55rem', color: 'var(--primary)' }}>
                      Launch congregation record
                    </h3>
                    <p style={mutedText}>
                      Register a church within a district so members, admins, and district pastors can collaborate seamlessly.
                    </p>
                  </header>

                  <form onSubmit={handleCreateChurch} style={{ display: 'grid', gap: '1rem' }}>
                    <label style={fieldLabel}>
                      District
                      <select
                        name="districtId"
                        value={createState.districtId}
                        onChange={handleCreateFieldChange('districtId')}
                        style={selectStyle}
                        disabled={createState.isSubmitting || districts.length === 0}
                        required
                      >
                        {districts.length === 0 && <option value="">No districts available</option>}
                        {districts.map((district) => (
                          <option key={district.id} value={district.id}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label style={fieldLabel}>
                      Church name
                      <input
                        type="text"
                        name="name"
                        value={createState.name}
                        onChange={handleCreateFieldChange('name')}
                        style={textInputStyle}
                        placeholder="E.g. Remera SDA Church"
                        maxLength={120}
                        disabled={createState.isSubmitting}
                        required
                      />
                    </label>
                    <label style={fieldLabel}>
                      Location (optional)
                      <input
                        type="text"
                        name="location"
                        value={createState.location}
                        onChange={handleCreateFieldChange('location')}
                        style={textInputStyle}
                        placeholder="City, sector, or GPS clue"
                        maxLength={160}
                        disabled={createState.isSubmitting}
                      />
                    </label>

                    {createState.error && (
                      <div style={{ ...cardStyle, background: 'rgba(135,32,58,0.08)', border: '1px solid rgba(135,32,58,0.25)' }}>
                        <strong style={{ color: '#87203a' }}>Unable to create church</strong>
                        <p style={{ ...mutedText, color: '#87203a' }}>{createState.error}</p>
                      </div>
                    )}
                    {createState.success && (
                      <div style={{ ...cardStyle, background: 'rgba(31,157,119,0.12)', border: '1px solid rgba(31,157,119,0.32)' }}>
                        <strong style={{ color: '#1f9d77' }}>Success</strong>
                        <p style={{ ...mutedText, color: '#1f9d77' }}>{createState.success}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      style={{ ...buttonStyle(), justifySelf: 'flex-start' }}
                      disabled={createState.isSubmitting || districts.length === 0}
                    >
                      {createState.isSubmitting ? 'Saving church…' : 'Create church'}
                    </button>
                  </form>
                </article>

                <article
                  style={{
                    ...cardStyle,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'grid', gap: '0.45rem' }}>
                    <span style={{ fontSize: '0.75rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(24,76,140,0.6)' }}>
                      District filter
                    </span>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--primary)' }}>
                      Focus on specific coverage
                    </h3>
                    <p style={mutedText}>
                      Quickly isolate a district to review roster health, assignments, and church coverage.
                    </p>
                  </div>
                  <select
                    value={selectedDistrictFilter}
                    onChange={(event) => setSelectedDistrictFilter(event.target.value)}
                    style={{ ...selectStyle, fontSize: '1rem' }}
                    disabled={isLoading || districts.length === 0}
                  >
                    <option value="">All districts</option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(11,31,51,0.6)' }}>
                    {selectedDistrictFilter
                      ? `Viewing roster for ${districts.find((d) => d.id === selectedDistrictFilter)?.name ?? 'selected district'}`
                      : 'Showing leadership across the entire union'}
                  </div>
                </article>
              </div>

              <section style={{ display: 'grid', gap: '1.75rem' }}>
                <header style={rosterHeaderStyle}>
                  <div style={{ display: 'grid', gap: '0.35rem' }}>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--primary)' }}>
                      District pastor roster
                    </h3>
                    <p style={mutedText}>Review assignments, coverage, and manage churches for each district leader.</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => openPastorForm('create')} style={buttonStyle()}>
                      Invite district pastor
                    </button>
                    <button type="button" onClick={() => openAssignModal(filteredPastors[0]!)} style={{ ...buttonStyle('ghost'), opacity: filteredPastors.length === 0 ? 0.4 : 1 }} disabled={filteredPastors.length === 0}>
                      Quick assign churches
                    </button>
                  </div>
                </header>

                <div style={rosterListStyle}>
                  {isLoading ? (
                    <div style={{ ...cardStyle, alignItems: 'center', textAlign: 'center' }}>
                      <strong>Loading district pastors…</strong>
                      <p style={mutedText}>Fetching leadership roster and linked churches.</p>
                    </div>
                  ) : filteredPastors.length === 0 ? (
                    <div style={{ ...cardStyle, background: 'rgba(24,76,140,0.06)' }}>
                      <strong>No district pastors match the current filters</strong>
                      <p style={mutedText}>
                        Create a district pastor or adjust the district filter to view existing assignments.
                      </p>
                    </div>
                  ) : (
                    filteredPastors.map((pastor) => {
                      const district = districts.find((item) => item.id === pastor.districtId);
                      const churches = pastor.pastorChurches;
                      return (
                        <article key={pastor.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '1.5rem', display: 'grid', gap: '1rem' }}>
                          <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
                            <div style={{ display: 'grid', gap: '0.25rem' }}>
                              <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.35rem', color: 'var(--primary)' }}>
                                {pastor.firstName} {pastor.lastName}
                              </h3>
                              <span style={mutedText}>{pastor.email ?? 'No email on file'} • {pastor.phoneNumber}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <span
                                style={{
                                  ...badgeStyle(),
                                  background: pastor.isActive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(17,17,17,0.03)',
                                  border: '1px solid rgba(17,17,17,0.12)',
                                  color: pastor.isActive ? '#22c55e' : 'rgba(17,17,17,0.55)',
                                }}
                              >
                                {pastor.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: 'rgba(24,76,140,0.65)' }}>
                                Created {new Date(pastor.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </header>
                          <div style={{ display: 'grid', gap: '0.6rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                              <strong style={{ color: 'var(--primary)' }}>District:</strong>
                              <span style={{ ...chipStyle, background: '#fef3c7', color: '#92400e', borderColor: '#f59e0b' }}><IconMapPin size={14} /> {district?.name ?? 'Unassigned'}</span>
                            </div>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                              <strong style={{ color: 'var(--primary)' }}>Assigned churches</strong>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {churches.length === 0 ? (
                                  <span style={{ color: '#dc2626', background: 'transparent', border: 'none' }}>
                                    No churches linked yet
                                  </span>
                                ) : (
                                  churches.map((church) => (
                                    <div key={church.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <span style={chipStyle}>{church.name}</span>
                                      <button
                                        type="button"
                                        onClick={() => startEditChurch(church)}
                                        style={{ ...buttonStyle('ghost'), padding: '0.35rem 0.75rem' }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => confirmDeleteChurch(church)}
                                        style={{ ...buttonStyle('danger'), padding: '0.35rem 0.75rem' }}
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                          <footer style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button type="button" onClick={() => openPastorForm('edit', pastor)} style={buttonStyle('ghost')}>
                              Edit details
                            </button>
                            <button type="button" onClick={() => openAssignModal(pastor)} style={buttonStyle()}>
                              Manage church assignments
                            </button>
                          </footer>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            </section>
          </div>
        </div>
      </RequireRole>
    </>
  );
}

export default DistrictPastorsPage;
