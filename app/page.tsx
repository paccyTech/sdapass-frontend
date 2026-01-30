'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import { ClipboardList, ShieldCheck, UsersRound } from 'lucide-react';

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div style={pageShell}>
      <style dangerouslySetInnerHTML={{ __html: responsiveOverrides }} />
      <header style={headerShell}>
        <div style={brandCluster}>
          <Image
            src="/sda-white-logo.png"
            alt="Seventh-day Adventist logo"
            width={58}
            height={58}
            priority
            style={{ flexShrink: 0 }}
          />
          <div style={brandTextBlock}>
            <span style={brandOverline}>SDA Rwanda</span>
            <span style={brandHeadline}>Pass Management</span>
          </div>
        </div>

        <nav className="desktop-nav" style={navStyle} aria-label="Primary navigation">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link" style={navLinkStyle}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div style={headerActions}>
          <button
            className="mobile-menu-button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-controls="primary-navigation"
            aria-label="Toggle navigation"
          >
            ☰
          </button>
          <Link href="/login" className="secondary-button desktop-only" style={secondaryButtonStyle}>
            Sign in
          </Link>
        </div>

        <div id="primary-navigation" className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <nav aria-label="Mobile primary navigation">
            <div style={mobileNavStack}>
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
              <Link href="/login" className="secondary-button" style={{ ...secondaryButtonStyle, width: '100%', textAlign: 'center' }}>
                Sign in to console
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <main style={mainStack}>
        <section id="overview" className="hero-section" style={heroSection}>
          <div className="hero-content" style={heroContent}>
            <div style={heroPrefix}>
              <span style={heroPrefixDot} />
              <span> oversight for Umuganda Pass</span>
            </div>
            <h1 style={heroTitle}>
              Where every gathering earns a verifiable digital footprint
            </h1>
            <p style={heroDescription}>
              Coordinate district, church, and member flows from one observant console. Issue traceable QR passes, monitor compliance in real time, and uphold transparency across Rwanda Union congregations.
            </p>
            <div className="hero-actions" style={heroActions}>
              <Link href="/login" className="primary-button" style={primaryButtonStyle}>
                Launch admin console
              </Link>
            </div>
          </div>

          <div className="hero-visual" style={heroVisual}>
            <div className="pass-backdrop" style={passCardBackdrop}>
              <div style={passCard}>
                <div style={passHeader}>
                  <span style={passHeaderBadge}>Event credential</span>
                  <span style={passHeaderTime}>Service Window · 08:00</span>
                </div>
                <div style={passIdentity}>
                  <div style={passAvatar}>JN</div>
                  <div>
                    <p style={passName}>Jordan Niyonsaba</p>
                    <span style={passRole}>Volunteer · Ridge Sector</span>
                  </div>
                </div>
                <div style={passDivider} />
                <div style={passMetaRow}>
                  <div style={metaBlock}>
                    <span style={metaLabel}>Supervisor</span>
                    <span style={metaValue}>L. Habimana</span>
                  </div>
                  <div style={metaBlock}>
                    <span style={metaLabel}>Cleared by</span>
                    <span style={metaValue}>Review Desk · 2145</span>
                  </div>
                </div>
                <div style={qrBadge}>QR READY</div>
              </div>
              <div style={glowOrb} />
              <div style={signalPill}>
                <span style={signalPrimary}>Response capacity: 88%</span>
                <span style={signalSecondary}>No issues flagged</span>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="feature-section" style={featureSection}>
          <header style={sectionHeader}>
            <span style={sectionEyebrow}>Why leadership teams adopt SDA Pass Management</span>
            <h2 style={sectionTitle}>Designed for layered governance, disciplined reporting, and trust in public spaces</h2>
            <p style={sectionDescription}>
              Built in collaboration with union administrators, district pastors, and compliance officers to honour accountability while simplifying attendance logistics.
            </p>
          </header>
          <div className="feature-grid" style={featureGrid}>
            {featureCards.map((card) => (
              <article key={card.title} style={featureCard}>
                <div style={featureIcon}>{card.icon}</div>
                <h3 style={featureHeading}>{card.title}</h3>
                <p style={featureBody}>{card.copy}</p>
                <ul style={featureList}>
                  {card.points.map((point) => (
                    <li key={point} style={featureListItem}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="workflows" className="workflow-section" style={workflowSection}>
          <div className="workflow-shell" style={workflowShell}>
            <h2 style={workflowTitle}>Role-aware workflows stitched together</h2>
            <div className="workflow-timeline" style={workflowTimeline}>
              {workflowSteps.map((step, index) => (
                <div key={step.title} style={timelineItem}>
                  <div style={timelineMarker}>
                    <span style={timelineIndex}>{index + 1}</span>
                  </div>
                  <div style={timelineContent}>
                    <h3 style={timelineHeading}>{step.title}</h3>
                    <p style={timelineCopy}>{step.description}</p>
                    <div style={timelineTags}>
                      {step.tags.map((tag) => (
                        <span key={tag} style={timelineTag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <aside className="workflow-aside" style={workflowAside}>
            <h3 style={asideHeading}>Safeguards baked in</h3>
            <ul style={asideList}>
              {safeguards.map((item) => (
                <li key={item} style={asideItem}>{item}</li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="cta-section" style={ctaSection}>
          <div className="cta-shell" style={ctaShell}>
            <div>
              <span style={ctaEyebrow}>Ready for the next Umuganda call?</span>
              <h2 style={ctaTitle}>Activate disciplined attendance assurance today</h2>
              <p style={ctaDescription}>
                Create passes, assign districts, and keep law enforcement aligned from log-in one. Your community expects clarity—deliver it beautifully.
              </p>
            </div>
            <div style={ctaActions}>
              <Link href="/login" className="primary-button" style={{ ...primaryButtonStyle, padding: '1rem 2.4rem' }}>
                Sign in to begin
              </Link>
              <Link href="mailto:hello@umuganda.rw" style={ctaSecondaryLink}>
                Talk to the product team
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const navLinks = [
  { href: '#overview', label: 'Overview' },
  { href: '#features', label: 'Platform' },
  { href: '#workflows', label: 'Workflows' },
];

const responsiveOverrides = `
  .mobile-menu-button {
    display: none;
  }

  @media (max-width: 1024px) {
    .desktop-nav {
      display: none;
    }
    .mobile-menu-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
    }
    .mobile-menu {
      display: none;
      position: absolute;
      top: calc(100% + 0.75rem);
      right: clamp(1rem, 4vw, 3rem);
      left: clamp(1rem, 4vw, 3rem);
      border-radius: 18px;
      background: rgba(6, 20, 39, 0.92);
      backdrop-filter: blur(18px);
      border: 1px solid rgba(117, 155, 216, 0.18);
      padding: 1.75rem;
      z-index: 20;
    }
    .mobile-menu.open {
      display: block;
    }
    .hero-section {
      grid-template-columns: 1fr;
      text-align: center;
    }
    .hero-content {
      justify-items: center;
    }
    .hero-actions {
      justify-items: center;
    }
    .hero-visual {
      justify-content: center;
    }
  }

  @media (max-width: 860px) {
    .feature-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .workflow-section {
      grid-template-columns: 1fr;
    }
    .workflow-shell,
    .workflow-aside {
      padding: 2rem;
    }
  }

  @media (max-width: 640px) {
    .feature-grid {
      grid-template-columns: 1fr;
    }
    .cta-shell {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 480px) {}
`;

const pageShell: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  color: 'rgba(233, 240, 255, 0.92)',
  background: 'radial-gradient(circle at 10% 20%, #11203a 0%, #071021 45%, #050b15 100%)',
  position: 'relative',
};

const headerShell: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  alignItems: 'center',
  gap: '2rem',
  padding: '1.75rem clamp(1.5rem, 6vw, 5rem)',
  background: 'linear-gradient(120deg, rgba(8, 18, 35, 0.9), rgba(7, 16, 31, 0.65))',
  borderBottom: '1px solid rgba(117, 155, 216, 0.12)',
  boxShadow: '0 18px 60px rgba(4, 9, 17, 0.35)',
  backdropFilter: 'blur(18px)',
};

const brandCluster: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const brandTextBlock: CSSProperties = {
  display: 'grid',
  gap: '0.25rem',
};

const brandOverline: CSSProperties = {
  fontSize: '0.75rem',
  letterSpacing: '0.38em',
  textTransform: 'uppercase',
  color: 'rgba(164, 194, 255, 0.68)',
  fontWeight: 500,
};

const brandHeadline: CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  color: 'rgba(242, 248, 255, 0.96)',
};

const navStyle: CSSProperties = {
  display: 'flex',
  gap: '1.5rem',
  justifyContent: 'center',
  fontSize: '0.95rem',
  letterSpacing: '0.04em',
};

const navLinkStyle: CSSProperties = {
  color: 'rgba(200, 221, 255, 0.86)',
  padding: '0.35rem 0',
};

const headerActions: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.25rem',
};

const mobileNavStack: CSSProperties = {
  display: 'grid',
  gap: '1rem',
};

const mainStack: CSSProperties = {
  flex: 1,
  display: 'grid',
  gap: '6rem',
  padding: '4rem clamp(1.5rem, 6vw, 5rem) 6rem',
};

const heroSection: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
  gap: '3.5rem',
  alignItems: 'center',
  position: 'relative',
};

const heroContent: CSSProperties = {
  display: 'grid',
  gap: '1.8rem',
};

const heroPrefix: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.45rem 1.1rem',
  borderRadius: '999px',
  background: 'rgba(70, 126, 255, 0.12)',
  border: '1px solid rgba(88, 150, 255, 0.28)',
  color: 'rgba(188, 212, 255, 0.92)',
  fontSize: '0.85rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

const heroPrefixDot: CSSProperties = {
  width: '0.55rem',
  height: '0.55rem',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #88ffed, #54b7ff)',
  boxShadow: '0 0 18px rgba(136, 255, 237, 0.75)',
};

const heroTitle: CSSProperties = {
  margin: 0,
  fontSize: 'clamp(2.75rem, 4vw + 1rem, 4.5rem)',
  lineHeight: 1.1,
  fontWeight: 700,
  letterSpacing: '-0.015em',
  color: 'rgba(245, 249, 255, 0.98)',
};

const heroDescription: CSSProperties = {
  margin: 0,
  fontSize: '1.1rem',
  lineHeight: 1.8,
  color: 'rgba(195, 214, 244, 0.88)',
};

const heroActions: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1.2rem',
};

const heroVisual: CSSProperties = {
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
};

const passCardBackdrop: CSSProperties = {
  position: 'relative',
  padding: '2.4rem',
  borderRadius: '32px',
  background: 'linear-gradient(160deg, rgba(18, 47, 88, 0.8), rgba(12, 26, 54, 0.95))',
  border: '1px solid rgba(84, 131, 220, 0.25)',
  boxShadow: '0 30px 60px rgba(6, 18, 38, 0.45)',
  width: 'min(380px, 100%)',
};

const passCard: CSSProperties = {
  display: 'grid',
  gap: '1.1rem',
  borderRadius: '24px',
  padding: '1.8rem',
  background: 'linear-gradient(150deg, rgba(16, 40, 78, 0.92), rgba(27, 75, 133, 0.82))',
  border: '1px solid rgba(120, 173, 255, 0.18)',
  position: 'relative',
  overflow: 'hidden',
};

const passHeader: CSSProperties = {
  display: 'grid',
  gap: '0.35rem',
};

const passHeaderBadge: CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.32em',
  color: 'rgba(114, 234, 255, 0.8)',
};

const passHeaderTime: CSSProperties = {
  fontSize: '0.95rem',
  color: 'rgba(210, 233, 255, 0.84)',
};

const passIdentity: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: '1rem',
  alignItems: 'center',
};

const passAvatar: CSSProperties = {
  width: '3.2rem',
  height: '3.2rem',
  borderRadius: '16px',
  background: 'linear-gradient(135deg, #8df9ff, #4c8dff)',
  display: 'grid',
  placeItems: 'center',
  color: '#062034',
  fontWeight: 700,
};

const passName: CSSProperties = {
  margin: 0,
  fontSize: '1.1rem',
  fontWeight: 600,
  color: 'rgba(240, 248, 255, 0.95)',
};

const passRole: CSSProperties = {
  fontSize: '0.9rem',
  color: 'rgba(188, 216, 248, 0.72)',
};

const passDivider: CSSProperties = {
  height: '1px',
  background: 'linear-gradient(90deg, rgba(118, 180, 252, 0.05), rgba(118, 180, 252, 0.6), rgba(118, 180, 252, 0.05))',
};

const passMetaRow: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '1rem',
};

const metaBlock: CSSProperties = {
  display: 'grid',
  gap: '0.3rem',
};

const metaLabel: CSSProperties = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.26em',
  color: 'rgba(154, 203, 255, 0.6)',
};

const metaValue: CSSProperties = {
  fontSize: '0.95rem',
  color: 'rgba(227, 241, 255, 0.95)',
  fontWeight: 600,
};

const qrBadge: CSSProperties = {
  justifySelf: 'flex-start',
  padding: '0.35rem 0.9rem',
  borderRadius: '999px',
  border: '1px solid rgba(118, 212, 255, 0.4)',
  background: 'rgba(21, 58, 104, 0.55)',
  fontSize: '0.75rem',
  letterSpacing: '0.3em',
  textTransform: 'uppercase',
  color: 'rgba(173, 234, 255, 0.75)',
};

const glowOrb: CSSProperties = {
  position: 'absolute',
  inset: '-20% -25% auto auto',
  width: '160px',
  height: '160px',
  background: 'radial-gradient(circle, rgba(102, 204, 255, 0.8) 0%, rgba(19, 42, 80, 0) 70%)',
  filter: 'blur(0.5px)',
  opacity: 0.7,
};

const signalPill: CSSProperties = {
  position: 'absolute',
  bottom: '-1.4rem',
  right: '1.5rem',
  padding: '0.85rem 1.2rem',
  borderRadius: '18px',
  background: 'linear-gradient(135deg, rgba(32, 68, 120, 0.95), rgba(48, 94, 165, 0.8))',
  border: '1px solid rgba(122, 179, 255, 0.22)',
  boxShadow: '0 18px 32px rgba(9, 22, 42, 0.4)',
  display: 'grid',
  gap: '0.3rem',
  fontSize: '0.8rem',
  color: 'rgba(212, 233, 255, 0.85)',
};

const signalPrimary: CSSProperties = {
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'rgba(138, 240, 255, 0.82)',
};

const signalSecondary: CSSProperties = {
  letterSpacing: '0.08em',
  color: 'rgba(190, 215, 248, 0.76)',
};

const featureSection: CSSProperties = {
  display: 'grid',
  gap: '3rem',
};

const sectionHeader: CSSProperties = {
  display: 'grid',
  gap: '1.2rem',
  maxWidth: '820px',
};

const sectionEyebrow: CSSProperties = {
  textTransform: 'uppercase',
  letterSpacing: '0.26em',
  fontSize: '0.8rem',
  color: 'rgba(143, 181, 243, 0.7)',
};

const sectionTitle: CSSProperties = {
  margin: 0,
  fontSize: '2.15rem',
  lineHeight: 1.3,
  color: 'rgba(237, 245, 255, 0.95)',
};

const sectionDescription: CSSProperties = {
  margin: 0,
  fontSize: '1rem',
  lineHeight: 1.7,
  color: 'rgba(177, 203, 240, 0.78)',
};

const featureGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: '1.75rem',
};

const featureCard: CSSProperties = {
  display: 'grid',
  gap: '1.1rem',
  padding: '2rem',
  borderRadius: '24px',
  border: '1px solid rgba(102, 156, 231, 0.22)',
  background: 'linear-gradient(160deg, rgba(13, 31, 58, 0.9), rgba(16, 41, 78, 0.82))',
  boxShadow: '0 20px 40px rgba(5, 12, 29, 0.45)',
};

const featureIcon: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '3rem',
  height: '3rem',
  borderRadius: '1.2rem',
  background: 'linear-gradient(145deg, rgba(28, 64, 120, 0.85), rgba(18, 44, 82, 0.7))',
  boxShadow: '0 14px 28px rgba(6, 16, 36, 0.45)',
  alignSelf: 'center',
  marginBottom: '0.4rem',
};

const featureHeading: CSSProperties = {
  margin: 0,
  fontSize: '1.35rem',
  color: 'rgba(234, 243, 255, 0.95)',
};

const featureBody: CSSProperties = {
  margin: 0,
  color: 'rgba(185, 210, 245, 0.8)',
  lineHeight: 1.6,
};

const featureList: CSSProperties = {
  margin: 0,
  padding: 0,
  display: 'grid',
  gap: '0.65rem',
  listStyle: 'none',
};

const featureListItem: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  color: 'rgba(166, 196, 238, 0.85)',
  fontSize: '0.9rem',
};

const workflowSection: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)',
  gap: '3.5rem',
  alignItems: 'start',
};

const workflowShell: CSSProperties = {
  display: 'grid',
  gap: '2.5rem',
  padding: '2.4rem',
  borderRadius: '28px',
  border: '1px solid rgba(100, 150, 230, 0.24)',
  background: 'linear-gradient(150deg, rgba(12, 28, 56, 0.88), rgba(21, 46, 88, 0.8))',
  boxShadow: '0 26px 48px rgba(5, 12, 28, 0.4)',
};

const workflowTitle: CSSProperties = {
  margin: 0,
  fontSize: '2rem',
  lineHeight: 1.3,
  color: 'rgba(233, 243, 255, 0.95)',
};

const workflowTimeline: CSSProperties = {
  display: 'grid',
  gap: '1.75rem',
};

const timelineItem: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  gap: '1.5rem',
};

