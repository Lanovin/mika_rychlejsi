import type { CSSProperties } from "react";

/**
 * Ikony karty vozu jako sdílený sprite.
 *
 * Každá karta má čtyři ikony a `lucide-react` je vykresluje jako plné inline
 * SVG. Na stránce se 71 vozy to dělalo 114 kB z 356 kB celého HTML – tedy
 * třetinu objemu, který musí mobil stáhnout, než se vůbec něco ukáže.
 * Geometrie je proto v dokumentu jednou a karty na ni jen odkazují.
 *
 * Kresba je 1:1 převzatá z ikon lucide (gauge, calendar-range, fuel,
 * arrow-right), aby se vzhled nezměnil.
 */

export const VEHICLE_ICON_IDS = {
  gauge: "mika-icon-gauge",
  calendarRange: "mika-icon-calendar-range",
  fuel: "mika-icon-fuel",
  arrowRight: "mika-icon-arrow-right",
} as const;

export type VehicleIconName = keyof typeof VEHICLE_ICON_IDS;

/** Vykresluje se jednou v layoutu; sám o sobě nic nezobrazuje. */
export function VehicleCardIconSprite() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        <g
          id={VEHICLE_ICON_IDS.gauge}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m12 14 4-4" />
          <path d="M3.34 19a10 10 0 1 1 17.32 0" />
        </g>
        <g
          id={VEHICLE_ICON_IDS.calendarRange}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M16 2v4" />
          <path d="M3 10h18" />
          <path d="M8 2v4" />
          <path d="M17 14h-6" />
          <path d="M13 18H7" />
          <path d="M7 14h.01" />
          <path d="M17 18h.01" />
        </g>
        <g
          id={VEHICLE_ICON_IDS.fuel}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" x2="15" y1="22" y2="22" />
          <line x1="4" x2="14" y1="9" y2="9" />
          <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
          <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />
        </g>
        <g
          id={VEHICLE_ICON_IDS.arrowRight}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </g>
      </defs>
    </svg>
  );
}

export function VehicleIcon({
  name,
  className,
  style,
}: {
  name: VehicleIconName;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    // width/height drží rozumnou vnitřní velikost i bez CSS; konkrétní rozměr
    // stejně přebíjí třída (`flex-shrink` je kvůli velikosti HTML v CSS).
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <use href={`#${VEHICLE_ICON_IDS[name]}`} />
    </svg>
  );
}
