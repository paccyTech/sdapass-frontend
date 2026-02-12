'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearAuthSession } from '@/lib/auth';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Clear the authentication session
    clearAuthSession();
    
    // Redirect to login page
    router.push('/login');
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Signing out...</h2>
        <p style={{ margin: 0, color: '#64748b' }}>Please wait while we sign you out.</p>
      </div>
    </div>
  );
}
