"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Phone, Clock, ChevronDown, Home, X } from "lucide-react";
import { usePathname } from "next/navigation";
import czFlag from "@/cz.png";
import gbFlag from "@/gb.png";
import { useLanguage } from "@/src/lib/LanguageContext";
import { t } from "@/src/lib/translations";

interface AlertContent {
  active?: boolean;
  text?: string;
  text_en?: string;
}

interface KontaktContent {
  phone: string;
  hours: { weekdays: string; saturday: string; sunday: string };
}

interface ServiceItem {
  title: string;
  shortDesc: string;
  longDesc: string;
}

interface HeaderClientProps {
  alert?: AlertContent;
  kontaktCs?: KontaktContent;
  kontaktEn?: KontaktContent;
  servicesCs?: ServiceItem[];
  servicesEn?: ServiceItem[];
}

function LanguageToggleVisual({ lang, size = 18 }: { lang: "cs" | "en" ; size?: number }) {
  const flagHeight = Math.round(size * 0.68);

  return (
    <>
      <span style={{ opacity: lang === "cs" ? 1 : 0.45, display: "inline-flex", alignItems: "center" }}>
        <Image
          src={czFlag}
          alt="Čeština"
          width={size}
          height={flagHeight}
          style={{ width: `${size}px`, height: `${flagHeight}px`, objectFit: "cover", borderRadius: "2px" }}
        />
      </span>
      <span style={{ color: "var(--gold-light)", fontSize: `${Math.max(12, size - 2)}px`, lineHeight: 1 }}>/</span>
      <span style={{ opacity: lang === "en" ? 1 : 0.45, display: "inline-flex", alignItems: "center" }}>
        <Image
          src={gbFlag}
          alt="English"
          width={size}
          height={flagHeight}
          style={{ width: `${size}px`, height: `${flagHeight}px`, objectFit: "cover", borderRadius: "2px" }}
        />
      </span>
    </>
  );
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getLeftNav(lang: "cs" | "en") {
  return [
    { href: "/", label: "", isHome: true },
    { href: "/vozy", label: t("nav.inventory", lang) },
    { href: "/sluzby", label: t("nav.services", lang), hasSubmenu: true }
  ];
}

function getRightNav(lang: "cs" | "en") {
  return [
    { href: "/o-nas", label: t("nav.about", lang) },
    { href: "/kontakt", label: t("nav.contact", lang) }
  ];
}

function getSluzbySubmenu(
  servicesCs: ServiceItem[],
  servicesEn: ServiceItem[],
  lang: "cs" | "en"
) {
  // Slugs are always derived from the Czech title (URL never changes with language)
  return servicesCs.map((csService, i) => ({
    label: lang === "en" ? (servicesEn[i]?.title ?? csService.title) : csService.title,
    href: `/sluzby/${slugify(csService.title)}`,
  }));
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {open ? (
        <>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </>
      ) : (
        <>
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </>
      )}
    </svg>
  );
}

