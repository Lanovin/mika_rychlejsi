"use client";

import Image from "next/image";
import { useMemo, useState, type CSSProperties } from "react";
import { isTipcarsImage, tipcarsLoader, tipcarsVariant } from "@/src/lib/vehicle-images";

type Variant = "auto" | "thumb" | "full";

interface Attempt {
  src: string;
  unoptimized: boolean;
  responsive: boolean;
}

interface VehicleImageProps {
  src: string;
  alt: string;
  /** Šířka obrázku v layoutu – řídí, kterou velikost si prohlížeč stáhne. */
  sizes: string;
  /** "thumb" = pevný náhled, "full" = zdrojová fotka, "auto" = podle displeje. */
  variant?: Variant;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  /** Text v místě fotky, pokud se nepodaří načíst žádnou variantu. */
  fallbackLabel?: string;
  fallbackClassName?: string;
  "aria-hidden"?: boolean;
}

/** Pořadí pokusů: preferovaná velikost, pak čím dál konzervativnější náhrada. */
function buildAttempts(src: string, variant: Variant): Attempt[] {
  if (!isTipcarsImage(src)) {
    return [
      { src, unoptimized: false, responsive: false },
      { src, unoptimized: true, responsive: false },
    ];
  }

  if (variant === "thumb") {
    return [
      { src: tipcarsVariant(src, "fotky_male"), unoptimized: true, responsive: false },
      { src: tipcarsVariant(src, "fotky_velke"), unoptimized: true, responsive: false },
    ];
  }

  if (variant === "full") {
    return [
      { src: tipcarsVariant(src, "fotky_zdrojove"), unoptimized: true, responsive: false },
      { src: tipcarsVariant(src, "fotky_velke"), unoptimized: true, responsive: false },
    ];
  }

  return [
    { src, unoptimized: false, responsive: true },
    { src: tipcarsVariant(src, "fotky_velke"), unoptimized: true, responsive: false },
    { src: tipcarsVariant(src, "fotky_zdrojove"), unoptimized: true, responsive: false },
  ];
}

/**
 * Fotka vozu, která se nerozbije. Když daná velikost selže, zkusí se
 * postupně další, a teprve když nevyjde ani jedna, zobrazí se placeholder –
 * nikdy ne ikona rozbitého obrázku.
 */
export function VehicleImage({
  src,
  alt,
  sizes,
  variant = "auto",
  className,
  style,
  priority,
  loading,
  fetchPriority,
  fallbackLabel,
  fallbackClassName,
  "aria-hidden": ariaHidden,
}: VehicleImageProps) {
  const attempts = useMemo(() => buildAttempts(src, variant), [src, variant]);
  const [attemptIdx, setAttemptIdx] = useState(0);
  const [knownAttempts, setKnownAttempts] = useState(attempts);

  // Jiná fotka = zkoušíme zase od nejlepší velikosti. Řešíme to ještě během
  // renderu, aby se mezitím neukázal placeholder z předchozí fotky.
  if (knownAttempts !== attempts) {
    setKnownAttempts(attempts);
    setAttemptIdx(0);
  }

  const attempt = attempts[knownAttempts === attempts ? attemptIdx : 0];

  if (!attempt) {
    return (
      <div
        className={fallbackClassName}
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--black-rich)",
          color: "var(--cream-muted)",
          fontSize: "13px",
          textAlign: "center",
          padding: "8px",
          ...style,
        }}
        aria-hidden={ariaHidden}
      >
        {fallbackLabel ?? alt}
      </div>
    );
  }

  return (
    <Image
      key={`${attempt.src}-${attemptIdx}`}
      src={attempt.src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      style={style}
      priority={priority}
      loading={loading}
      fetchPriority={fetchPriority}
      unoptimized={attempt.unoptimized}
      {...(attempt.responsive ? { loader: tipcarsLoader } : {})}
      aria-hidden={ariaHidden}
      onError={() => setAttemptIdx((idx) => idx + 1)}
    />
  );
}