const timelineMarker: CSSProperties = {
  width: '2.5rem',
  aspectRatio: '1 / 1',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, rgba(103, 208, 255, 0.9), rgba(50, 122, 255, 0.65))',
  display: 'grid',
  placeItems: 'center',
  color: '#041327',
  fontWeight: 700,
};

const timelineIndex: CSSProperties = {
  fontSize: '1.05rem',
};

const timelineContent: CSSProperties = {
  display: 'grid',
  gap: '0.75rem',
};

const timelineHeading: CSSProperties = {
  margin: 0,
  fontSize: '1.25rem',
  color: 'rgba(237, 244, 255, 0.92)',
};

const timelineCopy: CSSProperties = {
  margin: 0,
  color: 'rgba(182, 208, 244, 0.8)',
  lineHeight: 1.6,
};

const timelineTags: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '0.5rem',
};

const timelineTag: CSSProperties = {
  padding: '0.35rem 0.85rem',
  borderRadius: '999px',
  border: '1px solid rgba(126, 184, 255, 0.28)',
  fontSize: '0.75rem',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'rgba(173, 208, 255, 0.7)',
};

const workflowAside: CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
  padding: '2.4rem',
  borderRadius: '24px',
  border: '1px solid rgba(118, 176, 255, 0.22)',
  background: 'linear-gradient(160deg, rgba(18, 40, 78, 0.85), rgba(14, 30, 60, 0.78))',
  boxShadow: '0 24px 42px rgba(5, 13, 28, 0.38)',
};

