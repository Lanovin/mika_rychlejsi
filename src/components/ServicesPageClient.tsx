"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/src/lib/LanguageContext";
import { t } from "@/src/lib/translations";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface SummaryCard {
  kicker: string;
  title: string;
}

interface ServiceItem {
  title: string;
  shortDesc: string;
  longDesc: string;
}

interface ServicesContent {
  header: {
    kicker: string;
    title: string;
    description: string;
  };
  summaryCards: SummaryCard[];
  services: ServiceItem[];
}

interface ServicesPageClientProps {
  cs: ServicesContent;
  en: ServicesContent;
}

export function ServicesPageClient({ cs, en }: ServicesPageClientProps) {
  const { lang } = useLanguage();
  const content = lang === "en" ? en : cs;

  return (
    <div className="pb-20">
      <section className="container-page pt-12 pb-8 reveal-on-scroll">
        <p className="section-kicker">{content.header.kicker}</p>
        <h1
          className="mt-2 text-3xl font-semibold uppercase tracking-[0.03em] sm:text-5xl"
          style={{ fontFamily: "var(--font-display)", color: "var(--cream)", lineHeight: 1.08 }}
        >
          {content.header.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base sm:text-lg" style={{ color: "var(--cream-muted)" }}>
          {content.header.description}
        </p>
      </section>

      <div className="gold-divider" />

      {content.summaryCards.length > 0 ? (
        <section className="container-page mt-10 grid gap-4 md:grid-cols-3 reveal-on-scroll">
          {content.summaryCards.map((card) => (
            <article key={`${card.kicker}-${card.title}`} className="card-panel p-6">
              <p className="section-kicker">{card.kicker}</p>
              <h2
                className="mt-3 text-xl font-semibold"
                style={{ fontFamily: "var(--font-display)", color: "var(--cream)", lineHeight: 1.25 }}
              >
                {card.title}
              </h2>
            </article>
          ))}
        </section>
      ) : null}

      <section className="container-page mt-12 reveal-on-scroll">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-kicker">{t("nav.services", lang)}</p>
            <h2
              className="mt-2 text-2xl font-semibold uppercase tracking-[0.03em] sm:text-3xl"
              style={{ fontFamily: "var(--font-display)", color: "var(--cream)" }}
            >
              {t("svc.other", lang)}
            </h2>
          </div>
          <Link href="/kontakt" className="link-primary text-sm font-semibold uppercase tracking-[0.16em]">
            {t("svc.ctaBtn", lang)}
          </Link>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {content.services.map((service, index) => {
            const slug = slugify(cs.services[index]?.title ?? service.title);

            return (
              <Link
                key={slug}
                href={`/sluzby/${slug}`}
                className="card-panel flex h-full flex-col justify-between gap-5 p-5 transition-all duration-300 hover:-translate-y-1"
                style={{ textDecoration: "none" }}
              >
                <div>
                  <div className="section-kicker">{String(index + 1).padStart(2, "0")}</div>
                  <h3
                    className="mt-3 text-lg font-semibold"
                    style={{ fontFamily: "var(--font-display)", color: "var(--cream)", lineHeight: 1.25 }}
                  >
                    {service.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--cream-muted)" }}>
                    {service.shortDesc}
                  </p>
                </div>
                <span
                  className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em]"
                  style={{ color: "var(--gold)" }}
                >
                  {t("card.detail", lang)}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container-page mt-14 reveal-on-scroll">
        <div className="card-panel flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="section-kicker">{t("svc.kicker", lang)}</p>
            <p className="mt-3 max-w-2xl text-base sm:text-lg" style={{ color: "var(--cream-muted)" }}>
              {t("svc.cta", lang)}
            </p>
          </div>
          <Link href="/kontakt" className="btn-primary inline-flex">
            {t("svc.ctaBtn", lang)}
          </Link>
        </div>
      </section>
    </div>
  );
}