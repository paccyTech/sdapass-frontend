import Link from "next/link";
import type { CSSProperties } from "react";
import LoginForm from "./LoginForm";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { User, Globe, ChevronDown } from 'lucide-react';

const LoginPage = () => (
  <div style={wrapperStyle}>
    <header style={headerStyle}>
      <div style={headerContent}>
        <div style={topNavLeft}>
          <div className="desktop-only" style={topNavMeta}>
            <div style={topNavMetaLink}>
              <User size={16} style={{ marginRight: '0.5rem' }} />
              <span>SDA Account</span>
            </div>
          </div>
        </div>
        <div style={topNavRight}>
          <div className="desktop-only" style={topNavMeta}>
            <div style={langPicker}>
              <Globe size={16} style={{ marginRight: '0.5rem' }} />
              <span>English</span>
              <ChevronDown size={16} style={{ marginLeft: '0.25rem' }} />
            </div>
          </div>
        </div>
      </div>
    </header>

    <div style={contentStyle}>
      <div style={logoContainerStyle}>
        <Image 
          src="/sda-logo.png" 
          alt="SDA Logo" 
          width={100}
          height={100}
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>
      
      <div style={formHeaderStyle}>
        <h2 style={formTitleStyle}>Welcome Back</h2>
        <p style={formSubtitleStyle}>Sign in to your account</p>
      </div>
      
      <div style={formContainer}>
        <LoginForm />
      </div>
      
      <div style={formFooterStyle}>
        <Link href="/" style={backLinkStyle}>
          ← Back to Home
        </Link>
        <p style={helpTextStyle}>
          Need help?{' '}
          <a href="#help" style={helpLinkStyle}>
            Contact support
          </a>
        </p>
      </div>
    </div>
  </div>
);

// Styles
const wrapperStyle: CSSProperties = {
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '0',
  maxWidth: '100%',
  backgroundColor: '#ffffff',
  fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const headerStyle: CSSProperties = {
  width: '100%',
  borderBottom: '1px solid #e2e8f0',
  padding: '0.75rem 2rem',
};

const headerContent: CSSProperties = {
  maxWidth: '1400px',
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
};

const contentStyle: CSSProperties = {
  width: '100%',
  maxWidth: '400px',
  margin: '2rem auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  backgroundColor: '#ffffff',
  flex: 1,
  padding: '0 1rem',
};

const topNavRight: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '1.25rem',
};

const topNavLeft: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: '1.25rem',
};

const topNavMeta: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1.5rem',
  fontSize: '1.1rem',
  color: '#4b5563',
};

const topNavMetaLink: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '0.35rem 0.5rem',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  fontWeight: 'bold',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
};

const langPicker: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  padding: '0.35rem 0.5rem',
  borderRadius: '0.25rem',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
};

const formContainer: CSSProperties = {
  width: '100%',
  marginTop: '1rem',
};

const logoContainerStyle: CSSProperties = {
  marginBottom: '1.5rem',
  textAlign: 'center',
  width: '100%',
};


const formHeaderStyle: CSSProperties = {
  textAlign: 'center',
  marginBottom: '1.5rem',
  width: '100%',
};

const formTitleStyle: CSSProperties = {
  fontSize: '1.75rem',
  fontWeight: 700,
  color: '#000000',
  margin: '0 0 0.5rem',
  lineHeight: 1.2,
  fontFamily: 'inherit',
};

const formSubtitleStyle: CSSProperties = {
  color: '#4a5568',
  margin: 0,
  fontSize: '1rem',
  lineHeight: 1.6,
  opacity: 0.9,
  fontFamily: 'inherit',
};

const formFooterStyle: CSSProperties = {
  marginTop: '2rem',
  textAlign: 'center',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  alignItems: 'center',
};

const backLinkStyle: CSSProperties = {
  color: '#1a56db',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '0.95rem',
  transition: 'opacity 0.2s',
  marginTop: '0.5rem',
  fontFamily: 'inherit',
};

// Add hover effect for the back link
const backLinkHoverStyle = {
  '&:hover': {
    opacity: 0.8,
  },
};

const helpTextStyle: CSSProperties = {
  color: '#6b7280',
  fontSize: '0.9rem',
  margin: '0.5rem 0 0',
  fontFamily: 'inherit',
};

const helpLinkStyle: CSSProperties = {
  color: '#1a56db',
  textDecoration: 'none',
  fontWeight: 500,
  transition: 'opacity 0.2s',
  fontFamily: 'inherit',
  '&:hover': {
    opacity: 0.8,
  },
};

const inputStyle: CSSProperties = {
  borderRadius: "16px",
  border: "1px solid rgba(12, 34, 56, 0.15)",
  padding: "0.95rem 1.1rem",
  fontSize: "1rem",
  background: "rgba(255,255,255,0.9)",
  outline: "none",
  transition: "border 0.2s ease, box-shadow 0.2s ease",
};

const submitStyle: CSSProperties = {
  borderRadius: "18px",
  border: "none",
  padding: "1rem 1.25rem",
  fontWeight: 600,
  fontSize: "1rem",
  color: "white",
  cursor: "pointer",
  background: "linear-gradient(135deg, #184c8c, #1f9d77)",
  boxShadow: "0 15px 25px rgba(24, 76, 140, 0.28)",
};

const outlineButtonStyle: CSSProperties = {
  border: "1px solid rgba(24, 76, 140, 0.4)",
  borderRadius: "14px",
  padding: "0.75rem 1.4rem",
  fontWeight: 600,
  color: "#184c8c",
  background: "#ffffff",
};

const ghostLinkStyle: CSSProperties = {
  color: "#64748b",
  fontWeight: 500,
};

const checkboxStyle: CSSProperties = {
  width: "16px",
  height: "16px",
  accentColor: "#1f9d77",
};

export default LoginPage;
