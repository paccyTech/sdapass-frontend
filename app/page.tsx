
'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import { ChevronRight, ClipboardList, Globe, Home, Search, ShieldCheck, Ticket, UsersRound, Download, User, LogOut, BarChart2, Building2, Church, CheckCircle, Flag, Landmark, Settings, UserCheck, Users } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthSession } from '@/hooks/useAuthSession';
import { fetchMemberPass, fetchMemberAttendance, type MemberPassDetails, type MemberPassViewer, type MemberAttendance } from '@/lib/api';
import { ROLE_DEFINITIONS, type RoleKey } from '@/lib/rbac';
import type { AuthUser } from '@/lib/auth';

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState('View all');
  const [mounted, setMounted] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { token, user } = useAuthSession();
  const pathname = usePathname();
  const [activeHash, setActiveHash] = useState<string>('');
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [memberPass, setMemberPass] = useState<MemberPassDetails | null>(null);
  const [memberProfile, setMemberProfile] = useState<MemberPassViewer | null>(null);
  const [memberAttendance, setMemberAttendance] = useState<MemberAttendance[] | null>(null);
  const [loadingPass, setLoadingPass] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [activeCardView, setActiveCardView] = useState<'front' | 'back'>('front');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const updateHash = () => {
      setActiveHash(window.location.hash || '');
    };

    updateHash();
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, [mounted]);

  useEffect(() => {
    if (mounted && token && user?.role === 'MEMBER' && user?.id) {
      setLoadingPass(true);
      fetchMemberPass(token, user.id)
        .then((response) => {
          setMemberPass(response.pass);
          setMemberProfile(response.member);
        })
        .catch((error) => {
          console.error('Failed to fetch member pass:', error);
        })
        .finally(() => {
          setLoadingPass(false);
        });
    }
  }, [mounted, token, user]);

  const getUserInitials = () => {
    if (!user) return 'U';
    const { firstName, lastName } = user;
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    if (lastName) return lastName[0].toUpperCase();
    return 'U';
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getUserMenuItems = (role: RoleKey) => {
    const baseItems = [
      { label: 'Profile', href: '/profile', icon: <User size={18} /> },
      { label: 'Settings', href: '/settings', icon: <Settings size={18} /> },
      { type: 'divider' } as const,
    ];

    const roleSpecificItems = {
      UNION_ADMIN: [
        { label: 'Union Dashboard', href: '/union', icon: <BarChart2 size={18} /> },
        { label: 'Manage Admins', href: '/union/admins', icon: <Users size={18} /> },
      ],
      DISTRICT_ADMIN: [
        { label: 'District Dashboard', href: '/district', icon: <BarChart2 size={18} /> },
        { label: 'Manage Churches', href: '/district/churches', icon: <Home size={18} /> },
      ],
      CHURCH_ADMIN: [
        { label: 'Church Dashboard', href: '/church', icon: <BarChart2 size={18} /> },
        { label: 'Manage Members', href: '/church/members', icon: <Users size={18} /> },
      ],
      MEMBER: [
        { label: 'My Profile', href: '/member/profile', icon: <User size={18} /> },
        { label: 'My Attendance', href: '/member/attendance', icon: <CheckCircle size={18} /> },
      ],
      POLICE_VERIFIER: [
        { label: 'Verification Portal', href: '/verify', icon: <Search size={18} /> },
        { label: 'Verification History', href: '/verify/history', icon: <ClipboardList size={18} /> },
      ],
    };

    return [
      ...baseItems,
      ...(roleSpecificItems[role] ?? []),
      { type: 'divider' } as const,
      { label: 'Sign out', href: '/logout', icon: <LogOut size={18} /> },
    ];
  };

  const isMenuLink = (item: any): item is { label: string; href: string; icon: ReactNode } => 'href' in item;
  const categories = useMemo(
    () => [
      'View all',
      'My Pass',
      'My Attendance',
      'Scan Reports',
      'Reports & Insights',
      'Settings',
    ],
    [],
  );

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={pageShell}>
      <style dangerouslySetInnerHTML={{ __html: responsiveOverrides }} />
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .home-tabs::-webkit-scrollbar { height: 8px; }
            .home-tabs::-webkit-scrollbar-thumb { background: rgba(15, 23, 42, 0.18); border-radius: 999px; }
            .home-nav-link { color: rgba(15, 23, 42, 0.75); }
            .home-nav-link:hover { color: rgba(15, 23, 42, 1); }
          `,
        }}
      />

      <header
        style={{
          ...headerShell,
          background: '#ffffff',
          borderBottom: '1px solid rgba(15, 23, 42, 0.12)',
          boxShadow: isScrolled ? '0 12px 30px rgba(15, 23, 42, 0.08)' : 'none',
          backdropFilter: 'none',
        }}
      >
        <div style={topNavLeft}>
          <div style={brandCluster}>
            <div style={brandLogoShell} aria-hidden="true">
              <Image
                src="/sda-logo.png"
                alt="Logo"
                width={46}
                height={46}
                priority
                style={{ flexShrink: 0, objectFit: 'contain' }}
              />
            </div>
            <div style={brandTextBlock}>
              <span style={brandHeadlineLight}>Rwanda Union Mission</span>
              <span style={brandHeadlineSecondary}>UMUGANDA PASS</span>
            </div>
          </div>
        </div>

        <div style={topNavCenter}>
          <nav className="desktop-nav" style={topNavLinks} aria-label="Primary navigation">
            {navLinks.map((link) => (
              (() => {
                const isActive = link.href.startsWith('#')
                  ? mounted && link.href === activeHash
                  : link.href === pathname;
                return (
              <Link key={link.href} href={link.href} className="home-nav-link" style={{
                ...topNavLink,
                border: 'none',
                borderRadius: '10px',
                padding: '0.45rem 0.65rem',
                background: isActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                color: isActive ? '#2563eb' : 'inherit',
                fontWeight: isActive ? 500 : 400,
              }}>
                <span style={topNavLinkIcon}>{link.icon}</span>
                {link.label}
              </Link>
                );
              })()
            ))}
          </nav>
        </div>

        <div style={topNavRight}>
          <div className="desktop-only" style={topNavMeta}>
            <Link href="#support" className="home-nav-link" style={topNavMetaLink}>
              Support Centre
            </Link>
            <div style={langPicker}>
              <Globe size={16} />
              <span>English</span>
              <span style={{ opacity: 0.7 }}>▾</span>
            </div>
          </div>

          <button
            className="mobile-menu-button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-controls="primary-navigation"
            aria-label="Toggle navigation"
            style={mobileMenuButtonLight}
          >
            ☰
          </button>

          <div className="desktop-only" style={topNavAuth}>
            {mounted ? (
              <>
                {user ? (
                  <>
                    {/* Profile Dropdown */}
                    <div style={{ position: 'relative' }} ref={profileMenuRef}>
                      <button
                        style={userMenuButton}
                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                        aria-expanded={profileMenuOpen}
                        aria-haspopup="true"
                      >
                        <div style={userAvatar}>
                          {getUserInitials()}
                        </div>
                        <div style={userInfo}>
                          <span style={userName}>
                            {user.firstName || 'User'}
                          </span>
                          <span style={{
                            ...userRole,
                            fontSize: '0.75rem',
                            color: 'var(--muted)',
                            fontWeight: 400
                          }}>
                            {ROLE_DEFINITIONS[user.role]?.name || user.role}
                          </span>
                        </div>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            transition: 'transform 0.2s ease',
                            transform: profileMenuOpen ? 'rotate(180deg)' : 'rotate(0)',
                          }}
                        >
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </button>

                      {profileMenuOpen && (
                        <div style={dropdownMenu}>
                          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--surface-border)' }}>
                            <div style={userName}>
                              {user.firstName} {user.lastName}
                            </div>
                            <div style={{
                              ...userRole,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              marginTop: '0.25rem',
                            }}>
                              <span style={roleBadge[user.role]}>{ROLE_DEFINITIONS[user.role]?.name || user.role}</span>
                            </div>
                          </div>
                          
                          <div style={{ padding: '0.5rem 0' }}>
                            {getUserMenuItems(user.role).map((item, index) => {
                              if (!isMenuLink(item)) {
                                return (
                                  <div
                                    key={`divider-${index}`}
                                    style={{ height: '1px', backgroundColor: 'var(--surface-border)', margin: '0.5rem 0' }}
                                  />
                                );
                              }

                              return (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  style={{
                                    ...dropdownItem,
                                    textDecoration: 'none',
                                    color: item.label === 'Sign out' ? 'var(--danger)' : 'var(--shell-foreground)',
                                  }}
                                >
                                  <span>{item.icon}</span>
                                  {item.label}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/login" style={authGhostButton}>
                      Log in
                    </Link>
                    <Link href="/login" style={authPrimaryButton}>
                      Sign up
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <Link href="/login" style={authGhostButton}>
                  Log in
                </Link>
                <Link href="/login" style={authPrimaryButton}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>

        <div id="primary-navigation" className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <nav aria-label="Mobile primary navigation">
            <div style={mobileNavStack}>
              {mounted && user ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0 0 1rem 0',
                    borderBottom: '1px solid var(--surface-border)',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ ...userAvatar, width: '42px', height: '42px', fontSize: '1rem' }}>{getUserInitials()}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', minWidth: 0 }}>
                    <div style={{ ...userName, fontSize: '0.95rem' }}>{user.firstName || 'User'} {user.lastName || ''}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={roleBadge[user.role]}>{ROLE_DEFINITIONS[user.role]?.name || user.role}</span>
                    </div>
                  </div>
                </div>
              ) : null}

              {navLinks.map((link) => (
                (() => {
                  const isActive = link.href.startsWith('#')
                    ? mounted && link.href === activeHash
                    : link.href === pathname;
                  return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="home-nav-link"
                  style={{
                    ...topNavLink,
                    justifyContent: 'flex-start',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '0.5rem 0.75rem',
                    background: isActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                    color: isActive ? '#2563eb' : 'inherit',
                    fontWeight: isActive ? 500 : 400,
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span style={topNavLinkIcon}>{link.icon}</span>
                  {link.label}
                </Link>
                  );
                })()
              ))}
              <Link href="#support" className="home-nav-link" style={{ ...topNavLink, justifyContent: 'flex-start' }}>
                Support Centre
              </Link>

              {mounted ? (
                user ? (
                  <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--surface-border)', marginTop: '1rem' }}>
                    {getUserMenuItems(user.role).map((item, index) => {
                      if (!isMenuLink(item)) {
                        return (
                          <div
                            key={`mobile-divider-${index}`}
                            style={{ height: '1px', backgroundColor: 'var(--surface-border)', margin: '0.75rem 0' }}
                          />
                        );
                      }

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className="home-nav-link"
                          style={{
                            ...topNavLink,
                            justifyContent: 'flex-start',
                            textDecoration: 'none',
                            color: item.label === 'Sign out' ? 'var(--danger)' : 'inherit',
                          }}
                        >
                          <span style={topNavLinkIcon}>{item.icon}</span>
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <Link href="/login" style={authGhostButton} onClick={() => setIsMenuOpen(false)}>
                      Log in
                    </Link>
                    <Link href="/login" style={authPrimaryButton} onClick={() => setIsMenuOpen(false)}>
                      Sign up
                    </Link>
                  </>
                )
              ) : null}
            </div>
          </nav>
        </div>
      </header>

      <main style={homeMain}>
        {/* Pass Modal */}
        {mounted && showPassModal && (
          <div style={modalOverlayStyle} onClick={() => setShowPassModal(false)}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
              <div style={modalHeaderStyle}>
                <h3 style={modalTitleStyle}>Your Umuganda Digital Pass</h3>
                <button 
                  onClick={() => setShowPassModal(false)}
                  style={modalCloseButtonStyle}
                >
                  ×
                </button>
              </div>
              
              <div style={modalBodyStyle}>
                {memberPass && memberProfile ? (
                  <div style={cardDisplayStyle}>
                    {/* Card Preview Tabs */}
                    <div style={cardTabsStyle}>
                      <button 
                        style={activeCardTab}
                        onClick={() => setActiveCardView('front')}
                      >
                        Front Side
                      </button>
                      <button 
                        style={inactiveCardTab}
                        onClick={() => setActiveCardView('back')}
                      >
                        Back Side
                      </button>
                    </div>

                    {/* Front Side Preview */}
                    <div style={cardPreviewContainer}>
                      <div style={cardScaleStyle}>
                        <div style={cardFrontStyle}>
                          {/* Background Pattern */}
                          <div style={cardBackgroundPattern}>
                            <div style={cardPatternCircle1} />
                            <div style={cardPatternCircle2} />
                            <div style={cardPatternCircle3} />
                          </div>
                          
                          {/* Header */}
                          <div style={cardHeaderStyle}>
                            <div style={cardLogoStyle}>
                              <div style={cardLogoIcon}>
                                <img 
                                  src="/sda-logo.png" 
                                  alt="SDA Logo" 
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    objectFit: 'contain',
                                  }}
                                />
                              </div>
                              <div>
                                <div style={cardBrandStyle}>RUM</div>
                                <div style={cardTitleStyle}>UMUGANDA</div>
                                <div style={cardSubtitleStyle}>PASS</div>
                              </div>
                            </div>
                            <div style={cardIdStyle}>
                              <div style={cardIdLabel}>Member ID</div>
                              <div style={cardIdValue}>{memberProfile.nationalId || 'N/A'}</div>
                            </div>
                          </div>
                          
                          {/* Main Content Area */}
                          <div style={cardMainContentStyle}>
                            {/* Left Side - Member Info */}
                            <div style={cardLeftSectionStyle}>
                              <div style={cardPhotoStyle}>
                                {memberProfile.firstName?.[0]?.toUpperCase() || 'M'}
                              </div>
                              <div style={cardMemberInfoStyle}>
                                <div style={cardNameStyle}>{`${memberProfile.firstName || ''} ${memberProfile.lastName || ''}`.trim()}</div>
                                <div style={cardRoleStyle}>CHURCH MEMBER</div>
                                {memberProfile.church && (
                                  <div style={cardChurchStyle}>{memberProfile.church.name}</div>
                                )}
                                {memberProfile.phoneNumber && (
                                  <div style={cardPhoneStyle}>{memberProfile.phoneNumber}</div>
                                )}
                                {memberProfile.email && (
                                  <div style={cardEmailStyle}>{memberProfile.email}</div>
                                )}
                              </div>
                            </div>
                            
                            {/* Right Side - QR Code */}
                            <div style={cardRightSectionStyle}>
                              <div style={cardQRLabelStyle}>SCAN FOR VERIFICATION</div>
                              <div style={cardQRContainerStyle}>
                                <div style={cardQRStyle} data-qr-code>
                                  {memberPass.token ? (
                                    <QRCodeSVG 
                                      value={memberPass.token}
                                      size={72}
                                      level="H"
                                      includeMargin={true}
                                      bgColor="#ffffff"
                                      fgColor="#000000"
                                    />
                                  ) : (
                                    <div style={cardQRPlaceholderStyle}>QR CODE</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Footer */}
                          <div style={cardFooterStyle}>
                            <div>
                              <div style={cardFooterLabelStyle}>Valid Until</div>
                              <div style={cardFooterValueStyle}>{memberPass.expiresAt ? new Date(memberPass.expiresAt).toLocaleDateString() : 'Lifetime'}</div>
                            </div>
                            <div style={cardTokenStyle}>
                              <div style={cardFooterLabelStyle}>Issued</div>
                              <div style={cardFooterValueStyle}>{new Date().toLocaleDateString()}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Back Side Preview */}
                    <div style={{ ...cardPreviewContainer, display: activeCardView === 'back' ? 'flex' : 'none' }}>
                      <div style={cardScaleStyle}>
                        <div style={cardBackStyle}>
                          {/* Header */}
                          <div style={cardBackHeaderStyle}>
                            <div style={cardBackTitleStyle}>RUM-UMUGANDA PASS</div>
                            <div style={cardBackSubtitleStyle}>Official Identification Card</div>
                          </div>
                          
                          {/* Terms and Conditions */}
                          <div style={cardTermsStyle}>
                            <div style={cardTermsTitleStyle}>TERMS & CONDITIONS:</div>
                            <div style={cardTermsTextStyle}>
                              1. This card is property of RUM Umuganda Program.<br/>
                              2. Must be presented for Umuganda attendance.<br/>
                              3. Report lost/stolen cards immediately.<br/>
                              4. Fraudulent use will result in prosecution.<br/>
                              5. Valid only with current membership status.
                            </div>
                          </div>
                          
                          {/* Signature */}
                          <div style={cardSignatureStyle}>
                            <div style={cardSignatureTitleStyle}>Rwand Union Mission signature</div>
                            <div style={cardSignatureLineStyle} />
                          </div>
                          
                          {/* Authority and Contact */}
                          <div style={cardAuthorityStyle}>
                            <div>
                              <div style={cardAuthorityTitleStyle}>AUTHORIZED BY:</div>
                              <div>Church Administration</div>
                            </div>
                            <div style={cardContactStyle}>
                              <div style={cardAuthorityTitleStyle}>CONTACT:</div>
                              <div>www.rum-umuganda.rw</div>
                            </div>
                          </div>
                          
                          {/* Security Features */}
                          <div style={cardSecurityFeature1} />
                          <div style={cardSecurityFeature2} />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={modalActionsStyle}>
                      <button 
                        onClick={async () => {
                          if (!memberPass || !memberProfile) return;
                          
                          try {
                            // Import libraries dynamically
                            const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
                              import('html2canvas'),
                              import('jspdf'),
                            ]);

                            // Calculate card dimensions (credit card size: 85.6mm x 53.98mm)
                            const cardWidth = 321; // pixels for screen rendering
                            const cardHeight = 204; // pixels for screen rendering

                            // Create a temporary container for the card design
                            const cardContainer = document.createElement('div');
                            cardContainer.style.position = 'absolute';
                            cardContainer.style.left = '-9999px';
                            cardContainer.style.top = '-9999px';
                            cardContainer.style.width = '1000px';
                            cardContainer.style.background = '#ffffff';
                            // Create separate containers for front and back sides
                            const frontContainer = document.createElement('div');
                            frontContainer.style.position = 'absolute';
                            frontContainer.style.left = '-9999px';
                            frontContainer.style.top = '-9999px';
                            frontContainer.style.width = `${cardWidth}px`;
                            frontContainer.style.height = `${cardHeight}px`;
                            frontContainer.style.background = '#ffffff';
                            
                            const backContainer = document.createElement('div');
                            backContainer.id = 'back-container-pdf';
                            backContainer.style.position = 'absolute';
                            backContainer.style.left = '-9999px';
                            backContainer.style.top = '-9999px';
                            backContainer.style.width = `${cardWidth}px`;
                            backContainer.style.height = `${cardHeight}px`;
                            backContainer.style.background = '#ffffff';
                            backContainer.style.overflow = 'hidden';
                            
                            // Front side HTML (exact copy of modal preview)
                            frontContainer.innerHTML = `
                              <div style="width: 100%; height: 100%; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; color: #1e293b; position: relative; overflow: hidden; box-sizing: border-box; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                                <!-- Background Pattern -->
                                <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 0;">
                                  <div style="position: absolute; top: 20px; right: 20px; width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #3b82f6); opacity: 0.05;"></div>
                                  <div style="position: absolute; bottom: 60px; left: 30px; width: 35px; height: 35px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #34d399); opacity: 0.05;"></div>
                                  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 25px; height: 25px; border-radius: 50%; background: linear-gradient(135deg, #8b5cf6, #a78bfa); opacity: 0.05;"></div>
                                </div>
                                
                                <!-- Header -->
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; position: relative; z-index: 1;">
                                  <div style="display: flex; align-items: center; gap: 8px;">
                                    <div style="width: 32px; height: 32px; background: transparent; border-radius: 6px; display: flex; align-items: center; justify-content: center; padding: 0;">
                                      <img src="/sda-logo.png" alt="SDA Logo" style="width: 32px; height: 32px; object-fit: contain;" crossorigin="anonymous" />
                                    </div>
                                    <div>
                                      <div style="font-size: 8px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #2563eb; line-height: 1.1;">RUM</div>
                                      <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; line-height: 1; color: #1e293b;">UMUGANDA</div>
                                      <div style="font-size: 8px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #64748b; line-height: 1.2;">PASS</div>
                                    </div>
                                  </div>
                                  <div style="text-align: right;">
                                    <div style="font-size: 6px; color: #64748b; text-transform: uppercase; margin-bottom: 1px;">Member ID</div>
                                    <div style="font-size: 10px; font-weight: 600; font-family: monospace; color: #1e293b; letter-spacing: 0.5px;">${memberProfile.nationalId || 'N/A'}</div>
                                  </div>
                                </div>
                                
                                <!-- Main Content Area -->
                                <div style="display: flex; gap: 16px; margin-bottom: 8px; position: relative; z-index: 1; height: calc(100% - 80px);">
                                  <!-- Left Side - Member Info -->
                                  <div style="display: flex; flex-direction: column; gap: 12px; flex: 1;">
                                    <div style="display: flex; gap: 12px;">
                                      <div style="width: 45px; height: 56px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 700; border: 2px solid rgba(37, 99, 235, 0.28); color: #ffffff; flex-shrink: 0;">
                                        ${memberProfile.firstName?.[0]?.toUpperCase() || 'M'}
                                      </div>
                                      <div style="flex: 1; min-width: 0;">
                                        <div style="font-size: 14px; font-weight: 700; margin-bottom: 2px; line-height: 1.1; color: #1e293b;">${`${memberProfile.firstName || ''} ${memberProfile.lastName || ''}`.trim()}</div>
                                        <div style="font-size: 8px; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">CHURCH MEMBER</div>
                                        ${memberProfile.church ? `<div style="font-size: 9px; color: #475569; font-weight: 500; margin-bottom: 6px;">${memberProfile.church.name}</div>` : ''}
                                        ${memberProfile.phoneNumber ? `<div style="font-size: 8px; color: #64748b; margin-bottom: 2px;">${memberProfile.phoneNumber}</div>` : ''}
                                        ${memberProfile.email ? `<div style="font-size: 8px; color: #64748b;">${memberProfile.email}</div>` : ''}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <!-- Right Side - QR Code -->
                                  <div style="display: flex; flex-direction: column; align-items: center; justify-content: flex-start; margin-top: 4px;">
                                    <div style="font-size: 7px; font-weight: 600; color: #2563eb; text-align: center; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">SCAN FOR VERIFICATION</div>
                                    <div style="width: 80px; height: 80px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px;">
                                      <div id="qr-code-front" style="width: 72px; height: 72px; background: #ffffff; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
                                        QR CODE
                                      </div>
                                    </div>
                                    <div style="width: 80%; height: 1px; background: #e2e8f0; margin: 4px 0;"></div>
                                  </div>
                                </div>
                                
                                <!-- Footer - At the very bottom -->
                                <div style="display: flex; justify-content: space-between; align-items: flex-end; position: absolute; bottom: 16px; left: 16px; right: 16px;">
                                  <div>
                                    <div style="font-size: 6px; color: #64748b; text-transform: uppercase; margin-bottom: 1px;">Valid Until</div>
                                    <div style="font-size: 9px; font-weight: 600; color: #1e293b;">${memberPass.expiresAt ? new Date(memberPass.expiresAt).toLocaleDateString() : 'Lifetime'}</div>
                                  </div>
                                  <div style="text-align: right;">
                                    <div style="font-size: 6px; color: #64748b; text-transform: uppercase; margin-bottom: 1px;">Issued</div>
                                    <div style="font-size: 9px; font-weight: 600; color: #1e293b;">${new Date().toLocaleDateString()}</div>
                                  </div>
                                </div>
                              </div>
                            `;
                            
                            // Back side HTML (ultra-simple to avoid iframe issues)
                            backContainer.innerHTML = `
                              <div style="width: 100%; height: 100%; background: white; padding: 20px; font-family: Arial, sans-serif; font-size: 12px; color: #333; box-sizing: border-box;">
                                <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ccc; padding-bottom: 10px;">
                                  <div style="font-size: 18px; font-weight: bold; text-transform: uppercase;">RUM-UMUGANDA PASS</div>
                                  <div style="font-size: 12px; color: #666;">Official Identification Card</div>
                                </div>
                                
                                <div style="margin-bottom: 30px; position: relative;">
                                  <div style="font-weight: bold; margin-bottom: 8px; text-align: center;">Rwand Union Mission signature</div>
                                  <div style="height: 100px; position: relative; background-image: url('/sda-logo.png'); background-repeat: no-repeat; background-position: center; background-size: contain; opacity: 0.25;"></div>
                                </div>
                                
                                <div style="font-size: 8px; color: #888; text-align: center; position: absolute; bottom: 50px; left: 20px; right: 20px; font-style: italic;">This is property of Rwanda Union Mission</div>
                                
                                <div style="display: flex; justify-content: space-between; font-size: 9px; color: #666; position: absolute; bottom: 20px; left: 20px; right: 20px;">
                                  <div>
                                    <div style="font-weight: bold;">AUTHORIZED BY:</div>
                                    <div>Church Administration</div>
                                  </div>
                                  <div style="text-align: right;">
                                    <div style="font-weight: bold;">CONTACT:</div>
                                    <div>www.rum-umuganda.rw</div>
                                  </div>
                                </div>
                              </div>
                            `;
                            
                            // Add containers to document
                            document.body.appendChild(frontContainer);
                            document.body.appendChild(backContainer);

                            // Add QR code to the front side
                            const qrFrontContainer = frontContainer.querySelector('#qr-code-front') as HTMLElement;
                            if (qrFrontContainer && memberPass.token) {
                              try {
                                // Generate actual QR code using qrcode library
                                const QRCode = (await import('qrcode')).default;
                                const qrCodeDataURL = await QRCode.toDataURL(memberPass.token, {
                                  width: 72,
                                  margin: 1,
                                  color: {
                                    dark: '#000000',
                                    light: '#FFFFFF'
                                  }
                                });
                                
                                qrFrontContainer.innerHTML = `<img src="${qrCodeDataURL}" width="72" height="72" style="display: block;" />`;
                              } catch (qrError) {
                                console.warn('QR code generation failed:', qrError);
                                // Fallback to simple placeholder
                                qrFrontContainer.innerHTML = '<div style="width: 72px; height: 72px; background: #f8fafc; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #6b7280;">QR</div>';
                              }
                            }

                            try {
                              console.log('Starting PDF generation...');
                              
                              // Create PDF with exact credit card dimensions (ISO/IEC 7810 ID-1 standard)
                              console.log('Creating PDF with exact card dimensions...');
                              const pdf = new jsPDF({
                                orientation: 'landscape',
                                unit: 'mm',
                                format: [85.6, 53.98], // Exact credit card dimensions
                              });
                              console.log('PDF created with card dimensions');

                              // Convert front side to canvas with high resolution (300 DPI equivalent)
                              console.log('Converting front side to high-res canvas...');
                              const frontCanvas = await html2canvas(frontContainer, {
                                scale: 4, // Higher scale for 300 DPI equivalent
                                useCORS: true,
                                allowTaint: false,
                                logging: false,
                                backgroundColor: '#ffffff',
                                width: 321,
                                height: 204,
                                imageTimeout: 0,
                                removeContainer: false
                              });
                              console.log('Front canvas created successfully:', !!frontCanvas);

                              if (!frontCanvas) {
                                throw new Error('Failed to create front canvas');
                              }

                              // Test canvas data URL generation
                              const testDataUrl = frontCanvas.toDataURL('image/png');
                              console.log('Front canvas data URL generated, length:', testDataUrl.length);

                              if (!testDataUrl || testDataUrl.length < 1000) {
                                throw new Error('Canvas data URL generation failed or too small');
                              }

                              // Add front side to first page (no margins)
                              console.log('Adding front side to PDF page 1...');
                              pdf.addImage(
                                testDataUrl,
                                'PNG',
                                0, // No left margin
                                0, // No top margin
                                85.6, // Exact card width
                                53.98 // Exact card height
                              );
                              console.log('Front side added to page 1');

                              // Try to add back side to second page
                              console.log('Attempting to add back side to page 2...');
                              try {
                                const backCanvas = await html2canvas(backContainer, {
                                  scale: 4, // Higher scale for 300 DPI equivalent
                                  useCORS: true,
                                  allowTaint: false,
                                  logging: false,
                                  backgroundColor: '#ffffff',
                                  width: 321,
                                  height: 204,
                                  imageTimeout: 0,
                                  removeContainer: false
                                });
                                console.log('Back canvas created successfully:', !!backCanvas);

                                if (backCanvas) {
                                  // Add new page for back side
                                  pdf.addPage([85.6, 53.98], 'landscape');
                                  console.log('Adding back side to page 2...');
                                  const backDataUrl = backCanvas.toDataURL('image/png');
                                  console.log('Back canvas data URL length:', backDataUrl.length);
                                  
                                  pdf.addImage(
                                    backDataUrl,
                                    'PNG',
                                    0, // No left margin
                                    0, // No top margin
                                    85.6, // Exact card width
                                    53.98 // Exact card height
                                  );
                                  console.log('Back side added to page 2');
                                  alert('PDF completed successfully with front and back sides on separate pages!');
                                } else {
                                  console.warn('Back canvas creation returned null');
                                  alert('PDF generated with front side only (back side failed)');
                                }
                              } catch (backError) {
                                console.error('Back side generation failed:', backError);
                                alert('PDF generated with front side only. Back side will be added later.');
                                // PDF is still saved with front side
                              }
                              
                              // Save the PDF with a proper filename
                              const filename = `${memberProfile.firstName || 'Unknown'}-${memberProfile.nationalId || 'card'}.pdf`;
                              console.log('Saving PDF as:', filename);
                              
                              try {
                                pdf.save(filename);
                                console.log('PDF save completed successfully');
                              } catch (saveError) {
                                console.error('PDF save failed:', saveError);
                                alert('PDF creation succeeded but save failed: ' + (saveError instanceof Error ? saveError.message : String(saveError)));
                                
                                // Try alternative save method
                                try {
                                  console.log('Trying alternative save method...');
                                  const pdfBlob = pdf.output('blob');
                                  console.log('PDF blob created, size:', pdfBlob.size);
                                  const url = URL.createObjectURL(pdfBlob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = filename;
                                  link.style.display = 'none';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  URL.revokeObjectURL(url);
                                  console.log('Alternative PDF save completed');
                                  alert('PDF downloaded using alternative method!');
                                } catch (altSaveError) {
                                  console.error('Alternative save also failed:', altSaveError);
                                  alert('Both PDF save methods failed. Check console for details.');
                                }
                              }
                              
                            } catch (error) {
                              console.error('PDF generation failed:', error);
                              alert(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                              
                              // Fallback to JSON download
                              const passData = {
                                member: memberProfile,
                                pass: memberPass,
                                issuedAt: new Date().toISOString(),
                                pdfError: error instanceof Error ? error.message : String(error)
                              };
                              
                              const dataStr = JSON.stringify(passData, null, 2);
                              const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                              
                              const exportFileDefaultName = `umuganda-pass-${memberProfile.firstName}-${memberProfile.lastName}.json`;
                              
                              const linkElement = document.createElement('a');
                              linkElement.setAttribute('href', dataUri);
                              linkElement.setAttribute('download', exportFileDefaultName);
                              linkElement.click();
                            }

                          } catch (error) {
                            console.error('Error generating PDF:', error);
                            // Fallback to JSON download
                            const passData = {
                              member: memberProfile,
                              pass: memberPass,
                              issuedAt: new Date().toISOString()
                            };
                            
                            const dataStr = JSON.stringify(passData, null, 2);
                            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                            
                            const exportFileDefaultName = `umuganda-pass-${memberProfile.firstName}-${memberProfile.lastName}.json`;
                            
                            const linkElement = document.createElement('a');
                            linkElement.setAttribute('href', dataUri);
                            linkElement.setAttribute('download', exportFileDefaultName);
                            linkElement.click();
                          }
                        }}
                        style={modalPrimaryButtonStyle}
                      >
                        <Download size={16} />
                        Download Card PDF
                      </button>
                      <button 
                        onClick={() => setShowPassModal(false)}
                        style={modalSecondaryButtonStyle}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={passNotAvailableStyle}>
                    <div style={passNotAvailableIconStyle}>
                      <Ticket size={48} />
                    </div>
                    <h4 style={passNotAvailableTitleStyle}>Pass Not Available</h4>
                    <p style={passNotAvailableTextStyle}>
                      Your digital pass has not been issued yet. Please contact your church administrator.
                    </p>
                    <button 
                      onClick={() => setShowPassModal(false)}
                      style={modalSecondaryButtonStyle}
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <section style={heroOuter}>
          <div style={heroCard}>
            <div style={heroOverlay} />
            <div style={heroInner}>
              <div style={heroTextBlockNew}>
                <p style={heroKicker}>Welcome to</p>
                <h1 style={heroTitleNew}>RUM-UMUGANDA PASS</h1>
                <div style={poweredByPill}>Secure. Trackable. Role-based.</div>
              </div>

              <div style={heroSearchShell}>
                <Search size={18} style={{ opacity: 0.75 }} />
                <input
                  aria-label="Search"
                  placeholder="Search passes, members, churches, or districts"
                  style={heroSearchInput}
                />
                <button type="button" aria-label="Search" style={heroSearchGo}>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <div style={tabsRow}>
            <div className="home-tabs" style={tabsScroller}>
              {categories.map((category) => {
                const active = category === activeCategory;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    style={{
                      ...tabButton,
                      ...(active ? tabButtonActive : null),
                    }}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
            <button type="button" aria-label="Next" style={tabsNext}>
              <ChevronRight size={18} />
            </button>
          </div>
        </section>

        {/* Member Dashboard Section */}
        {mounted && user?.role === 'MEMBER' && (
          <section style={memberDashboardSection}>
            <div style={memberDashboardContainer}>
              <h2 style={memberWelcomeTitle}>
                Welcome back, {user.firstName || 'Member'}!
              </h2>
              <p style={memberWelcomeSubtitle}>
                Access your digital pass and manage your Umuganda participation
              </p>
              
              <div style={memberCardsGrid}>
                {/* Pass Status Card */}
                <article style={memberCardStyle}>
                  <div style={memberCardHeader}>
                    <div style={memberCardIcon}>
                      <Ticket size={24} />
                    </div>
                    <h3 style={memberCardTitle}>Digital Pass</h3>
                  </div>
                  <div style={memberCardContent}>
                    {loadingPass ? (
                      <div style={passLoadingStyle}>
                        <div style={passSpinnerStyle} />
                        <p style={passLoadingText}>Loading your pass...</p>
                      </div>
                    ) : memberPass ? (
                      <div style={passActiveStyle}>
                        <div style={passStatusBadge}>
                          <span style={passStatusDot} />
                          Active
                        </div>
                        <p style={passInfoText}>
                          Your digital pass is ready for Umuganda check-in
                        </p>
                        {memberPass.expiresAt && (
                          <p style={passExpiryText}>
                            Expires: {new Date(memberPass.expiresAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div style={passInactiveStyle}>
                        <div style={passStatusBadgeInactive}>
                          <span style={passStatusDotInactive} />
                          Not Issued
                        </div>
                        <p style={passInfoText}>
                          Contact your church administrator to get your digital pass
                        </p>
                      </div>
                    )}
                  </div>
                  <div style={memberCardActions}>
                    {memberPass ? (
                      <button 
                        onClick={() => setShowPassModal(true)}
                        style={primaryActionButton}
                      >
                        <Download size={16} />
                        View & Download Pass
                      </button>
                    ) : (
                      <button 
                        disabled 
                        style={disabledActionButton}
                      >
                        <Ticket size={16} />
                        Pass Not Available
                      </button>
                    )}
                  </div>
                </article>

                {/* Profile Card */}
                <article style={memberCardStyle}>
                  <div style={memberCardHeader}>
                    <div style={memberCardIcon}>
                      <User size={24} />
                    </div>
                    <h3 style={memberCardTitle}>My Profile</h3>
                  </div>
                  <div style={memberCardContent}>
                    <div style={profileInfoStyle}>
                      <div style={profileDetailRow}>
                        <span style={profileLabel}>Name:</span>
                        <span style={profileValue}>
                          {memberProfile 
                            ? `${memberProfile.firstName || ''} ${memberProfile.lastName || ''}`.trim()
                            : `${user.firstName || ''} ${user.lastName || ''}`.trim()
                          }
                        </span>
                      </div>
                      {memberProfile?.nationalId && (
                        <div style={profileDetailRow}>
                          <span style={profileLabel}>National ID:</span>
                          <span style={profileValue}>{memberProfile.nationalId}</span>
                        </div>
                      )}
                      {memberProfile?.church && (
                        <div style={profileDetailRow}>
                          <span style={profileLabel}>Church:</span>
                          <span style={profileValue}>{memberProfile.church.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={memberCardActions}>
                    <button 
                      onClick={() => setShowPassModal(true)}
                      style={secondaryActionButton}
                    >
                      <User size={16} />
                      View Full Dashboard
                    </button>
                  </div>
                </article>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

const navLinks = [
  { href: '/', label: 'Home', icon: <Home size={16} /> },
  { href: '#track', label: 'Track passes', icon: <Ticket size={16} /> },
];

const responsiveOverrides = `
  .mobile-menu-button {
    display: none;
  }

  .home-nav-link {
    transition: all 0.2s ease;
    border-radius: 8px;
  }

  .home-nav-link:hover {
    color: rgba(12, 46, 86, 0.98) !important;
    background: rgba(12, 46, 86, 0.08);
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 1024px) {
    .desktop-nav {
      display: none !important;
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
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(18px);
      border: 1px solid rgba(15, 23, 42, 0.12);
      box-shadow: 0 16px 40px rgba(2, 6, 23, 0.18);
      padding: 1.75rem;
      z-index: 20;
    }
    .mobile-menu.open {
      display: block;
    }
    .hero-section {
      flex-direction: column;
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
    .memberCardsGrid {
      grid-template-columns: 1fr;
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
    .memberWelcomeTitle {
      font-size: 1.5rem;
    }
    .memberWelcomeSubtitle {
      font-size: 1rem;
    }
  }

  @media (max-width: 480px) {}
`;

const pageShell: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  color: '#0f172a',
  background: '#ffffff',
  position: 'relative',
};

const headerShell: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1.5rem',
  padding: '0.9rem clamp(1.25rem, 4vw, 3.5rem)',
  background: '#ffffff',
};

const brandCluster: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.85rem',
};

const brandTextBlock: CSSProperties = {
  display: 'grid',
  gap: '0.12rem',
  lineHeight: 1.05,
};

const brandLogoShell: CSSProperties = {
  width: '56px',
  height: '56px',
  borderRadius: '12px',
  display: 'grid',
  placeItems: 'center',
  background: 'transparent',
  border: 'none',
  boxShadow: 'none',
};

const brandOverlineLight: CSSProperties = {
  fontSize: '0.68rem',
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
  color: 'rgba(15, 23, 42, 0.6)',
  fontWeight: 600,
};

const brandHeadlineLight: CSSProperties = {
  fontSize: '1.02rem',
  fontWeight: 600,
  letterSpacing: '-0.01em',
  color: 'rgba(15, 23, 42, 0.96)',
};

const brandHeadlineSecondary: CSSProperties = {
  fontSize: '0.92rem',
  fontWeight: 500,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(15, 23, 42, 0.72)',
};

const topNavLeft: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.5rem',
  minWidth: 0,
};

const topNavCenter: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  flex: 1,
};

const topNavRight: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: '1.25rem',
  flexShrink: 0,
};

const topNavLinks: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '2.5rem',
  fontSize: '0.95rem',
  letterSpacing: '0.01em',
  padding: '0 1rem',
};

const topNavLink: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.35rem 0.1rem',
  whiteSpace: 'nowrap',
};

const topNavLinkIcon: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  opacity: 0.75,
};

const topNavMeta: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '1.25rem',
  fontSize: '0.95rem',
  color: 'rgba(15, 23, 42, 0.7)',
};

const topNavMetaLink: CSSProperties = {
  padding: '0.35rem 0',
  whiteSpace: 'nowrap',
};

const langPicker: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.35rem 0.6rem',
  borderRadius: '999px',
  border: '1px solid rgba(15, 23, 42, 0.12)',
  background: 'rgba(255, 255, 255, 0.9)',
  whiteSpace: 'nowrap',
};

const topNavAuth: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.75rem',
};

const authGhostButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.55rem 0.9rem',
  borderRadius: '8px',
  border: '1px solid rgba(37, 99, 235, 0.35)',
  background: '#ffffff',
  color: '#2563eb',
  fontWeight: 600,
  fontSize: '0.92rem',
  whiteSpace: 'nowrap',
};

const authPrimaryButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.6rem 1rem',
  borderRadius: '8px',
  border: '1px solid rgba(37, 99, 235, 0.18)',
  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 45%, #0ea5e9 100%)',
  color: '#ffffff',
  fontWeight: 700,
  fontSize: '0.92rem',
  whiteSpace: 'nowrap',
};

const mobileMenuButtonLight: CSSProperties = {
  background: 'rgba(255, 255, 255, 0.9)',
  border: '1px solid rgba(15, 23, 42, 0.16)',
  borderRadius: '10px',
  padding: '0.5rem 0.65rem',
  color: 'rgba(15, 23, 42, 0.9)',
  cursor: 'pointer',
};

const homeMain: CSSProperties = {
  flex: 1,
  padding: '1.25rem clamp(1.25rem, 4vw, 3.5rem) 3.25rem',
  display: 'grid',
  gap: '2.5rem',
};

const heroOuter: CSSProperties = {
  display: 'grid',
  gap: '1.25rem',
};

const heroCard: CSSProperties = {
  position: 'relative',
  borderRadius: '26px',
  overflow: 'hidden',
  backgroundImage: 'url(/Home.jpg)',
  backgroundSize: 'cover',
  backgroundPosition: 'center 40%',
  minHeight: '340px',
};

const heroOverlay: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'linear-gradient(90deg, rgba(2, 6, 23, 0.92), rgba(2, 6, 23, 0.62) 55%, rgba(2, 6, 23, 0.35))',
};

const heroInner: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  height: '100%',
  padding: '3.2rem clamp(1.25rem, 4vw, 3.25rem)',
  display: 'grid',
  placeItems: 'center',
  textAlign: 'center',
  gap: '1.25rem',
};

const heroTextBlockNew: CSSProperties = {
  display: 'grid',
  gap: '0.85rem',
  justifyItems: 'center',
};

const heroKicker: CSSProperties = {
  margin: 0,
  color: 'rgba(255, 255, 255, 0.9)',
  fontWeight: 700,
  fontSize: '1.35rem',
};

const heroTitleNew: CSSProperties = {
  margin: 0,
  color: '#ffffff',
  fontWeight: 800,
  fontSize: 'clamp(2.4rem, 4vw, 4rem)',
  lineHeight: 1.05,
  letterSpacing: '-0.02em',
};

const poweredByPill: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.35rem 0.8rem',
  borderRadius: '999px',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  background: 'rgba(15, 23, 42, 0.55)',
  color: 'rgba(255, 255, 255, 0.92)',
  fontSize: '0.82rem',
  fontWeight: 600,
};

const heroSearchShell: CSSProperties = {
  width: 'min(560px, 100%)',
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  alignItems: 'center',
  gap: '0.6rem',
  padding: '0.65rem 0.75rem',
  borderRadius: '12px',
  background: '#ffffff',
  border: '1px solid rgba(203, 213, 225, 0.9)',
  boxShadow: '0 18px 36px rgba(2, 6, 23, 0.24)',
};

const heroSearchInput: CSSProperties = {
  border: 'none',
  outline: 'none',
  fontSize: '0.98rem',
  padding: '0.2rem 0',
  width: '100%',
  color: 'rgba(15, 23, 42, 0.9)',
};

const heroSearchGo: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.2rem',
  height: '2.2rem',
  borderRadius: '10px',
  border: '1px solid rgba(12, 46, 86, 0.22)',
  background: 'rgba(12, 46, 86, 0.08)',
  color: 'rgba(12, 46, 86, 0.92)',
  cursor: 'pointer',
};

const tabsRow: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr auto',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.25rem 0.25rem',
};

const tabsScroller: CSSProperties = {
  display: 'flex',
  gap: '1.6rem',
  overflowX: 'auto',
  padding: '0.6rem 0.25rem',
  borderBottom: '1px solid rgba(15, 23, 42, 0.1)',
};

const tabButton: CSSProperties = {
  border: 'none',
  background: 'transparent',
  padding: '0.55rem 0',
  fontSize: '0.93rem',
  fontWeight: 600,
  color: 'rgba(15, 23, 42, 0.65)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  borderBottom: '2px solid transparent',
};

const tabButtonActive: CSSProperties = {
  color: '#2563eb',
  borderBottomColor: '#2563eb',
};

const tabsNext: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.2rem',
  height: '2.2rem',
  borderRadius: '10px',
  border: '1px solid rgba(15, 23, 42, 0.12)',
  background: '#ffffff',
  cursor: 'pointer',
  color: 'rgba(15, 23, 42, 0.7)',
};

// Member Dashboard Styles
const memberDashboardSection: CSSProperties = {
  padding: '2rem 0',
  background: '#ffffff',
};

const memberDashboardContainer: CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 1.5rem',
};

const memberWelcomeTitle: CSSProperties = {
  fontSize: '2rem',
  fontWeight: 700,
  color: '#1e293b',
  margin: '0 0 0.5rem 0',
  textAlign: 'center',
};

const memberWelcomeSubtitle: CSSProperties = {
  fontSize: '1.1rem',
  color: '#64748b',
  margin: '0 0 2rem 0',
  textAlign: 'center',
  lineHeight: 1.6,
};

const memberCardsGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '1.5rem',
  marginBottom: '2rem',
};

const memberCardStyle: CSSProperties = {
  background: '#ffffff',
  borderRadius: '16px',
  padding: '1.5rem',
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
  border: '1px solid rgba(226, 232, 240, 0.8)',
};

const memberCardHeader: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  marginBottom: '1rem',
};

const memberCardIcon: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  color: '#ffffff',
};

const memberCardTitle: CSSProperties = {
  fontSize: '1.25rem',
  fontWeight: 600,
  color: '#1e293b',
  margin: 0,
};

const memberCardContent: CSSProperties = {
  marginBottom: '1.5rem',
};

const memberCardActions: CSSProperties = {
  display: 'flex',
  gap: '0.75rem',
};

const primaryActionButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1.25rem',
  borderRadius: '8px',
  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  color: '#ffffff',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '0.95rem',
  border: 'none',
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
};

const secondaryActionButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1.25rem',
  borderRadius: '8px',
  background: 'transparent',
  color: '#2563eb',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '0.95rem',
  border: '1px solid #2563eb',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const disabledActionButton: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1.25rem',
  borderRadius: '8px',
  background: '#f1f5f9',
  color: '#94a3b8',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '0.95rem',
  border: '1px solid #e2e8f0',
  cursor: 'not-allowed',
};

const passLoadingStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1rem',
  padding: '1rem',
};

const passSpinnerStyle: CSSProperties = {
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  border: '3px solid #e2e8f0',
  borderTopColor: '#2563eb',
  animation: 'spin 1s linear infinite',
};

const passLoadingText: CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontSize: '0.95rem',
};

const passActiveStyle: CSSProperties = {
  display: 'grid',
  gap: '0.75rem',
};

const passInactiveStyle: CSSProperties = {
  display: 'grid',
  gap: '0.75rem',
};

const passStatusBadge: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.25rem 0.75rem',
  borderRadius: '20px',
  background: '#dcfce7',
  color: '#166534',
  fontSize: '0.85rem',
  fontWeight: 600,
  width: 'fit-content',
};

const passStatusBadgeInactive: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.25rem 0.75rem',
  borderRadius: '20px',
  background: '#fef2f2',
  color: '#991b1b',
  fontSize: '0.85rem',
  fontWeight: 600,
  width: 'fit-content',
};

const passStatusDot: CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: '#22c55e',
};

const passStatusDotInactive: CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: '#ef4444',
};

const passInfoText: CSSProperties = {
  margin: 0,
  color: '#475569',
  fontSize: '0.95rem',
  lineHeight: 1.5,
};

const passExpiryText: CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontSize: '0.85rem',
  fontStyle: 'italic',
};

const profileInfoStyle: CSSProperties = {
  display: 'grid',
  gap: '0.75rem',
};

const profileDetailRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.5rem 0',
  borderBottom: '1px solid #f1f5f9',
};

const profileLabel: CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#64748b',
};

const profileValue: CSSProperties = {
  fontSize: '0.95rem',
  fontWeight: 500,
  color: '#1e293b',
};

// Modal Styles
const modalOverlayStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem',
};

const modalContentStyle: CSSProperties = {
  background: '#ffffff',
  borderRadius: '16px',
  maxWidth: '600px',
  width: '100%',
  maxHeight: '90vh',
  overflow: 'auto',
  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
};

const modalHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '1.5rem 1.5rem 0',
  borderBottom: '1px solid #e2e8f0',
  marginBottom: '1.5rem',
};

const modalTitleStyle: CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#1e293b',
  margin: 0,
};

const modalCloseButtonStyle: CSSProperties = {
  background: 'none',
  border: 'none',
  fontSize: '2rem',
  color: '#64748b',
  cursor: 'pointer',
  padding: '0',
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  transition: 'background-color 0.2s ease',
};

const modalBodyStyle: CSSProperties = {
  padding: '0 1.5rem 1.5rem',
};

const modalActionsStyle: CSSProperties = {
  display: 'flex',
  gap: '1rem',
  justifyContent: 'flex-end',
  marginTop: '2rem',
  paddingTop: '1.5rem',
  borderTop: '1px solid #e2e8f0',
};

const modalPrimaryButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1.5rem',
  borderRadius: '8px',
  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  color: '#ffffff',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '0.95rem',
  border: 'none',
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
};

const modalSecondaryButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1.5rem',
  borderRadius: '8px',
  background: 'transparent',
  color: '#64748b',
  textDecoration: 'none',
  fontWeight: 600,
  fontSize: '0.95rem',
  border: '1px solid #e2e8f0',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

// Pass Card Styles
const passDisplayStyle: CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
};

const passCardStyle: CSSProperties = {
  background: 'linear-gradient(135deg, #1e293b, #334155)',
  borderRadius: '16px',
  padding: '1.5rem',
  color: '#ffffff',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
};

const passCardHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '1.5rem',
};

const passBrandStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
};

const passLogoStyle: CSSProperties = {
  width: '50px',
  height: '50px',
  background: '#ffffff',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.5rem',
};

const passBrandTextStyle: CSSProperties = {
  display: 'grid',
  gap: '0.2rem',
};

const passOverlineStyle: CSSProperties = {
  fontSize: '0.8rem',
  fontWeight: 700,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'rgba(255, 255, 255, 0.8)',
};

const passBrandNameStyle: CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 700,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

const passMetaStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

const passCardBodyStyle: CSSProperties = {
  marginBottom: '1.5rem',
};

const passIdentityStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '1rem',
  marginBottom: '1.5rem',
};

const passAvatarStyle: CSSProperties = {
  width: '60px',
  height: '60px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.5rem',
  fontWeight: 700,
};

const passNameBlockStyle: CSSProperties = {
  display: 'grid',
  gap: '0.3rem',
};

const passNameStyle: CSSProperties = {
  fontSize: '1.3rem',
  fontWeight: 700,
  margin: 0,
  color: '#ffffff',
};

const passRoleStyle: CSSProperties = {
  fontSize: '0.9rem',
  color: 'rgba(255, 255, 255, 0.7)',
  margin: 0,
};

const passDetailsStyle: CSSProperties = {
  display: 'grid',
  gap: '0.8rem',
};

const passDetailRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.5rem 0',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
};

const passDetailLabelStyle: CSSProperties = {
  fontSize: '0.85rem',
  color: 'rgba(255, 255, 255, 0.7)',
  fontWeight: 500,
};

const passDetailValueStyle: CSSProperties = {
  fontSize: '0.95rem',
  color: '#ffffff',
  fontWeight: 600,
};

const passFooterStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  paddingTop: '1rem',
};

const passSignatureStyle: CSSProperties = {
  display: 'grid',
  gap: '0.3rem',
  alignItems: 'center',
};

const signatureLineStyle: CSSProperties = {
  width: '80px',
  height: '2px',
  background: 'rgba(255, 255, 255, 0.3)',
};

const signatureLabelStyle: CSSProperties = {
  fontSize: '0.75rem',
  color: 'rgba(255, 255, 255, 0.7)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
};

const passDateStyle: CSSProperties = {
  display: 'grid',
  gap: '0.2rem',
  textAlign: 'right',
};

const footerMetaLabelStyle: CSSProperties = {
  fontSize: '0.75rem',
  color: 'rgba(255, 255, 255, 0.7)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  margin: 0,
};

const footerMetaTextStyle: CSSProperties = {
  fontSize: '0.85rem',
  color: '#ffffff',
  fontWeight: 600,
  margin: 0,
};

// Pass Not Available Styles
const passNotAvailableStyle: CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
  textAlign: 'center',
  padding: '2rem',
};

const passNotAvailableIconStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  color: '#94a3b8',
  marginBottom: '1rem',
};

const passNotAvailableTitleStyle: CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: '#1e293b',
  margin: 0,
};

const passNotAvailableTextStyle: CSSProperties = {
  fontSize: '1rem',
  color: '#64748b',
  lineHeight: 1.6,
  margin: 0,
};

// QR Code Styles
const qrCodeSectionStyle: CSSProperties = {
  display: 'grid',
  gap: '1rem',
  textAlign: 'center',
  padding: '1.5rem',
  background: '#f8fafc',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
};

const qrCodeTitleStyle: CSSProperties = {
  fontSize: '1.1rem',
  fontWeight: 600,
  color: '#1e293b',
  margin: 0,
};

const qrCodeContainerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '0.75rem',
};

const qrCodeWrapperStyle: CSSProperties = {
  background: '#ffffff',
  padding: '1rem',
  borderRadius: '8px',
  display: 'inline-block',
  border: '1px solid #e2e8f0',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
};

const qrCodeDescriptionStyle: CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontSize: '0.9rem',
  lineHeight: 1.5,
};

// Card Display Styles
const cardDisplayStyle: CSSProperties = {
  display: 'grid',
  gap: '1.5rem',
};

const cardTabsStyle: CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '1.5rem',
  borderBottom: '1px solid #e2e8f0',
};

const activeCardTab: CSSProperties = {
  padding: '0.75rem 1.5rem',
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid #2563eb',
  color: '#2563eb',
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
};

const inactiveCardTab: CSSProperties = {
  padding: '0.75rem 1.5rem',
  background: 'transparent',
  border: 'none',
  borderBottom: '2px solid transparent',
  color: '#64748b',
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const cardPreviewContainer: CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  padding: '2rem',
  background: '#f8fafc',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
};

const cardScaleStyle: CSSProperties = {
  transform: 'scale(1.2)',
  transformOrigin: 'center',
};

// Front Side Card Styles
const cardFrontStyle: CSSProperties = {
  width: '321px',
  height: '204px',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '16px',
  color: '#1e293b',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
};

const cardBackgroundPattern: CSSProperties = {
  display: 'none',
};

const cardPatternCircle1: CSSProperties = {
  display: 'none',
};

const cardPatternCircle2: CSSProperties = {
  display: 'none',
};

const cardPatternCircle3: CSSProperties = {
  display: 'none',
};

const cardHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '12px',
  position: 'relative',
  zIndex: 1,
};

const cardLogoStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const cardLogoIcon: CSSProperties = {
  width: '32px',
  height: '32px',
  background: 'transparent',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0',
};

const cardBrandStyle: CSSProperties = {
  fontSize: '8px',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#2563eb',
};

const cardTitleStyle: CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  lineHeight: 1,
  color: '#1e293b',
};

const cardSubtitleStyle: CSSProperties = {
  fontSize: '8px',
  fontWeight: 700,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: '#64748b',
};

const cardIdStyle: CSSProperties = {
  textAlign: 'right',
};

const cardIdLabel: CSSProperties = {
  fontSize: '6px',
  color: '#64748b',
  textTransform: 'uppercase',
};

const cardIdValue: CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  fontFamily: 'monospace',
  color: '#1e293b',
};

const cardPhotoSectionStyle: CSSProperties = {
  display: 'flex',
  gap: '12px',
  marginBottom: '12px',
  position: 'relative',
  zIndex: 1,
};

const cardPhotoStyle: CSSProperties = {
  width: '45px',
  height: '56px',
  background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '18px',
  fontWeight: 700,
  border: '2px solid rgba(37, 99, 235, 0.28)',
  color: '#ffffff',
  flexShrink: 0,
};

const cardInfoStyle: CSSProperties = {
  flex: 1,
};

const cardNameStyle: CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  marginBottom: '2px',
  lineHeight: 1.1,
  color: '#1e293b',
};

const cardRoleStyle: CSSProperties = {
  fontSize: '8px',
  color: '#64748b',
  marginBottom: '4px',
};

const cardChurchStyle: CSSProperties = {
  fontSize: '9px',
  color: '#475569',
};

const cardQRSectionStyle: CSSProperties = {
  position: 'relative',
  zIndex: 1,
};

const cardQRContainerStyle: CSSProperties = {
  width: '80px',
  height: '80px',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  padding: '4px',
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const cardQRStyle: CSSProperties = {
  width: '72px',
  height: '72px',
  background: '#f8fafc',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '6px',
  textAlign: 'center',
  color: '#6b7280',
};

const cardQRPlaceholderStyle: CSSProperties = {
  fontSize: '6px',
  textAlign: 'center',
  color: '#6b7280',
};

const cardFooterStyle: CSSProperties = {
  position: 'absolute',
  bottom: '8px',
  left: '16px',
  right: '16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '7px',
  color: '#64748b',
  zIndex: 1,
};

const cardFooterLabelStyle: CSSProperties = {
  textTransform: 'uppercase',
};

const cardFooterValueStyle: CSSProperties = {
  fontWeight: 600,
  color: '#1e293b',
};

const cardTokenStyle: CSSProperties = {
  textAlign: 'right',
};

const cardTokenValueStyle: CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '6px',
  color: '#1e293b',
};

// New Layout Styles
const cardMainContentStyle: CSSProperties = {
  display: 'flex',
  gap: '16px',
  marginBottom: '8px',
  position: 'relative',
  zIndex: 1,
};

const cardLeftSectionStyle: CSSProperties = {
  display: 'flex',
  gap: '12px',
  flex: 1,
};

const cardMemberInfoStyle: CSSProperties = {
  flex: 1,
};

const cardPhoneStyle: CSSProperties = {
  fontSize: '8px',
  color: '#64748b',
  marginBottom: '2px',
};

const cardEmailStyle: CSSProperties = {
  fontSize: '8px',
  color: '#64748b',
  wordBreak: 'break-all',
};

const cardRightSectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
};

const cardQRLabelStyle: CSSProperties = {
  fontSize: '7px',
  fontWeight: 600,
  color: '#2563eb',
  textAlign: 'center',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: '4px',
};

const cardQRSubtextStyle: CSSProperties = {
  fontSize: '6px',
  color: '#64748b',
  fontFamily: 'monospace',
  textAlign: 'center',
};

// Back Side Card Styles
const cardBackStyle: CSSProperties = {
  width: '321px',
  height: '204px',
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '16px',
  color: '#1e293b',
  position: 'relative',
  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
};

const cardBackHeaderStyle: CSSProperties = {
  textAlign: 'center',
  marginBottom: '12px',
  paddingBottom: '8px',
  borderBottom: '1px solid #e2e8f0',
};

const cardBackTitleStyle: CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: '#64748b',
};

const cardBackSubtitleStyle: CSSProperties = {
  fontSize: '8px',
  color: '#94a3b8',
};

const cardTermsStyle: CSSProperties = {
  marginBottom: '12px',
};

const cardTermsTitleStyle: CSSProperties = {
  fontSize: '8px',
  fontWeight: 600,
  marginBottom: '4px',
  color: '#475569',
};

const cardTermsTextStyle: CSSProperties = {
  fontSize: '7px',
  color: '#64748b',
  lineHeight: 1.3,
};

const cardMemberInfoTitleStyle: CSSProperties = {
  fontSize: '8px',
  fontWeight: 600,
  marginBottom: '4px',
  color: '#475569',
};

const cardMemberInfoTextStyle: CSSProperties = {
  fontSize: '7px',
  color: '#64748b',
  lineHeight: 1.3,
};

const cardSignatureStyle: CSSProperties = {
  marginBottom: '8px',
};

const cardSignatureTitleStyle: CSSProperties = {
  fontSize: '8px',
  fontWeight: 600,
  marginBottom: '4px',
  color: '#475569',
};

const cardSignatureLineStyle: CSSProperties = {
  width: '100%',
  height: '30px',
  borderBottom: '1px solid #d1d5db',
  position: 'relative',
};

const cardAuthorityStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  fontSize: '6px',
  color: '#94a3b8',
};

const cardAuthorityTitleStyle: CSSProperties = {
  fontWeight: 600,
  color: '#64748b',
};

const cardContactStyle: CSSProperties = {
  textAlign: 'right',
};

const passDecorativeAccent: CSSProperties = {
  position: 'absolute',
  top: '8px',
  right: '8px',
  width: '20px',
  height: '20px',
  background: 'linear-gradient(45deg, #2563eb, #3b82f6)',
  borderRadius: '50%',
  opacity: 0.8,
};

const cardSecurityFeature1: CSSProperties = {
  position: 'absolute',
  bottom: '8px',
  right: '8px',
  width: '15px',
  height: '15px',
  background: 'linear-gradient(45deg, #2563eb, #3b82f6)',
  borderRadius: '50%',
  opacity: 0.8,
};

const cardSecurityFeature2: CSSProperties = {
  position: 'absolute',
  bottom: '8px',
  left: '8px',
  width: '15px',
  height: '15px',
  background: 'linear-gradient(45deg, #3b82f6, #2563eb)',
  borderRadius: '50%',
  opacity: 0.8,
};

const navStyle: CSSProperties = {
  display: 'flex',
  gap: '1.5rem',
  justifyContent: 'center',
  fontSize: '0.95rem',
  letterSpacing: '0.04em',
};

const navLinkStyle: CSSProperties = {
  color: '#ffffff',
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
  padding: '0',
  background: 'transparent',
};

const heroSection: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4rem',
  padding: '2rem',
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
  color: '#ffffff',
};

const heroDescription: CSSProperties = {
  margin: 0,
  fontSize: '1.1rem',
  lineHeight: 1.8,
  color: '#ffffff',
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
  color: '#000000',
};

const sectionTitle: CSSProperties = {
  margin: 0,
  fontSize: '2.15rem',
  lineHeight: 1.3,
  color: '#000000',
};

const sectionDescription: CSSProperties = {
  margin: 0,
  fontSize: '1rem',
  lineHeight: 1.7,
  color: '#000000',
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
  border: '1px solid rgba(0,0,0,0.22)',
  background: '#ffffff',
  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
};

const featureIcon: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '3rem',
  height: '3rem',
  borderRadius: '1.2rem',
  background: 'linear-gradient(145deg, rgba(0,0,0,0.1), rgba(0,0,0,0.05))',
  boxShadow: '0 14px 28px rgba(0,0,0,0.15)',
  alignSelf: 'center',
  marginBottom: '0.4rem',
};

const featureHeading: CSSProperties = {
  margin: 0,
  fontSize: '1.35rem',
  color: '#000000',
};

const featureBody: CSSProperties = {
  margin: 0,
  color: '#000000',
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
  border: '1px solid rgba(0,0,0,0.24)',
  background: '#ffffff',
  boxShadow: '0 26px 48px rgba(0,0,0,0.15)',
};

const workflowTitle: CSSProperties = {
  margin: 0,
  fontSize: '2rem',
  lineHeight: 1.3,
  color: '#000000',
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
  border: '1px solid rgba(0,0,0,0.24)',
  background: '#ffffff',
  boxShadow: '0 24px 42px rgba(0,0,0,0.15)',
};

const asideHeading: CSSProperties = {
  margin: 0,
  fontSize: '1.2rem',
  color: '#000000',
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
  borderBottom: '1px solid rgba(0,0,0,0.16)',
  color: '#000000',
  fontSize: '0.95rem',
};


const ctaSection: CSSProperties = {
  padding: '3.5rem',
  borderRadius: '32px',
  border: '1px solid rgba(0,0,0,0.24)',
  background: '#ffffff',
  boxShadow: '0 26px 46px rgba(0,0,0,0.15)',
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
  color: '#000000',
};

const ctaTitle: CSSProperties = {
  margin: '0.6rem 0',
  fontSize: '2.2rem',
  lineHeight: 1.3,
  color: '#000000',
};

const ctaDescription: CSSProperties = {
  margin: 0,
  color: '#000000',
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

const roleBadge: Record<RoleKey, CSSProperties> = {
  UNION_ADMIN: {
    color: 'var(--shell-foreground)',
    fontSize: '0.85rem',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  DISTRICT_ADMIN: {
    color: 'var(--shell-foreground)',
    fontSize: '0.85rem',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  CHURCH_ADMIN: {
    color: 'var(--shell-foreground)',
    fontSize: '0.85rem',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  MEMBER: {
    color: 'var(--shell-foreground)',
    fontSize: '0.85rem',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  POLICE_VERIFIER: {
    color: 'var(--shell-foreground)',
    fontSize: '0.85rem',
    fontWeight: 600,
    textTransform: 'uppercase',
  },
};

const userMenuButton: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  background: 'none',
  border: 'none',
  padding: '0.5rem',
  borderRadius: '0.5rem',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  color: 'var(--shell-foreground)',
};

const userAvatar: CSSProperties = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  backgroundColor: 'var(--primary)',
  color: 'var(--on-primary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 600,
  fontSize: '0.9rem',
  flexShrink: 0,
};

const userInfo: CSSProperties = {
  textAlign: 'left',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.125rem',
};

const userName: CSSProperties = {
  fontWeight: 600,
  color: 'var(--shell-foreground)',
  fontSize: '0.9375rem',
  lineHeight: 1.2,
};

const userRole: CSSProperties = {
  color: 'var(--muted)',
  fontSize: '0.8125rem',
  lineHeight: 1.2,
};

const dropdownMenu: CSSProperties = {
  position: 'absolute',
  right: '1rem',
  top: 'calc(100% + 0.5rem)',
  backgroundColor: 'var(--surface-primary)',
  borderRadius: '0.5rem',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  minWidth: '200px',
  overflow: 'hidden',
  zIndex: 50,
  border: '1px solid var(--surface-border)',
  color: 'var(--shell-foreground)',
};

const dropdownItem: CSSProperties = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  width: '100%',
  background: 'none',
  border: 'none',
  color: 'var(--shell-foreground)',
  fontSize: '0.9375rem',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
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
    icon: <ClipboardList size={36} strokeWidth={1.6} color="rgba(0,0,0,0.8)" />, 
    title: 'Attendance ledger without friction',
    copy: 'Digitise congregation roll calls with QR scans, auto-tagging each service hour against the right district oversight.',
    points: ['Live heatmaps for union administrators', 'Offline mode with auto-sync', 'Tamper-evident audit trails'],
  },
  {
    icon: <ShieldCheck size={36} strokeWidth={1.6} color="rgba(0,0,0,0.8)" />, 
    title: 'Policy-aligned enforcement',
    copy: 'Issue, revoke, or expire passes with granular permissions grounded in SDA Rwanda governance layers.',
    points: ['Union → district → church hierarchy', 'Police verification checkpoints', 'Role-tuned dashboards'],
  },
  {
    icon: <UsersRound size={36} strokeWidth={1.6} color="rgba(0,0,0,0.8)" />, 
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
