import Link from "next/link";
import type { CSSProperties } from "react";
import LoginForm from "./LoginForm";
import Image from "next/image";

const LoginPage = () => (
  <div style={wrapperStyle}>
    <div style={leftPanelStyle}>
      <div className="fade-up" style={contentContainerStyle}>
        <div style={logoContainerStyle}>
          <Image 
            src="/sda-white-logo.png" 
            alt="SDA Logo" 
            width={200} 
            height={200} 
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
        <div style={contentStyle}>
          <h1 style={titleStyle}>Secure access, simplified</h1>
          <p style={subtitleStyle}>
            Sign in with confidence knowing your SDA credentials stay protected across every ministry workflow.
          </p>
        </div>
      </div>
      <div style={footerStyle}>
        <Link href="/" style={linkStyle}>
          ← Back to Home
        </Link>
      </div>
    </div>

    {/* Right side with login form */}
    <div className="fade-up delay-1" style={rightPanelStyle}>
      <div style={formHeaderStyle}>
        <h2 style={formTitleStyle}>Welcome Back</h2>
        <p style={formSubtitleStyle}>Sign in to your account</p>
      </div>
      
      <LoginForm />
      
      <div style={formFooterStyle}>
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
  display: 'flex',
  minHeight: '100vh',
  width: '100%',
  overflow: 'hidden',
};

const leftPanelStyle: CSSProperties = {
  width: '50%',
  backgroundColor: '#0a1a2e',
  color: '#ffffff',
  padding: '3rem',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  minHeight: '100vh',
  backgroundImage: 'linear-gradient(135deg, #0a1a2e 0%, #1a365d 100%)',
};

const rightPanelStyle: CSSProperties = {
  width: '50%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: '3rem',
  backgroundColor: '#ffffff',
  overflowY: 'auto',
};

const contentContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  width: '100%',
  padding: '4rem 2rem 2rem',
};

const logoContainerStyle: CSSProperties = {
  marginBottom: '2.5rem',
  textAlign: 'center',
  width: '100%',
  maxWidth: '220px',
};

const contentStyle: CSSProperties = {
  maxWidth: '100%',
  margin: '0.5rem auto 0',
  textAlign: 'center',
  padding: 0,
};

const titleStyle: CSSProperties = {
  fontSize: '2.4rem',
  fontWeight: 700,
  margin: '0 0 1rem',
  lineHeight: 1.2,
};

const subtitleStyle: CSSProperties = {
  fontSize: '1.1rem',
  opacity: 0.88,
  lineHeight: 1.6,
  margin: 0,
};

const footerStyle: CSSProperties = {
  marginTop: 'auto',
  textAlign: 'center',
  paddingTop: '2rem',
};

const linkStyle: CSSProperties = {
  color: 'rgba(255, 255, 255, 0.8)',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  transition: 'opacity 0.2s',
};


const formHeaderStyle: CSSProperties = {
  textAlign: 'center',
  marginBottom: '2.5rem',
  maxWidth: '420px',
  marginLeft: 'auto',
  marginRight: 'auto',
};

const formTitleStyle: CSSProperties = {
  fontSize: '2rem',
  fontWeight: 700,
  color: '#1a202c',
  margin: '0 0 0.5rem',
};

const formSubtitleStyle: CSSProperties = {
  color: '#4a5568',
  margin: 0,
  fontSize: '1rem',
  lineHeight: 1.6,
};

const formFooterStyle: CSSProperties = {
  marginTop: '2rem',
  textAlign: 'center',
  maxWidth: '420px',
  marginLeft: 'auto',
  marginRight: 'auto',
};

const helpTextStyle: CSSProperties = {
  color: '#718096',
  fontSize: '0.9rem',
  margin: 0,
};

const helpLinkStyle: CSSProperties = {
  color: '#3b82f6',
  textDecoration: 'none',
  fontWeight: 600,
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
