"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/src/lib/LanguageContext";
import { t } from "@/src/lib/translations";
import { VehiclePurchaseForm } from "@/src/components/VehiclePurchaseForm";

function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface ServiceItem {
  title: string;
  shortDesc: string;
  longDesc: string;
}

interface OtherServiceItem extends ServiceItem {
  idx: number;
  csTitle?: string;
}

interface ServiceDetailClientProps {
  service: ServiceItem;
  serviceEn: ServiceItem;
  others: OtherServiceItem[];
  othersEn: OtherServiceItem[];
  slug: string;
  serviceIndex: number;
}

export function ServiceDetailClient({ service, serviceEn, others, othersEn, slug, serviceIndex }: ServiceDetailClientProps) {
  const { lang } = useLanguage();
  const svc = lang === "en" ? serviceEn : service;
  const othersList = lang === "en" ? othersEn : others;

  const isVykup = slug === "vykup-vozu-za-hotove";

  return (
    <div className="pb-16">
      <section className="container-page pt-12 pb-6 reveal-on-scroll">
        <Link
          href="/"
          className="link-primary mb-6 inline-flex items-center gap-1 text-xs"
        >
          <ArrowLeft className="h-3 w-3" />
          {t("svc.back", lang)}
        </Link>

        <p className="section-kicker">{t("svc.kicker", lang)}</p>
        <h1
          className="mt-2 text-3xl font-semibold uppercase tracking-[0.03em] sm:text-4xl"
          style={{ fontFamily: "var(--font-display)", color: "var(--cream)" }}
        >
          {svc.title}
        </h1>
      </section>

      <div className="gold-divider" />

      <section className="container-page mt-10 reveal-on-scroll">
        <div className="card-panel p-6 md:p-8 space-y-4">
          {svc.shortDesc && (
            <p
              className="text-base leading-relaxed sm:text-lg font-medium"
              style={{ color: "var(--cream)" }}
            >
              {svc.shortDesc}
            </p>
          )}
          {svc.longDesc && svc.longDesc !== svc.shortDesc && (
            <p
              className="text-base leading-relaxed"
              style={{ color: "var(--cream-muted)" }}
            >
              {svc.longDesc}
            </p>
          )}
        </div>
      </section>

      {isVykup && (
        <section className="container-page mt-10 reveal-on-scroll reveal-on-scroll--delay">
          <VehiclePurchaseForm />
        </section>
      )}

      <section className="container-page mt-10 text-center reveal-on-scroll reveal-on-scroll--delay">
        <p className="text-sm text-secondary">
          {t("svc.cta", lang)}
        </p>
        <Link href="/kontakt" className="btn-primary mt-4 inline-block">
          {t("svc.ctaBtn", lang)}
        </Link>
      </section>

      <section className="container-page mt-20 sm:mt-16 reveal-on-scroll">
        <h2
          className="text-xl font-semibold uppercase tracking-[0.03em]"
          style={{ fontFamily: "var(--font-display)", color: "var(--cream)" }}
        >
          {t("svc.other", lang)}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {othersList.map((s) => (
            <Link
              key={slugify(s.csTitle ?? s.title)}
              href={`/sluzby/${slugify(s.csTitle ?? s.title)}`}
              className={`card-panel flex flex-col gap-2 p-5 transition-all duration-200 hover:-translate-y-1 reveal-on-scroll${s.idx % 3 === 1 ? " reveal-on-scroll--delay" : s.idx % 3 === 2 ? " reveal-on-scroll--delay-2" : ""}`}
              style={{ textDecoration: "none" }}
            >
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--cream)" }}
              >
                {s.title}
              </h3>
              <p className="text-xs text-secondary">{s.shortDesc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