export function HeaderClient({ alert, kontaktCs, kontaktEn, servicesCs = [], servicesEn = [] }: HeaderClientProps) {
  const pathname = usePathname();
  const { lang, toggleLang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [sluzbyOpen, setSluzbyOpen] = useState(false);
  const [desktopSluzbyPinned, setDesktopSluzbyPinned] = useState(false);
  const [mobileSluzbyOpen, setMobileSluzbyOpen] = useState(false);
  const sluzbyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const desktopSluzbyRef = useRef<HTMLDivElement | null>(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  const [alertDismissed, setAlertDismissed] = useState(false);
  const kontakt = lang === "en" ? (kontaktEn ?? kontaktCs ?? null) : (kontaktCs ?? kontaktEn ?? null);
  const alertText = alert?.active
    ? ((lang === "en" && alert.text_en ? alert.text_en : alert.text) ?? "")
    : "";

  const leftNav = getLeftNav(lang);
  const rightNav = getRightNav(lang);
  const sluzbySubmenu = getSluzbySubmenu(servicesCs, servicesEn, lang);
  const isServicesPath = pathname === "/sluzby" || pathname.startsWith("/sluzby/");

  const dismissSluzby = () => {
    if (sluzbyTimeout.current) {
      clearTimeout(sluzbyTimeout.current);
      sluzbyTimeout.current = null;
    }
    setDesktopSluzbyPinned(false);
    setSluzbyOpen(false);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setMobileSluzbyOpen(false);
    dismissSluzby();
  };

  const openSluzby = () => {
    if (sluzbyTimeout.current) clearTimeout(sluzbyTimeout.current);
    setSluzbyOpen(true);
  };
  const closeSluzby = () => {
    if (desktopSluzbyPinned) return;
    sluzbyTimeout.current = setTimeout(() => setSluzbyOpen(false), 150);
  };
  const toggleDesktopSluzby = () => {
    if (sluzbyTimeout.current) clearTimeout(sluzbyTimeout.current);
    setDesktopSluzbyPinned((prev) => {
      const next = !prev;
      setSluzbyOpen(next);
      return next;
    });
  };

  useEffect(() => {
    return () => { if (sluzbyTimeout.current) clearTimeout(sluzbyTimeout.current); };
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setMobileSluzbyOpen(false);
    setDesktopSluzbyPinned(false);
    setSluzbyOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!desktopSluzbyPinned) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!desktopSluzbyRef.current?.contains(event.target as Node)) {
        setDesktopSluzbyPinned(false);
        setSluzbyOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [desktopSluzbyPinned]);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY < lastScrollY.current || currentY <= 10) {
        setHeaderVisible(true);
      } else if (currentY > lastScrollY.current) {
        setHeaderVisible(false);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Parse short hours for the top bar
  const shortHours = kontakt ? (() => {
    const wd = kontakt.hours.weekdays;
    const sat = kontakt.hours.saturday;
    // Extract just the time part after the colon/label
    const wdTime = wd.replace(/^[^:]+:\s*/, '').replace(/^[^0-9]*/, '');
    const satTime = sat.replace(/^[^:]+:\s*/, '').replace(/^[^0-9]*/, '');
    return lang === 'cs'
      ? `Po–Pá ${wdTime} · So ${satTime}`
      : `Mon–Fri ${wdTime} · Sat ${satTime}`;
  })() : '';

  return (
    <>
    {/* Top info bar */}
    {kontakt && (
      <div className="topbar" style={{
        position: 'sticky',
        top: headerVisible ? '0' : '-48px',
        zIndex: 31,
        transition: 'top 0.35s ease',
      }}>
        <div className="container-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '44px', gap: '16px' }}>
          <a href={`tel:${kontakt.phone.replace(/\s/g, '')}`}
            className="topbar-item"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', textDecoration: 'none', color: 'var(--gold-light)', fontWeight: 700, fontSize: '15px', letterSpacing: '0.04em', padding: '5px 0' }}
          >
            <Phone style={{ width: '14px', height: '14px', flexShrink: 0 }} />
            {kontakt.phone}
          </a>
          <span
            className="topbar-item topbar-hours"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', color: 'var(--cream)', fontSize: '14px', fontWeight: 600, letterSpacing: '0.04em' }}
          >
            <Clock style={{ width: '13px', height: '13px', flexShrink: 0, color: 'var(--gold-light)' }} />
            {shortHours}
          </span>
        </div>
      </div>
    )}

    <header style={{ position: 'sticky', top: headerVisible ? (kontakt ? '44px' : '0') : '-148px', zIndex: 30, background: 'var(--black)', borderBottom: alertText && !alertDismissed ? 'none' : '1px solid rgba(201,168,76,0.08)', transition: 'top 0.35s ease' }}>
      <div className="container-page" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '124px', gap: '16px' }}>
        {/* Left nav — desktop */}
        <nav style={{ display: 'none', alignItems: 'center', gap: '36px', fontFamily: "var(--font-body)", fontSize: '16px', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase' as const, flex: 1, justifyContent: 'flex-end', paddingRight: '180px' }} className="lg:!flex">
          {leftNav.map((item) => {
            if (item.hasSubmenu) {
              const isActive = isServicesPath;
              return (
                <div
                  key={item.href}
                  ref={desktopSluzbyRef}
                  style={{ position: 'relative' }}
                  onMouseEnter={openSluzby}
                  onMouseLeave={closeSluzby}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Link
                      href={item.href}
                      onClick={dismissSluzby}
                      style={{
                        whiteSpace: 'nowrap',
                        color: isActive || sluzbyOpen ? 'var(--gold)' : 'var(--cream-muted)',
                        transition: 'color 0.2s ease',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                    >
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      onClick={toggleDesktopSluzby}
                      aria-label={lang === 'cs' ? 'Rozbalit služby' : 'Open services menu'}
                      aria-expanded={sluzbyOpen}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        border: 'none',
                        background: 'transparent',
                        color: isActive || sluzbyOpen ? 'var(--gold)' : 'var(--cream-muted)',
                        cursor: 'pointer',
                        transition: 'color 0.2s ease'
                      }}
                    >
                      <ChevronDown style={{ width: '14px', height: '14px', transition: 'transform 0.2s', transform: sluzbyOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                    </button>
                  </div>
                  {sluzbyOpen && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      paddingTop: '12px',
                      zIndex: 50
                    }}>
                      <div style={{
                        background: 'var(--black-card)',
                        border: '1px solid var(--black-border)',
                        padding: '8px 0',
                        minWidth: '260px',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.5)'
                      }}>
                        {sluzbySubmenu.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            onClick={dismissSluzby}
                            style={{
                              display: 'block',
                              padding: '8px 20px',
                              fontSize: '14px',
                              fontWeight: 400,
                              letterSpacing: '0.06em',
                              textTransform: 'none',
                              color: 'var(--cream-muted)',
                              textDecoration: 'none',
                              transition: 'color 0.15s, background 0.15s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--gold)'; e.currentTarget.style.background = 'rgba(201,168,76,0.06)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--cream-muted)'; e.currentTarget.style.background = 'transparent'; }}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{ whiteSpace: 'nowrap', color: pathname === item.href ? 'var(--gold)' : 'var(--cream-muted)', transition: 'color 0.2s ease', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = pathname === item.href ? 'var(--gold)' : 'var(--cream-muted)')}
              >
                {'isHome' in item && item.isHome ? <Home style={{ width: '22px', height: '22px' }} /> : item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logo + phone — desktop (absolute center) */}
        <Link
          href="/"
          style={{
            display: 'none',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            textDecoration: 'none'
          }}
          className="lg:!flex"
          onClick={closeMenu}
        >
          <img
            src="/mikalogo2.png"
            alt="MIKA AUTO Logo"
            style={{ height: '72px', width: 'auto', objectFit: 'contain' }}
          />
          <span style={{
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.22em',
            textTransform: 'uppercase' as const,
            color: 'var(--gold)',
            fontFamily: 'var(--font-body)',
            marginTop: '1px',
          }}>
            since 2007
          </span>
        </Link>

        {/* Right nav — desktop */}
        <div style={{ display: 'none', alignItems: 'center', gap: '36px', fontFamily: "var(--font-body)", fontSize: '16px', fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase' as const, flex: 1, justifyContent: 'flex-start', paddingLeft: '180px' }} className="lg:!flex">
          {rightNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ whiteSpace: 'nowrap', color: pathname === item.href ? 'var(--gold)' : 'var(--cream-muted)', transition: 'color 0.2s ease', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--gold)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = pathname === item.href ? 'var(--gold)' : 'var(--cream-muted)')}
            >
              {item.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={toggleLang}
            aria-label={lang === 'cs' ? 'Switch to English' : 'Přepnout do češtiny'}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              marginLeft: 'auto',
              whiteSpace: 'nowrap',
              background: 'transparent',
              border: '1px solid var(--gold-dim)',
              color: 'var(--gold)',
              cursor: 'pointer',
              transition: 'border-color 0.2s, color 0.2s',
              fontFamily: 'var(--font-body)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold-light)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--gold-dim)'; e.currentTarget.style.color = 'var(--gold)'; }}
          >
            <LanguageToggleVisual lang={lang} />
          </button>
        </div>

        {/* Mobile: spacer + logo (centered) + hamburger */}
        <div style={{ width: '40px', flexShrink: 0 }} className="lg:!hidden" />
        <Link href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textDecoration: 'none', flexShrink: 0, position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} className="lg:!hidden" onClick={closeMenu}>
          <img
            src="/mikalogo2.png"
            alt="MIKA AUTO Logo"
            style={{ height: '40px', width: 'auto', objectFit: 'contain' }}
          />
          <span style={{
            fontSize: '9px',
            fontWeight: 500,
            letterSpacing: '0.2em',
            textTransform: 'uppercase' as const,
            color: 'var(--gold)',
            fontFamily: 'var(--font-body)',
            marginTop: '1px',
          }}>
            since 2007
          </span>
        </Link>

        {/* Hamburger */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', border: '1px solid var(--black-border)', background: 'var(--black-card)', color: 'var(--cream)', transition: 'border-color 0.2s' }}
          className="lg:!hidden"
          aria-label={isOpen ? t("nav.closeMenu", lang) : t("nav.openMenu", lang)}
          aria-expanded={isOpen}
        >
          <MenuIcon open={isOpen} />
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen ? (
        <div style={{ borderTop: '1px solid var(--black-border)', background: 'var(--black)' }} className="lg:!hidden">
          <div className="container-page" style={{ padding: '16px 40px' }}>
            <nav style={{ display: 'grid', gap: '4px', fontSize: '15px' }}>
              {[...leftNav, ...rightNav].map((item) => {
                if ('hasSubmenu' in item && item.hasSubmenu) {
                  return (
                    <div key={item.href}>
                      <div style={{ display: 'flex', alignItems: 'stretch' }}>
                        <Link
                          href={item.href}
                          onClick={closeMenu}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            flex: 1,
                            padding: '8px 12px',
                            color: isServicesPath ? 'var(--gold)' : 'var(--cream-muted)',
                            fontWeight: isServicesPath ? 600 : 400,
                            textDecoration: 'none',
                            transition: 'color 0.2s'
                          }}
                        >
                          {item.label}
                        </Link>
                        <button
                          type="button"
                          onClick={() => setMobileSluzbyOpen((value) => !value)}
                          aria-label={lang === 'cs' ? 'Rozbalit služby' : 'Open services menu'}
                          aria-expanded={mobileSluzbyOpen}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '44px',
                            color: isServicesPath || mobileSluzbyOpen ? 'var(--gold)' : 'var(--cream-muted)',
                            transition: 'color 0.2s',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <ChevronDown style={{ width: '16px', height: '16px', transition: 'transform 0.2s', transform: mobileSluzbyOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                        </button>
                      </div>
                      {mobileSluzbyOpen && (
                        <div style={{ paddingLeft: '12px', borderLeft: '2px solid var(--gold-dim)' }}>
                          {sluzbySubmenu.map((sub) => (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              onClick={closeMenu}
                              style={{
                                display: 'block',
                                padding: '6px 12px',
                                fontSize: '14px',
                                color: 'var(--cream-muted)',
                                textDecoration: 'none',
                                transition: 'color 0.15s'
                              }}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      color: pathname === item.href ? 'var(--gold)' : 'var(--cream-muted)',
                      fontWeight: pathname === item.href ? 600 : 400,
                      textDecoration: 'none',
                      transition: 'color 0.2s'
                    }}
                  >
                    {'isHome' in item && item.isHome ? <Home style={{ width: '16px', height: '16px' }} /> : item.label}
                  </Link>
                );
              })}
            </nav>

            <div style={{ marginTop: '16px', display: 'grid', gap: '8px' }}>
              <button
                type="button"
                onClick={() => { toggleLang(); closeMenu(); }}
                className="btn-primary"
                aria-label={lang === 'cs' ? 'Switch to English' : 'Přepnout do češtiny'}
                style={{ textAlign: 'center', cursor: 'pointer', gap: '10px' }}
              >
                <LanguageToggleVisual lang={lang} size={20} />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </header>

    {/* Alert bar – below header */}
    {alertText && !alertDismissed && (
      <div style={{
        position: 'sticky',
        top: headerVisible ? (kontakt ? '168px' : '124px') : '-48px',
        zIndex: 29,
        background: 'linear-gradient(90deg, #d5b65c 0%, #f1e0ae 48%, #d8ba62 100%)',
        borderBottom: '1px solid rgba(0,0,0,0.12)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.12)',
        transition: 'top 0.35s ease',
      }}>
        <div className="container-page">
          <div className="alert-banner" aria-label={alertText}>
            <div className="alert-banner-copy">
              <div className="alert-marquee">
                <div className="alert-marquee-track">
                  <span className="alert-marquee-item">
                    <span className="alert-banner-mark" aria-hidden="true">!</span>
                    <span className="alert-banner-text">{alertText}</span>
                    <span className="alert-banner-mark" aria-hidden="true">!</span>
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAlertDismissed(true)}
              aria-label={lang === 'cs' ? 'Zavřít upozornění' : 'Close alert'}
              className="alert-banner-close"
            >
              <X style={{ width: '15px', height: '15px' }} />
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
