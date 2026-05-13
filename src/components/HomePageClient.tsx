"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, ShieldCheck, CircleDollarSign, BadgeCheck } from "lucide-react";
import { VehicleCard } from "@/src/components/VehicleCard";
import { HeroSlider } from "@/components/HeroSlider";
import { BannerSlider } from "@/components/BannerSlider";
import type { Vehicle } from "@/src/lib/vehicle-types";
import { useLanguage } from "@/src/lib/LanguageContext";
import { t } from "@/src/lib/translations";

interface Banner {
  imageUrl: string;
  linkUrl?: string;
  alt?: string;
}

interface HomePageClientProps {
  vehicles: Vehicle[];
  homepageMode?: string;
  banners?: Banner[];
  cs?: HomepageContent;
  en?: HomepageContent;
}

interface HomepageContent {
  _layout?: string[];
  hero: { kicker: string; title: string; titleHighlight: string; ctaPrimary: string; ctaSecondary: string };
  featured: { kicker: string; title: string; titleHighlight: string; linkText: string; desktopCount?: number; mobileCount?: number };

  stats: { value: string; label: string }[];
  features: {
    kicker: string; title: string; titleHighlight: string;
    items: { title: string; description: string }[];
  };
  reviews: {
    kicker: string; title: string;
    items: { author: string; text: string }[];
  };
}

const featureIcons = [ShieldCheck, CircleDollarSign, BadgeCheck];

