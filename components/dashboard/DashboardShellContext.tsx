'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { NavSection, SidebarSection } from './DashboardShell';

export type DashboardShellOverrides = {
  hero?: ReactNode;
  toolbar?: ReactNode;
  navSections?: NavSection[];
  sidebarSections?: SidebarSection[];
  sidebarLogo?: ReactNode;
};

type DashboardShellContextValue = {
  overrides: DashboardShellOverrides;
  setOverrides: (overrides: DashboardShellOverrides) => void;
  clearOverrides: () => void;
};

const DashboardShellContext = createContext<DashboardShellContextValue | undefined>(undefined);

const shallowEqualOverrides = (
  prev: DashboardShellOverrides,
  next: DashboardShellOverrides,
): boolean => {
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  for (const key of prevKeys) {
    if (prev[key as keyof DashboardShellOverrides] !== next[key as keyof DashboardShellOverrides]) {
      return false;
    }
  }

  return true;
};

export const DashboardShellProvider = ({ children }: { children: ReactNode }) => {
  const [overrides, setOverridesState] = useState<DashboardShellOverrides>({});

  const setOverrides = useCallback((next: DashboardShellOverrides) => {
    setOverridesState((current) => {
      if (shallowEqualOverrides(current, next)) {
        return current;
      }
      return { ...next };
    });
  }, []);

  const clearOverrides = useCallback(() => {
    setOverridesState((current) => {
      if (!Object.keys(current).length) {
        return current;
      }
      return {};
    });
  }, []);

  const value = useMemo(
    () => ({
      overrides,
      setOverrides,
      clearOverrides,
    }),
    [overrides, setOverrides, clearOverrides],
  );

  return <DashboardShellContext.Provider value={value}>{children}</DashboardShellContext.Provider>;
};

export const useDashboardShellContext = () => {
  const context = useContext(DashboardShellContext);
  if (!context) {
    throw new Error('useDashboardShellContext must be used within a DashboardShellProvider');
  }
  return context;
};

export const useDashboardShellConfig = (config?: DashboardShellOverrides) => {
  const { setOverrides, clearOverrides } = useDashboardShellContext();

  useEffect(() => {
    if (config && Object.keys(config).length > 0) {
      setOverrides(config);
    } else {
      clearOverrides();
    }

    return () => {
      clearOverrides();
    };
  }, [config, setOverrides, clearOverrides]);
};
