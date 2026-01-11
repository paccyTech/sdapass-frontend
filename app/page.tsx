'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <div style={pageContainerStyle}>
      <style>{hoverStyles}</style>
      <div style={overlayStyle}>
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '2.5rem clamp(1.5rem, 7vw, 7rem)',
            gap: '3.5rem',
          }}
        >
          <header style={headerStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flex: 1 }}>
              <Image 
                src="/sda-white-logo.png" 
                alt="Seventh-day Adventist logo" 
                width={72} 
                height={72} 
                priority 
                style={{ flexShrink: 0 }}
              />
              <nav className="desktop-nav" style={navStyle}>
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="nav-link" style={navLinkStyle}>
                    {link.label}
                  </Link>
                ))}
              </nav>
              <button 
                className="mobile-menu-button" 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
                style={{ marginLeft: 'auto' }}
              >
                ☰
              </button>
            </div>
            
            <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
              <nav className="desktop-nav" style={navStyle}>
                {navLinks.map((link) => (
                  <Link 
                    key={link.href} 
                    href={link.href} 
                    className="nav-link"
                    style={navLinkStyle}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link href="/login" className="secondary-button" style={secondaryButtonStyle}>
                  Login
                </Link>
              </nav>
            </div>
            
            <Link href="/login" className="secondary-button desktop-only" style={secondaryButtonStyle}>
              Login
            </Link>
          </header>

          <main style={mainStyle}>
            <div className="fade-up" style={heroContentStyle}>
              <div className="fade-up delay-1" style={highlightPillStyle}>
                <span style={{ fontSize: '1.2rem' }}>✨</span>
                Secure passes for Umuganda gatherings
              </div>
              <h1 className="fade-up delay-2" style={heroHeadingStyle}>
                Your{' '}
                <span style={heroAccentStyle}>SDA</span>
                {' '}Pass Management
              </h1>
              <p className="fade-up delay-3" style={heroCopyStyle}>
                Coordinate member registration, attendance, and QR access from a single, trusted command centre built for Rwanda Union churches.
              </p>
              <div className="fade-up delay-4" style={ctaContainerStyle}>
                <Link href="/login" className="primary-button" style={primaryButtonStyle}>
                  Enter Console
                </Link>
                <span style={ghostHintStyle}>Already trusted by Kigali congregations</span>
              </div>
            </div>
            
            <div className="scroll-cue">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M19 12l-7 7-7-7"/>
              </svg>
            </div>
          </main>
          
          <footer style={footerStyle}>
            <div style={optimizationNoteStyle}>
              <p>Optimized for fast loading with modern web standards</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

const navLinks = [
  { href: '#overview', label: 'Overview' },
  { href: '#features', label: 'Features' },
  { href: '#support', label: 'Support' },
];

// Buttons
const primaryButtonStyle: CSSProperties = {
  background: 'linear-gradient(135deg, #4463f7, #38b6ff)',
  color: 'white',
  padding: '1.1rem 2.2rem',
  borderRadius: '999px',
  fontWeight: 700,
  boxShadow: '0 20px 40px rgba(56, 182, 255, 0.4)',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  fontSize: '0.95rem',
  border: 'none',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-block',
};

const secondaryButtonStyle: CSSProperties = {
  padding: '0.75rem 1.6rem',
  borderRadius: '999px',
  border: '2px solid white',
  color: 'white',
  fontWeight: 'normal',
  letterSpacing: '0.05em',
  background: 'transparent',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.2s ease',
  textDecoration: 'none',
  display: 'inline-block',
};

// Layout
const pageContainerStyle: CSSProperties = {
  minHeight: '100vh',
  backgroundImage: "url('/Home.jpg')",
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  backgroundAttachment: 'fixed',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
};

const overlayStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  background: 'linear-gradient(120deg, rgba(5, 12, 22, 0.88), rgba(15, 40, 75, 0.88))',
  color: '#f6f8ff',
};

const headerStyle: CSSProperties = {
  position: 'relative',
  padding: '1.5rem clamp(1.5rem, 7vw, 7rem)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '2rem',
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
};

const logoNavContainerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.25rem',
};

const logoStyle: CSSProperties = {
  flexShrink: 0,
};

const navStyle: CSSProperties = {
  display: 'flex',
  gap: '1.5rem',
  fontSize: '0.95rem',
  color: 'rgba(245, 248, 255, 0.9)',
  fontWeight: 500,
  letterSpacing: '0.04em',
};

const mainStyle: CSSProperties = {
  flex: 1,
  display: 'grid',
  placeItems: 'center',
  textAlign: 'center',
  padding: '6rem 1.5rem 4rem',
  gap: '1.8rem',
  position: 'relative',
};

const heroContentStyle: CSSProperties = {
  display: 'grid',
  gap: '1.8rem',
  maxWidth: '800px',
  margin: '0 auto',
  padding: '0 1rem',
};

// Navigation
const navLinkStyle: CSSProperties = {
  color: 'rgba(245, 248, 255, 0.9)',
  textDecoration: 'none',
  position: 'relative',
  padding: '0.5rem 0',
  transition: 'color 0.2s ease',
};

// Components
const highlightPillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.75rem',
  padding: '0.6rem 1.5rem',
  borderRadius: '999px',
  background: 'rgba(68, 99, 247, 0.25)',
  border: '1px solid rgba(245, 248, 255, 0.2)',
  color: 'rgba(245, 248, 255, 0.95)',
  fontSize: '0.95rem',
  letterSpacing: '0.06em',
  maxWidth: 'fit-content',
  margin: '0 auto',
  backdropFilter: 'blur(4px)',
};

const heroHeadingStyle: CSSProperties = {
  margin: '0.5em 0',
  fontFamily: 'var(--font-display)',
  fontSize: 'clamp(2rem, 4vw + 0.5rem, 3.5rem)',
  letterSpacing: '0.05em',
  lineHeight: 1.1,
  textTransform: 'uppercase',
  fontWeight: 700,
  maxWidth: '100%',
  textShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
};

const heroAccentStyle: CSSProperties = {
  background: 'linear-gradient(120deg, #8a73ff, #58f2ff)', 
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  color: 'transparent',
  display: 'inline-block',
  padding: '0 0.25em',
};

const heroCopyStyle: CSSProperties = {
  margin: '0 auto',
  maxWidth: '38rem',
  color: 'rgba(240, 245, 255, 0.9)',
  fontSize: '1.15rem',
  lineHeight: 1.8,
  fontWeight: 400,
  textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
};

const ghostHintStyle: CSSProperties = {
  color: 'rgba(240, 245, 255, 0.7)',
  fontSize: '0.95rem',
  letterSpacing: '0.08em',
  marginTop: '0.5rem',
};

const ctaContainerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
  marginTop: '1rem',
};

const footerStyle: CSSProperties = {
  padding: '2rem',
  textAlign: 'center',
  marginTop: 'auto',
};

const optimizationNoteStyle: CSSProperties = {
  color: 'rgba(255, 255, 255, 0.3)',
  fontSize: '0.7rem',
  textAlign: 'center',
  marginTop: '2rem',
};

export default HomePage;

const hoverStyles = `
  .primary-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 25px 50px rgba(56, 182, 255, 0.5);
  }

  .secondary-button:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }

  .nav-link::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: white;
    transition: width 0.3s ease;
  }

  .nav-link:hover {
    color: white;
    text-decoration: none;
  }

  .nav-link:hover::after {
    width: 100%;
  }

  .desktop-only {
    display: none;
  }

  @media (min-width: 769px) {
    .desktop-only {
      display: inline-flex;
    }
  }
`;