const asideHeading: CSSProperties = {
  margin: 0,
  fontSize: '1.2rem',
  color: 'rgba(229, 240, 255, 0.9)',
};

const asideList: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'grid',
  gap: '0.75rem',
};

const asideItem: CSSProperties = {
  padding: '0.75rem 0.1rem',
  borderBottom: '1px solid rgba(115, 170, 252, 0.16)',
  color: 'rgba(177, 204, 241, 0.78)',
  fontSize: '0.95rem',
};


const ctaSection: CSSProperties = {
  padding: '3.5rem',
  borderRadius: '32px',
  border: '1px solid rgba(122, 182, 255, 0.24)',
  background: 'linear-gradient(160deg, rgba(12, 36, 70, 0.86), rgba(18, 46, 92, 0.82))',
  boxShadow: '0 26px 46px rgba(5, 12, 27, 0.42)',
};

const ctaShell: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
  gap: '2.5rem',
  alignItems: 'center',
};

const ctaEyebrow: CSSProperties = {
  textTransform: 'uppercase',
  letterSpacing: '0.32em',
  fontSize: '0.78rem',
  color: 'rgba(168, 210, 255, 0.7)',
};

const ctaTitle: CSSProperties = {
  margin: '0.6rem 0',
  fontSize: '2.2rem',
  lineHeight: 1.3,
  color: 'rgba(236, 244, 255, 0.95)',
};

