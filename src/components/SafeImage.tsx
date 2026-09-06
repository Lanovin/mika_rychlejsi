"use client";

import Image from "next/image";
import { useMemo, useState, type CSSProperties } from "react";

interface SafeImageProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
  loading?: "eager" | "lazy";
  /** Text v místě obrázku, když se nepodaří načíst ani jedna varianta. */
  fallbackLabel?: string;
}

/**
 * Obrázek z CMS, který se nerozbije.
 *
 * Nejdřív se zkusí přes optimalizátor Next.js (menší datový objem), a když
 * ten selže – velký zdrojový PNG, výpadek `/api/uploads/…`, timeout – přejde
 * se na přímou adresu. Teprve když neprojde ani ta, zobrazí se decentní
 * placeholder místo ikony rozbitého obrázku.
 */
export function SafeImage({
  src,
  alt,
  sizes,
  className,
  style,
  priority,
  loading,
  fallbackLabel,
}: SafeImageProps) {
  // Optimalizátor Next.js SVG odmítá (vrací 400), takže se u něj rovnou
  // servíruje původní soubor.
  const attempts = useMemo(
    () => (/\.svg(\?|$)/i.test(src) ? [true] : [false, true]),
    [src],
  );
  const [attemptIdx, setAttemptIdx] = useState(0);
  const [knownSrc, setKnownSrc] = useState(src);

  // Jiný obrázek = zkoušet zase od optimalizované varianty. Řeší se ještě
  // během renderu, aby se mezitím neukázal placeholder z předchozího zdroje.
  if (knownSrc !== src) {
    setKnownSrc(src);
    setAttemptIdx(0);
  }

  const unoptimized = attempts[knownSrc === src ? attemptIdx : 0];

  if (unoptimized === undefined) {
    return (
      <div
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
        }}
      >
        {fallbackLabel ?? alt}
      </div>
    );
  }

  return (
    <Image
      key={`${src}-${attemptIdx}`}
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      style={style}
      priority={priority}
      loading={loading}
      unoptimized={unoptimized}
      onError={() => setAttemptIdx((idx) => idx + 1)}
    />
  );
}
