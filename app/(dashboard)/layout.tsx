'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { AuthUser } from '@/lib/auth';
import { AUTH_EVENT_KEY, readAuthSession } from '@/lib/auth';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import {
  DashboardShellProvider,
  useDashboardShellContext,
} from '@/components/dashboard/DashboardShellContext';

type DashboardLayoutProps = {
  children: React.ReactNode;
};

const DashboardShellRenderer = ({ user, children }: { user: AuthUser; children: React.ReactNode }) => {
  const { overrides } = useDashboardShellContext();
  const { hero, toolbar, navSections, sidebarSections, sidebarLogo } = overrides;

  return (
    <DashboardShell
      role={user.role}
      currentUser={user}
      hero={hero}
      toolbar={toolbar}
      navSections={navSections}
      sidebarSections={sidebarSections}
      sidebarLogo={sidebarLogo}
    >
      {children}
    </DashboardShell>
  );
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const syncFromStorage = () => {
      const { user: sessionUser } = readAuthSession();

      if (!sessionUser) {
        router.replace('/login');
        return;
      }

      setUser(sessionUser);
      setIsLoading(false);
    };

    syncFromStorage();

    window.addEventListener(AUTH_EVENT_KEY, syncFromStorage);

    return () => {
      window.removeEventListener(AUTH_EVENT_KEY, syncFromStorage);
    };
  }, [router]);

  if (isLoading || !user) {
    return null;
  }

  return (
    <DashboardShellProvider>
      <DashboardShellRenderer user={user}>
        <div style={{ 
          flex: 1,
          padding: '1.5rem',
          maxWidth: '100%',
          overflowX: 'hidden'
        }}>
          {children}
        </div>
      </DashboardShellRenderer>
    </DashboardShellProvider>
  );
}