const ctaDescription: CSSProperties = {
  margin: 0,
  color: 'rgba(180, 210, 244, 0.78)',
  lineHeight: 1.65,
};

const ctaActions: CSSProperties = {
  display: 'grid',
  gap: '1.1rem',
  justifyItems: 'start',
};

const ctaSecondaryLink: CSSProperties = {
  color: 'rgba(158, 223, 255, 0.85)',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontSize: '0.85rem',
};

const primaryButtonStyle: CSSProperties = {
  background: 'linear-gradient(135deg, #8af9ff, #54a8ff)',
  color: '#04142b',
  padding: '1rem 2.2rem',
  borderRadius: '999px',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  fontSize: '0.95rem',
  border: 'none',
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  boxShadow: '0 24px 40px rgba(69, 169, 255, 0.45)',
};

const secondaryButtonStyle: CSSProperties = {
  padding: '0.85rem 1.9rem',
  borderRadius: '999px',
  border: '1px solid rgba(154, 204, 255, 0.45)',
  color: 'rgba(224, 236, 255, 0.94)',
  fontWeight: 600,
  letterSpacing: '0.12em',
  background: 'rgba(12, 30, 58, 0.5)',
  boxShadow: '0 12px 24px rgba(6, 16, 36, 0.4)',
  transition: 'all 0.2s ease',
  textDecoration: 'none',
};

