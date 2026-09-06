"use client";

import { useState, useEffect, useCallback } from "react";
import { SafeImage } from "@/src/components/SafeImage";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Banner {
  imageUrl: string;
  linkUrl?: string;
  alt?: string;
}

interface BannerSliderProps {
  banners: Banner[];
}

const SLIDE_DURATION = 6000;

export function BannerSlider({ banners }: BannerSliderProps) {
  const slides = banners.filter((b) => b.imageUrl);
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

  const banner = slides[current];

  const slideContent = (
    <div
      className="banner-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 5",
        overflow: "hidden",
        background: "var(--black)",
      }}
    >
      {slides.map((b, i) => {
        const Wrapper = b.linkUrl
          ? ({ children, ...props }: React.HTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode }) => (
              <a href={b.linkUrl} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
            )
          : ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) => (
              <div {...props}>{children}</div>
            );

        return (
          <Wrapper
            key={i}
            style={{
              position: "absolute",
              inset: 0,
              opacity: i === current ? 1 : 0,
              transition: "opacity 0.6s ease-in-out",
              pointerEvents: i === current ? "auto" : "none",
            }}
          >
            <SafeImage
              src={b.imageUrl}
              alt={b.alt || `Banner ${i + 1}`}
              sizes="100vw"
              style={{ objectFit: "cover" }}
              priority={i === 0}
              loading={i === 0 ? undefined : "lazy"}
            />
          </Wrapper>
        );
      })}

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Předchozí banner"
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            <ChevronLeft style={{ width: "20px", height: "20px" }} />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Další banner"
            style={{
              position: "absolute",
              right: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 10,
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#fff",
              width: "40px",
              height: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            <ChevronRight style={{ width: "20px", height: "20px" }} />
          </button>
        </>
      )}

      {/* Dots + progress */}
      {slides.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Banner ${i + 1}`}
                style={{
                  width: i === current ? "24px" : "8px",
                  height: "8px",
                  background: i === current ? "var(--gold)" : "rgba(255,255,255,0.4)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>
          <div
            style={{
              width: "120px",
              height: "2px",
              background: "rgba(255,255,255,0.15)",
              overflow: "hidden",
            }}
          >
            <div
              key={current}
              style={{
                height: "100%",
                background: "var(--gold)",
                animation: "bannerSliderProgress 6s linear forwards",
                animationPlayState: paused ? "paused" : "running",
                width: 0,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  return slideContent;
}