export function HomePageClient({ vehicles, homepageMode = "default", banners = [], cs, en }: HomePageClientProps) {
  const { lang } = useLanguage();
  const c = lang === "en" ? (en ?? cs) : (cs ?? en);
  const reviewByLabel = lang === "en" ? "Review by" : "Tuto recenzi napsal";

  const desktopCount = c?.featured.desktopCount ?? 4;
  const mobileCount = c?.featured.mobileCount ?? 3;
  const featuredCars = vehicles.filter((vehicle) => vehicle.featured).slice(0, desktopCount);
  const carsToRender = featuredCars.length > 0 ? featuredCars : vehicles.slice(0, desktopCount);
  const featuredSlider = vehicles.filter((v) => v.featured && v.imageUrl);
  const sliderCars = (featuredSlider.length > 0 ? featuredSlider : vehicles.filter((v) => v.imageUrl)).slice(0, 6);

  const layout = c?._layout as string[] | undefined;
  const show = (key: string) => !layout || layout.includes(key);

  return (
    <div>
      {/* Banner Slider mode */}
      {homepageMode === "slider" && banners.length > 0 && (
        <section>
          <BannerSlider banners={banners} />
        </section>
      )}

      {/* Hero section — default mode */}
      {homepageMode !== "slider" && show("hero") && (
      <section className="hero-section">
        <div className="hero-grid-overlay" />
        <div className="hero-corner-ornament hero-corner-ornament--tl" />
        <div className="hero-corner-ornament hero-corner-ornament--br" />

        <div className="container-page hero-flex" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-flex__text reveal-on-scroll reveal-on-scroll--hero">
            <p className="section-kicker">{c ? c.hero.kicker : t('hero.kicker', lang)}</p>
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 700,
              color: 'var(--white)',
              lineHeight: 1.1,
              marginTop: '16px'
            }}>
              {c ? c.hero.title : t('hero.title', lang)}{' '}
              <span style={{ color: 'var(--gold-light)', fontStyle: 'italic' }}>{c ? c.hero.titleHighlight : t('hero.titleHighlight', lang)}</span>
            </h1>
            <div style={{ marginTop: '32px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <Link href="/vozy" className="btn-primary" style={{ gap: '8px' }}>
                {c ? c.hero.ctaPrimary : t('hero.ctaPrimary', lang)}
                <ArrowRight style={{ width: '16px', height: '16px' }} />
              </Link>
            </div>
          </div>

          {sliderCars.length > 0 && (
            <div className="hero-flex__slider reveal-on-scroll reveal-on-scroll--hero reveal-on-scroll--delay">
              <HeroSlider vehicles={sliderCars} />
            </div>
          )}
        </div>
      </section>
      )}

      {/* Featured cars */}
      {show("featured") && (
      <section className="container-page reveal-on-scroll" style={{ padding: '80px 40px 0' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <p className="section-kicker">{c ? c.featured.kicker : t('featured.kicker', lang)}</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, color: 'var(--white)', marginTop: '8px', lineHeight: 1.15 }}>
              {c ? c.featured.title : t('featured.title', lang)} <span style={{ color: 'var(--gold-light)', fontStyle: 'italic' }}>{c ? c.featured.titleHighlight : t('featured.titleHighlight', lang)}</span>
            </h2>
          </div>
          <Link href="/vozy" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', transition: 'color 0.2s' }}>
            {c ? c.featured.linkText : t('featured.linkText', lang)}
            <ArrowRight style={{ width: '14px', height: '14px' }} />
          </Link>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ marginTop: '24px' }}>
          {carsToRender.map((car, i) => (
            <div key={car.id} className={i >= mobileCount ? 'mobile-hidden-card' : ''}>
              <VehicleCard car={car} />
            </div>
          ))}
        </div>
      </section>
      )}

      {/* Stats bar */}
      {show("stats") && (
      <section className="container-page reveal-on-scroll" style={{ padding: '60px 40px 0' }}>
        <div className="stats-bar">
          <div>
            <div className="stat-value">{vehicles.length}+</div>
            <div className="stat-label">{t('stats.vehicles', lang)}</div>
          </div>
          {(c?.stats ?? []).map((stat, i) => (
            <div key={i}>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* Gold divider */}
      <div className="container-page">
        <div className="gold-divider"><span className="gold-divider--symbol" /></div>
      </div>

      {/* Features grid */}
      {show("features") && (
      <section className="container-page" style={{ padding: '0 40px' }}>
        <div className="reveal-on-scroll" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p className="section-kicker">{c ? c.features.kicker : t('features.kicker', lang)}</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, color: 'var(--white)', marginTop: '8px' }}>
            {c ? c.features.title : t('features.title', lang)} <span style={{ color: 'var(--gold-light)', fontStyle: 'italic' }}>{c ? c.features.titleHighlight : t('features.titleHighlight', lang)}</span>
          </h2>
        </div>

        <div className="features-grid">
          {(c?.features.items ?? []).map((item, i) => {
            const Icon = featureIcons[i] ?? ShieldCheck;
            return (
              <div
                key={i}
                className="features-grid-cell reveal-on-scroll reveal-on-scroll--spring"
                style={{ transitionDelay: `${i * 0.13}s` }}
              >
                <div className="features-grid-icon">
                  <Icon style={{ width: '20px', height: '20px' }} />
                </div>
                <div className="features-grid-title">{item.title}</div>
                <div className="features-grid-desc">{item.description}</div>
              </div>
            );
          })}
        </div>
      </section>
      )}

      {/* Gold divider */}
      <div className="container-page">
        <div className="gold-divider"><span className="gold-divider--symbol" /></div>
      </div>

      {/* Reviews */}
      {show("reviews") && (
      <section className="container-page" style={{ padding: '0 40px 80px' }}>
        <div className="reveal-on-scroll" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <p className="section-kicker">{c ? c.reviews.kicker : t('reviews.kicker', lang)}</p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 700, color: 'var(--white)', marginTop: '8px' }}>
            {c ? c.reviews.title : t('reviews.title', lang)}
          </h2>
        </div>

        <div style={{ display: 'grid', gap: '24px', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {(c?.reviews.items ?? []).map((review, i) => (
            <article
              key={review.author}
              className={`pull-quote reveal-on-scroll${i % 2 === 0 ? ' reveal-on-scroll--left' : ''}`}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <p style={{ fontSize: '14px', lineHeight: 1.8, color: 'var(--cream)', marginTop: '8px' }}>
                {review.text}
              </p>
              <div style={{ marginTop: '16px', fontSize: '14px', fontWeight: 600, color: 'var(--white)', fontStyle: 'normal' }}>
                {reviewByLabel} {review.author}
              </div>
            </article>
          ))}
        </div>
      </section>
      )}
    </div>
  );
}