const heroStats = [
  { label: 'District dashboards live', value: '23' },
  { label: 'QR scans processed monthly', value: '41K' },
  { label: 'Average verification speed', value: '1.6s' },
];

type FeatureCard = {
  icon: ReactNode;
  title: string;
  copy: string;
  points: string[];
};

const featureCards: FeatureCard[] = [
  {
    icon: <ClipboardList size={36} strokeWidth={1.6} color="rgba(160, 220, 255, 0.92)" />, 
    title: 'Attendance ledger without friction',
    copy: 'Digitise congregation roll calls with QR scans, auto-tagging each service hour against the right district oversight.',
    points: ['Live heatmaps for union administrators', 'Offline mode with auto-sync', 'Tamper-evident audit trails'],
  },
  {
    icon: <ShieldCheck size={36} strokeWidth={1.6} color="rgba(160, 220, 255, 0.92)" />, 
    title: 'Policy-aligned enforcement',
    copy: 'Issue, revoke, or expire passes with granular permissions grounded in SDA Rwanda governance layers.',
    points: ['Union → district → church hierarchy', 'Police verification checkpoints', 'Role-tuned dashboards'],
  },
  {
    icon: <UsersRound size={36} strokeWidth={1.6} color="rgba(160, 220, 255, 0.92)" />, 
    title: 'Member confidence at scale',
    copy: 'Give congregants QR passes and SMS confirmations that travel with them, proving service attendance wherever they go.',
    points: ['Human-readable pass design', 'Personal history timeline', 'Localized Kinyarwanda messaging'],
  },
];

const workflowSteps = [
  {
    title: 'Leadership sets objectives',
    description: 'Outline attendance goals, define responsibilities, and configure the mobilisation cadence inside the planning board.',
    tags: ['Planning', 'Objectives', 'Governance'],
  },
  {
    title: 'Regional teams prepare rollout',
    description: 'Coordinate districts, confirm admin assignments, and share guidance packages with every congregation lead.',
    tags: ['Coordination', 'Enablement'],
  },
  {
    title: 'Local coordinators manage engagement',
    description: 'Issue digital passes, support on-site registration, and monitor real-time arrivals as members check in.',
    tags: ['Operations', 'Pass management'],
  },
  {
    title: 'Oversight reviews insights',
    description: 'Track analytics, download audit trails, and share progress dashboards with leadership stakeholders.',
    tags: ['Insights', 'Reporting'],
  },
];

const safeguards = [
  'Dual-factor approvals for policy changes',
  'Immutable scan history with exportable evidence',
  'Per-role access controls mapped to SDA hierarchy',
  'SMS alerts for abnormal attendance spikes',
  'Dedicated success team monitoring monthly rollouts',
];

export default HomePage;
