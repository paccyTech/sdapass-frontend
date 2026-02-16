'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

import { toast } from '@/components/ui/use-toast';

export function LoginNotice() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const reason = searchParams.get('reason');

    if (reason === 'session') {
      toast({
        title: 'Session expired',
        description: 'Please sign in again to continue.',
        variant: 'default',
      });
    }
  }, [searchParams]);

  return null;
}
