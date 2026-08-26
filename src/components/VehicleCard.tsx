import Link from "next/link";
import { ArrowRight, Fuel, Gauge, CalendarRange } from "lucide-react";
import type { Vehicle } from "@/src/lib/vehicle-types";
import { useLanguage } from "@/src/lib/LanguageContext";
import { t, tReplace } from "@/src/lib/translations";
import { VehicleImage } from "@/src/components/VehicleImage";

interface VehicleCardProps {
  car: Vehicle;
}

export function VehicleCard({ car }: VehicleCardProps) {
  const { lang } = useLanguage();
  const locale = lang === 'cs' ? 'cs-CZ' : 'en-US';
  const formattedPrice = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0
  }).format(car.price);
  const formattedPriceWithoutVat = typeof car.priceWithoutVat === "number"
    ? new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "CZK",
      maximumFractionDigits: 0
    }).format(car.priceWithoutVat)
    : null;
  const vatDeductionText = (car.vatDeduction || formattedPriceWithoutVat) ? t("vehicle.vatDeduction", lang) : null;
  const priceWithoutVatText = formattedPriceWithoutVat
    ? tReplace("vehicle.priceWithoutVat", lang, { price: formattedPriceWithoutVat })
    : null;

  const formattedMileage = new Intl.NumberFormat(locale).format(car.mileage);

  return (
    <Link
      href={`/vozy/${car.id}`}
      className="group vehicle-card"
    >
      <article className="vehicle-card__inner">
        {/* Image */}
        <div className="vehicle-card__img-wrap">
          {car.imageUrl ? (
            <VehicleImage
              src={car.imageUrl}
              alt={`${car.make} ${car.model}`}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
              fallbackLabel={t("card.noPhoto", lang)}
              fallbackClassName="vehicle-card__no-img"
            />
          ) : (
            <div className="vehicle-card__no-img">{t("card.noPhoto", lang)}</div>
          )}
          {car.featured ? (
            <div className="vehicle-card__badge">
              {t("card.topOffer", lang)}
            </div>
          ) : null}
        </div>

        {/* Body */}
        <div className="vehicle-card__body">
          {/* Brand eyebrow */}
          <div className="vehicle-card__eyebrow">{car.make}</div>

          {/* Name */}
          <h3 className="vehicle-card__title">
            {car.make} {car.model}
          </h3>

          {/* Year / transmission */}
          <div className="vehicle-card__subtitle">
            {car.year} &bull; {car.transmission}
          </div>

          {/* Tech specs row */}
          <div className="vehicle-card__specs">
            <span className="vehicle-card__spec">
              <Gauge className="vehicle-card__spec-icon" />
              {car.powerKw}&nbsp;kW
            </span>
            <span className="vehicle-card__spec">
              <CalendarRange className="vehicle-card__spec-icon" />
              {formattedMileage}&nbsp;km
            </span>
            <span className="vehicle-card__spec">
              <Fuel className="vehicle-card__spec-icon" />
              {car.fuel}
            </span>
          </div>

          {/* Divider + price */}
          <div className="vehicle-card__footer">
            <div className="vehicle-card__price-block">
              <div className="flex flex-wrap items-center gap-2">
                <div className="vehicle-card__price">{formattedPrice}</div>
                {vatDeductionText ? <div className="vat-badge">{vatDeductionText}</div> : null}
              </div>
              {priceWithoutVatText ? (
                <div className="vehicle-card__price-note">{priceWithoutVatText}</div>
              ) : null}
            </div>
            <span className="vehicle-card__cta">
              {t("card.detail", lang)}
              <ArrowRight className="vehicle-card__cta-arrow group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

