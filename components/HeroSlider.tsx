"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar, Gauge } from "lucide-react";
import type { Vehicle } from "@/src/lib/vehicle-types";
import { useLanguage } from "@/src/lib/LanguageContext";
import { t, tReplace } from "@/src/lib/translations";

interface HeroSliderProps {
  vehicles: Vehicle[];
}

const SLIDE_DURATION = 5000;

export function HeroSlider({ vehicles }: HeroSliderProps) {
  const { lang } = useLanguage();
  const slides = vehicles.slice(0, 6);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const next = useCallback(() => {
    setProgress(0);
    progressRef.current = 0;
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setProgress(0);
    progressRef.current = 0;
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const goTo = useCallback((i: number) => {
    setProgress(0);
    progressRef.current = 0;
    setCurrent(i);
  }, []);

  useEffect(() => {
    if (paused || slides.length <= 1) return;

    lastTimeRef.current = performance.now();

    const tick = (now: number) => {
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      progressRef.current += dt;
      const pct = Math.min(progressRef.current / SLIDE_DURATION, 1);
      setProgress(pct);

      if (pct >= 1) {
        setCurrent((p) => (p + 1) % slides.length);
        progressRef.current = 0;
        setProgress(0);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [paused, slides.length, current]);

  if (slides.length === 0) return null;

  const car = slides[current];
  const formattedPrice = lang === "cs"
    ? `${car.price.toLocaleString("cs-CZ")} Kč`
    : `CZK ${car.price.toLocaleString("en-US")}`;
  const vatDeductionText = car.vatDeduction
    ? tReplace("vehicle.vatDeduction", lang, { price: formattedPrice })
    : null;

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
              <Image
                src={slidecar.imageUrl || "/placeholder-car.jpg"}
                alt={slidecar.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
                priority={i === 0}
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
        <div className="hero-slider__title">
          {car.make && car.model ? `${car.make} ${car.model}` : car.title.split(/\s+/).slice(0, 2).join(" ")}
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
          {vatDeductionText ? (
            <div className="hero-slider__price-note">{vatDeductionText}</div>
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
              className="hero-slider__progress-bar"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
