"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar, Gauge } from "lucide-react";
import type { Vehicle } from "@/src/lib/vehicle-types";
import { useLanguage } from "@/src/lib/LanguageContext";
import { t, tReplace } from "@/src/lib/translations";
import { VehicleImage } from "@/src/components/VehicleImage";

interface HeroSliderProps {
  vehicles: Vehicle[];
}

const SLIDE_DURATION = 5000;

function getCompactHeroTitle(car: Vehicle) {
  const fullTitle = car.make && car.model ? `${car.make} ${car.model}`.trim() : car.title.trim();
  const words = fullTitle.split(/\s+/).filter(Boolean);

  if (words.length <= 3 && fullTitle.length <= 26) {
    return fullTitle;
  }

  return words.slice(0, 3).join(" ");
}

export function HeroSlider({ vehicles }: HeroSliderProps) {
  const { lang } = useLanguage();
  const slides = vehicles.slice(0, 6);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goTo = useCallback((i: number) => {
    setCurrent(i);
  }, []);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const timer = setTimeout(() => {
      setCurrent((p) => (p + 1) % slides.length);
    }, SLIDE_DURATION);
    return () => clearTimeout(timer);
  }, [paused, slides.length, current]);

  if (slides.length === 0) return null;

  const car = slides[current];
  const formattedPrice = lang === "cs"
    ? `${car.price.toLocaleString("cs-CZ")} Kč`
    : `CZK ${car.price.toLocaleString("en-US")}`;
  const formattedPriceWithoutVat = typeof car.priceWithoutVat === "number"
    ? (lang === "cs"
      ? `${car.priceWithoutVat.toLocaleString("cs-CZ")} Kč`
      : `CZK ${car.priceWithoutVat.toLocaleString("en-US")}`)
    : null;
  const vatDeductionText = (car.vatDeduction || formattedPriceWithoutVat) ? t("vehicle.vatDeduction", lang) : null;
  const priceWithoutVatText = formattedPriceWithoutVat
    ? tReplace("vehicle.priceWithoutVat", lang, { price: formattedPriceWithoutVat })
    : null;
  const sliderTitle = getCompactHeroTitle(car);
  // Držíme oba údaje odděleně, aby se na úzkém displeji zalomily po celých
  // údajích a ne uprostřed částky.
  const sliderPriceNotes = [vatDeductionText, priceWithoutVatText].filter(Boolean) as string[];

  return (
    <div
      className="hero-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hero-slider__track">
        {slides.map((slidecar, i) => (
          <Link
            key={slidecar.id}
            href={`/vozy/${slidecar.id}`}
            className={`hero-slider__slide ${i === current ? "hero-slider__slide--active" : ""}`}
            style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? "auto" : "none" }}
            aria-hidden={i !== current}
          >
            <div className={`hero-slider__img-wrap ${i === current ? "hero-slider__img-wrap--zoom" : ""}`}>
              <VehicleImage
                src={slidecar.imageUrl || "/placeholder-car.jpg"}
                alt={slidecar.title}
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
                priority={i === 0}
                loading={i === 0 ? undefined : "lazy"}
                fetchPriority={i === 0 ? "high" : "low"}
                fallbackLabel={slidecar.title}
              />
            </div>
            <span className="hero-slider__counter">
              {String(i + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            </span>
            <span className="hero-slider__badge">{t("slider.badge", lang)}</span>
          </Link>
        ))}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              className="hero-slider__arrow hero-slider__arrow--prev"
              aria-label={t("slider.prevSlide", lang)}
              onClick={(e) => { e.preventDefault(); prev(); }}
            >
              <ChevronLeft style={{ width: "20px", height: "20px" }} />
            </button>
            <button
              type="button"
              className="hero-slider__arrow hero-slider__arrow--next"
              aria-label={t("slider.nextSlide", lang)}
              onClick={(e) => { e.preventDefault(); next(); }}
            >
              <ChevronRight style={{ width: "20px", height: "20px" }} />
            </button>
          </>
        )}
      </div>

      {/* Info bar — below the photo */}
      <Link key={current} href={`/vozy/${car.id}`} className="hero-slider__info">
        <div className="hero-slider__title" title={car.make && car.model ? `${car.make} ${car.model}` : car.title}>
          {sliderTitle}
        </div>
        <div className="hero-slider__meta">
          {car.year > 0 && (
            <span className="hero-slider__meta-item">
              <Calendar style={{ width: "13px", height: "13px" }} />
              {car.year}
            </span>
          )}
          {car.year > 0 && car.mileage > 0 && (
            <span className="hero-slider__meta-sep">|</span>
          )}
          {car.mileage > 0 && (
            <span className="hero-slider__meta-item">
              <Gauge style={{ width: "13px", height: "13px" }} />
              {car.mileage.toLocaleString(lang === "cs" ? "cs-CZ" : "en-US")} km
            </span>
          )}
        </div>
        <div className="hero-slider__price-col">
          <div className="hero-slider__price">{formattedPrice}</div>
          {sliderPriceNotes.length > 0 ? (
            <div className="hero-slider__price-note">
              {sliderPriceNotes.map((note) => (
                <span key={note}>{note}</span>
              ))}
            </div>
          ) : null}
        </div>
      </Link>

      {/* Dots + progress */}
      {slides.length > 1 && (
        <div className="hero-slider__footer">
          <div className="hero-slider__dots">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Slide ${i + 1}`}
                className={`hero-slider__dot ${i === current ? "hero-slider__dot--active" : ""}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <div className="hero-slider__progress">
            <div
              key={current}
              className="hero-slider__progress-bar"
              style={{ animationPlayState: paused ? "paused" : "running" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
