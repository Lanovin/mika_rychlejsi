"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/src/lib/LanguageContext";
import { t } from "@/src/lib/translations";

interface VehicleRow {
  id: string;
  tipcarsId: string;
  title: string;
  make: string;
  model: string;
  location: string;
  price: number;
  year: number;
  mileage: number;
  published: boolean;
  featured: boolean;
  imageUrl: string;
}

interface AdminDashboardClientProps {
  vehicles: VehicleRow[];
  notice: string | null;
  logoutAction: () => void;
  toggleFeaturedAction: (tipcarsId: string, currentFeatured: boolean) => void;
  togglePublishedAction: (tipcarsId: string, currentPublished: boolean) => void;
}

export function AdminDashboardClient({
  vehicles,
  notice,
  logoutAction,
  toggleFeaturedAction,
  togglePublishedAction,
}: AdminDashboardClientProps) {
  const { lang } = useLanguage();

  const translatedNotice = notice
    ? notice === "__UPDATED__"
      ? t("admin.noticeUpdated", lang)
      : notice === "__LOAD_FAILED__"
        ? (lang === "cs"
          ? "Dashboard se načetl v omezeném režimu. Aktuální data z Tipcars teď nejsou dostupná."
          : "The dashboard loaded in limited mode. Live Tipcars data is currently unavailable.")
      : notice
    : null;

  return (
    <div className="container-page py-10 pb-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="section-kicker">{t("admin.kicker", lang)}</p>
          <h1
            className="mt-2 text-3xl font-semibold tracking-tight text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("admin.title", lang)}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-secondary">
            {lang === "cs"
              ? "Vozidla se načítají automaticky z Tipcars. Pomocí tlačítek níže zvolte, která se zobrazí na hlavní stránce (★ Doporučené) nebo se skryjí z nabídky."
              : "Vehicles are loaded automatically from Tipcars. Use the buttons below to choose which appear on the homepage (★ Featured) or are hidden from the listing."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/obsah" className="btn-secondary">
            {t("admin.cms", lang)}
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="btn-secondary">
              {t("admin.logout", lang)}
            </button>
          </form>
        </div>
      </div>

      {translatedNotice ? (
        <div
          className="mt-6 px-4 py-3 text-sm"
          style={{
            background: "var(--black-rich)",
            borderLeft: notice === "__LOAD_FAILED__"
              ? "4px solid rgba(201,168,76,0.75)"
              : "4px solid rgba(16,185,129,0.6)",
            color: notice === "__LOAD_FAILED__" ? "var(--gold-light)" : "#bbf7d0",
          }}
        >
          {translatedNotice}
        </div>
      ) : null}

      <div className="mt-4 text-sm text-secondary">
        {lang === "cs"
          ? `Celkem ${vehicles.length} vozidel z Tipcars feedu`
          : `Total ${vehicles.length} vehicles from Tipcars feed`}
      </div>

      <section className="card-panel mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="min-w-full divide-y text-sm"
            style={{ borderColor: "var(--black-border)" }}
          >
            <thead
              style={{ background: "var(--black-rich)" }}
              className="text-left text-xs uppercase tracking-wide text-muted"
            >
              <tr>
                <th className="px-4 py-3 font-medium">{t("admin.colVehicle", lang)}</th>
                <th className="px-4 py-3 font-medium">{t("admin.colPrice", lang)}</th>
                <th className="px-4 py-3 font-medium">{t("admin.colYearKm", lang)}</th>
                <th className="px-4 py-3 font-medium">{t("admin.colStatus", lang)}</th>
                <th className="px-4 py-3 font-medium">{t("admin.colActions", lang)}</th>
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ borderColor: "var(--black-border)" }}
            >
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="align-top">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {vehicle.imageUrl && (
                        <div className="relative h-12 w-16 flex-shrink-0 overflow-hidden" style={{ background: "var(--black-rich)" }}>
                          <Image
                            src={vehicle.imageUrl}
                            alt={vehicle.title}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-white">{vehicle.title}</div>
                        <div className="mt-1 text-xs text-muted">
                          {vehicle.make} · {vehicle.model} · {vehicle.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-medium text-white">
                    {vehicle.price.toLocaleString("cs-CZ")} Kč
                  </td>
                  <td className="px-4 py-4 text-secondary">
                    {vehicle.year} · {vehicle.mileage.toLocaleString("cs-CZ")} km
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span
                        className="px-3 py-1 font-medium"
                        style={{
                          background: vehicle.published
                            ? "rgba(16,185,129,0.12)"
                            : "var(--black-rich)",
                          color: vehicle.published
                            ? "#6ee7b7"
                            : "var(--cream-muted)",
                          border: vehicle.published
                            ? "1px solid rgba(16,185,129,0.3)"
                            : "1px solid var(--black-border)",
                        }}
                      >
                        {vehicle.published
                          ? t("admin.published", lang)
                          : t("admin.hidden", lang)}
                      </span>
                      {vehicle.featured ? (
                        <span
                          className="px-3 py-1 font-medium"
                          style={{
                            background: "rgba(201,168,76,0.10)",
                            color: "var(--gold)",
                            border: "1px solid var(--gold-dim)",
                          }}
                        >
                          {t("admin.featured", lang)}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/vozy/${vehicle.id}`}
                        className="btn-secondary px-3 py-1.5 text-xs"
                      >
                        {t("admin.preview", lang)}
                      </Link>
                      <form action={toggleFeaturedAction.bind(null, vehicle.tipcarsId, vehicle.featured)}>
                        <button
                          type="submit"
                          className="px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
                          style={{
                            background: vehicle.featured ? "rgba(201,168,76,0.10)" : "var(--black-rich)",
                            color: vehicle.featured ? "var(--gold)" : "var(--cream-muted)",
                            border: vehicle.featured ? "1px solid var(--gold-dim)" : "1px solid var(--black-border)",
                          }}
                        >
                          {vehicle.featured
                            ? (lang === "cs" ? "★ Doporučené" : "★ Featured")
                            : (lang === "cs" ? "☆ Doporučit" : "☆ Feature")}
                        </button>
                      </form>
                      <form action={togglePublishedAction.bind(null, vehicle.tipcarsId, vehicle.published)}>
                        <button
                          type="submit"
                          className="px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
                          style={{
                            background: vehicle.published ? "rgba(16,185,129,0.12)" : "var(--black-rich)",
                            color: vehicle.published ? "#6ee7b7" : "var(--cream-muted)",
                            border: vehicle.published ? "1px solid rgba(16,185,129,0.3)" : "1px solid var(--black-border)",
                          }}
                        >
                          {vehicle.published
                            ? (lang === "cs" ? "Skrýt" : "Hide")
                            : (lang === "cs" ? "Zobrazit" : "Show")}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
