"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiUsers, FiCalendar, FiUserCheck, FiUserX } from 'react-icons/fi';

export default function ChurchAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeThisMonth: 0,
    attendanceRate: 0,
    pendingApprovals: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch these stats from your API
    const fetchStats = async () => {
      try {
        // Replace with actual API call
        // const response = await fetch('/api/church/stats');
        // const data = await response.json();
        // setStats(data);
        
        // Mock data for now
        setStats({
          totalMembers: 150,
          activeThisMonth: 120,
          attendanceRate: 80,
          pendingApprovals: 5
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Members',
      value: stats.totalMembers,
      icon: <FiUsers size={24} />,
      color: 'bg-blue-500'
    },
    {
      title: 'Active This Month',
      value: stats.activeThisMonth,
      icon: <FiCalendar size={24} />,
      color: 'bg-green-500'
    },
    {
      title: 'Attendance Rate',
      value: `${stats.attendanceRate}%`,
      icon: <FiUserCheck size={24} />,
      color: 'bg-purple-500'
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: <FiUserX size={24} />,
      color: 'bg-yellow-500'
    }
  ];

  return (
    <div style={{ padding: '1.5rem', backgroundColor: 'var(--shell-bg)', color: 'var(--shell-foreground)' }}>
      <h1 style={{ 
        fontSize: '1.875rem', 
        fontWeight: 600, 
        marginBottom: '1.5rem',
        color: 'var(--shell-foreground)'
      }}>
        Church Dashboard
      </h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(1, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'var(--surface-primary)',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(8, 22, 48, 0.12)',
          padding: '1.5rem'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: 'var(--shell-foreground)'
          }}>
            Quick Stats
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(1, 1fr)',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            {statCards.map((stat, index) => (
              <div 
                key={index}
                style={{
                  backgroundColor: 'var(--surface-soft)',
                  borderRadius: '0.5rem',
                  padding: '1.25rem',
                  boxShadow: '0 1px 2px 0 rgba(8, 22, 48, 0.08)',
                  border: '1px solid var(--surface-border)',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(8, 22, 48, 0.16)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(8, 22, 48, 0.08)';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: 'var(--muted)',
                    fontWeight: 500
                  }}>
                    {stat.title}
                  </span>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--on-primary)',
                    backgroundColor: stat.color
                  }}>
                    {stat.icon}
                  </div>
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--shell-foreground)'
                }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div style={{
        backgroundColor: 'var(--surface-primary)',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(8, 22, 48, 0.12)',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          marginBottom: '1rem',
          color: 'var(--shell-foreground)'
        }}>
          Recent Activity
        </h2>
        <p style={{ color: 'var(--muted)' }}>
          Recent member activities will be displayed here.
        </p>
      </div>
    </div>
  );
}
