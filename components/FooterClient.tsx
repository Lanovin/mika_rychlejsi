"use client";

import { useLanguage } from "@/src/lib/LanguageContext";
import { t } from "@/src/lib/translations";

interface FooterContent {
  description: string;
  copyright: string;
  tagline: string;
  partners: string[];
}

interface KontaktContent {
  phone: string;
  email: string;
  address: { street: string; city: string; note1: string };
  hours: { weekdays: string; saturday: string; sunday: string };
}

interface FooterClientProps {
  f: FooterContent;
  fEn: FooterContent;
  k: KontaktContent;
  kEn: KontaktContent;
}

export function FooterClient({ f, fEn, k, kEn }: FooterClientProps) {
  const { lang } = useLanguage();
  const fc = lang === "en" ? fEn : f;
  const kc = lang === "en" ? kEn : k;
  const partnerHeading = lang === "en" ? "Our partners" : "Naši partneři";
  const partners = [
    { src: '/partners/moneta.png', href: 'https://gemoney.cz/', alt: 'Moneta' },
    { src: '/partners/leasingcs-logo.png', href: 'https://leasingcs.cz/', alt: 'Leasing ČS' },
    { src: '/partners/kb_essox.png', href: 'https://www.essox.cz/', alt: 'Essox' },
    { src: '/partners/homecredit.png', href: 'https://www.homecredit.cz/', alt: 'Home Credit' },
    { src: '/partners/generali_poj.png', href: 'https://www.generaliceska.cz/', alt: 'Generali' },
    { src: '/partners/defend_logo.svg', href: 'https://www.defendinsurance.eu/', alt: 'Defend Insurance' },
    { src: '/partners/cebia_logo.png', href: 'https://www.cebia.cz/', alt: 'Cebia' },
  ];

  return (
    <footer style={{ marginTop: '80px', borderTop: '1px solid var(--black-border)', background: 'var(--black)' }}>
      <div className="container-page" style={{ paddingTop: '64px', paddingBottom: '60px' }}>
        <div className="footer-grid">
          <div className="footer-primary-column">
            <div className="footer-detail-stack">
              <div>
                <div className="footer-section-label">{t("footer.address", lang)}</div>
                <div className="footer-detail-copy">
                  <div>{kc.address.street}</div>
                  <div>{kc.address.city}</div>
                  <div>{kc.address.note1}</div>
                </div>
              </div>

              <div>
                <div className="footer-section-label">{t("footer.hours", lang)}</div>
                <div className="footer-detail-copy">
                  <div>{kc.hours.weekdays}</div>
                  <div>{kc.hours.saturday}</div>
                  <div>{kc.hours.sunday}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-secondary-column">
            <div className="footer-contact-card">
              <div className="footer-section-label">{t("footer.contact", lang)}</div>
              <a href={`tel:${kc.phone.replace(/\s/g, '')}`} className="footer-contact-link">
                {kc.phone}
              </a>
              <a href={`mailto:${kc.email}`} className="footer-contact-link footer-contact-link--secondary">
                {kc.email}
              </a>
            </div>

            <div>
              <div className="footer-section-label">{partnerHeading}</div>
              <div className="footer-partners-grid">
                {partners.map((partner) => (
                  <a key={partner.alt} href={partner.href} target="_blank" rel="noopener noreferrer" className="partner-logo-link">
                    <span className="partner-logo-pill">
                      <img src={partner.src} alt={partner.alt} style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="footer-social-center">
          <a
            href="https://www.instagram.com/mikaauto.cz?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="footer-ig-link"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.088 4.088 0 011.47.957c.453.453.757.91.957 1.47.163.46.349 1.26.404 2.43.058 1.266.069 1.646.069 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.43a4.088 4.088 0 01-.957 1.47 4.088 4.088 0 01-1.47.957c-.46.163-1.26.349-2.43.404-1.266.058-1.646.069-4.85.069s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.403a4.088 4.088 0 01-1.47-.957 4.088 4.088 0 01-.957-1.47c-.163-.46-.349-1.26-.404-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.43a4.088 4.088 0 01.957-1.47A4.088 4.088 0 015.063 2.293c.46-.163 1.26-.349 2.43-.404C8.759 1.831 9.139 1.82 12 1.82h.343M12 0C8.741 0 8.333.014 7.053.072 5.775.131 4.903.333 4.14.63a5.876 5.876 0 00-2.126 1.384A5.876 5.876 0 00.63 4.14C.333 4.903.131 5.775.072 7.053.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.059 1.278.261 2.15.558 2.913a5.876 5.876 0 001.384 2.126 5.876 5.876 0 002.126 1.384c.763.297 1.635.499 2.913.558C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c1.278-.059 2.15-.261 2.913-.558a5.876 5.876 0 002.126-1.384 5.876 5.876 0 001.384-2.126c.297-.763.499-1.635.558-2.913.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.059-1.278-.261-2.15-.558-2.913a5.876 5.876 0 00-1.384-2.126A5.876 5.876 0 0019.86.63C19.097.333 18.225.131 16.947.072 15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--black-border)', padding: '16px 0' }}>
        <div className="container-page footer-meta-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--cream-muted)', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ textAlign: 'center', flex: '1 1 auto' }}>{fc.copyright}</span>
          <span style={{ textAlign: 'center', flex: '1 1 auto' }}>{fc.tagline}</span>
        </div>
      </div>

      <style>{`
        .footer-grid {
          display: grid;
          gap: 48px;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
          align-items: start;
        }
        .footer-primary-column {
          display: grid;
          gap: 32px;
        }
        .footer-lead {
          display: none !important;
        }
        .footer-secondary-column {
          display: grid;
          gap: 28px;
        }
        .footer-section-label {
          font-size: 11px;
          letter-spacing: 0.24em;
          text-transform: uppercase;
          color: var(--gold-light);
          font-weight: 700;
          margin-bottom: 14px;
        }
        .footer-detail-stack {
          display: grid;
          gap: 28px;
        }
        .footer-detail-copy {
          font-size: clamp(18px, 2vw, 22px);
          color: var(--white);
          line-height: 1.75;
          font-weight: 500;
        }
        .footer-contact-card {
          padding: 28px;
          border: 1px solid rgba(201, 168, 76, 0.3);
          background: linear-gradient(180deg, rgba(201, 168, 76, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%);
        }
        .footer-contact-link {
          display: block;
          font-size: clamp(24px, 2.2vw, 32px);
          line-height: 1.35;
          font-weight: 700;
          color: var(--white);
          text-decoration: none;
          transition: color 0.2s ease;
        }
        .footer-contact-link--secondary {
          font-size: clamp(18px, 1.8vw, 24px);
          margin-top: 8px;
        }
        .footer-contact-link:hover {
          color: var(--gold-light);
        }
        .footer-partners-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
        }
        .partner-logo-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          background: #fff;
          border-radius: 6px;
          padding: 6px 10px;
        }
        .footer-ig-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          color: var(--gold-light);
          border: 1px solid rgba(201, 168, 76, 0.3);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.02);
          transition: transform 0.2s ease, color 0.2s ease, border-color 0.2s ease;
        }
        .footer-ig-link:hover {
          transform: translateY(-2px);
          color: var(--white);
          border-color: var(--gold-light);
        }
        .footer-social-center {
          display: flex;
          justify-content: center;
          margin-top: 36px;
          padding-top: 28px;
          border-top: 1px solid rgba(201, 168, 76, 0.12);
        }
        .partner-logo-link img {
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .partner-logo-link:hover img {
          opacity: 1 !important;
          transform: scale(1.02);
        }
        @media (max-width: 1023px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
          .footer-contact-card {
            padding: 24px;
          }
        }
        @media (max-width: 768px) {
          .footer-detail-copy {
            font-size: 17px;
          }
          .footer-contact-link {
            font-size: 24px;
          }
          .footer-contact-link--secondary {
            font-size: 17px;
          }
        }
      `}</style>
    </footer>
  );
}
