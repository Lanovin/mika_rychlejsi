"use client";

import { useState, type FormEvent } from "react";
import { useLanguage } from "@/src/lib/LanguageContext";
import { t } from "@/src/lib/translations";

interface ContactData {
  _layout?: string[];
  header: { kicker: string; title: string; description: string };
  reasons: string[];
  phone: string;
  phoneNote: string;
  address: { name: string; street: string; city: string; note1: string; note2: string };
  email: string;
  hours: { weekdays: string; saturday: string; sunday: string; note: string };
  billing: { ico: string; dic: string };
  bank: { csob: string; sporitelna: string };
  process: string[];
  formTitle: string;
  formNote: string;
  mapUrl?: string;
}

export function ContactPageClient({ cs, en }: { cs: ContactData; en: ContactData }) {
  const { lang } = useLanguage();
  const c = lang === "en" ? en : cs;
  const layout = c._layout;
  const show = (key: string) => !layout || layout.includes(key);
  const processPanel = show("process") ? (
    <div
      className="p-5 reveal-on-scroll reveal-on-scroll--delay-2"
      style={{
        background: "var(--black-card)",
        border: "1px solid var(--black-border)",
      }}
    >
      <h2
        className="text-sm font-semibold"
        style={{ color: "var(--cream)" }}
      >
        {t("contact.expect", lang)}
      </h2>
      <div className="mt-3 space-y-3 text-sm text-secondary">
        {c.process.map((step: string, i: number) => (
          <div key={i}>{step}</div>
        ))}
      </div>
    </div>
  ) : null;
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    const form = e.currentTarget;
    const data = {
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      phone: (form.elements.namedItem("phone") as HTMLInputElement).value,
      message: (form.elements.namedItem("message") as HTMLTextAreaElement).value,
      source: "contact",
    };
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const body = await res.json().catch(() => null);
        if (body?.code === "CONTACT_DELIVERY_NOT_CONFIGURED") {
          setError(
            lang === "cs"
              ? `Formulář je dočasně mimo provoz. Zavolejte nám prosím na ${c.phone} nebo napište na ${c.email}.`
              : `The form is temporarily unavailable. Please call us at ${c.phone} or email ${c.email}.`
          );
        } else {
          setError(body?.error || (lang === "cs" ? "Nastala chyba při odesílání." : "An error occurred while sending."));
        }
      }
    } catch {
      setError(lang === "cs" ? "Nastala chyba při odesílání." : "An error occurred while sending.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container-page py-10 pb-16">
      {/* Header */}
      {show("header") && (
      <header className="max-w-3xl reveal-on-scroll">
        <p className="section-kicker">{c.header.kicker}</p>
        <h1
          className="mt-2 text-3xl font-semibold uppercase tracking-[0.03em] sm:text-4xl"
          style={{ fontFamily: "var(--font-display)", color: "var(--cream)" }}
        >
          {c.header.title}
        </h1>
        <p className="mt-3 text-sm text-secondary">{c.header.description}</p>
      </header>
      )}

      <div className="gold-divider hidden md:block" />

      {/* Důvody */}
      {show("reasons") && (
      <section className="mt-6 hidden md:grid gap-4 md:grid-cols-3">
        {c.reasons.map((reason: string, i: number) => (
          <div
            key={reason}
            className={`card-panel px-5 py-4 text-sm font-medium text-secondary reveal-on-scroll${i === 1 ? " reveal-on-scroll--delay" : i === 2 ? " reveal-on-scroll--delay-2" : ""}`}
          >
            {reason}
          </div>
        ))}
      </section>
      )}

      <div className="gold-divider hidden md:block" />

      {/* Kontaktní info + Formulář */}
      <section className="mt-8 grid gap-10 md:grid-cols-2">
        <div className="card-panel space-y-6 p-6 text-sm text-secondary reveal-on-scroll">
          {/* Rychlý kontakt */}
          <div
            className="px-5 py-5"
            style={{
              background: "var(--black-card)",
              border: "1px solid var(--black-border)",
            }}
          >
            <div className="text-xs uppercase tracking-[0.24em] text-secondary">
              {t("contact.quickContact", lang)}
            </div>
            <div
              className="mt-3 text-2xl font-semibold"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--gold-light)",
                whiteSpace: "nowrap",
              }}
            >
              {c.phone}
            </div>
            <div className="mt-2 text-sm text-secondary">{c.phoneNote}</div>
          </div>

          <div>
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--cream)" }}
            >
              {t("contact.address", lang)}
            </h2>
            <p className="mt-1">
              {c.address.name}
              <br />
              {c.address.street}
              <br />
              {c.address.city}
              <br />
              {c.address.note1}
              <br />
              {c.address.note2}
            </p>
          </div>

          <div>
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--cream)" }}
            >
              {t("contact.contact", lang)}
            </h2>
            <p className="mt-1">
              {t("contact.phoneLabel", lang)}{" "}
              <a
                href={`tel:${c.phone.replace(/\s/g, "")}`}
                className="link-primary"
              >
                {c.phone}
              </a>
              <br />
              {t("contact.emailLabel", lang)}{" "}
              <a href={`mailto:${c.email}`} className="link-primary">
                {c.email}
              </a>
            </p>
          </div>

          <div>
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--cream)" }}
            >
              {t("contact.hours", lang)}
            </h2>
            <p className="mt-1">
              {c.hours.weekdays}
              <br />
              {c.hours.saturday}
              <br />
              {c.hours.sunday}
              <br />
              {c.hours.note}
            </p>
          </div>

          {show("billing") && (
          <div
            className="p-5"
            style={{
              background: "var(--black-card)",
              border: "1px solid var(--black-border)",
            }}
          >
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--cream)" }}
            >
              {t("contact.billing", lang)}
            </h2>
            <p className="mt-2 text-sm text-secondary">
              {t("contact.ico", lang)} {c.billing.ico}
              <br />
              {t("contact.dic", lang)} {c.billing.dic}
            </p>
          </div>
          )}

          {show("bank") && (
          <div
            className="p-5"
            style={{
              background: "var(--black-card)",
              border: "1px solid var(--black-border)",
            }}
          >
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--cream)" }}
            >
              {t("contact.bank", lang)}
            </h2>
            <p className="mt-2 text-sm text-secondary">
              {t("contact.csob", lang)} {c.bank.csob}
              <br />
              {t("contact.sporitelna", lang)} {c.bank.sporitelna}
            </p>
          </div>
          )}

        </div>

        {/* Formulář */}
        {(show("form") || processPanel) && (
        <div className="space-y-6">
          {show("form") && (
          <>
          {sent ? (
            <div className="card-panel p-6 flex flex-col items-center justify-center text-center reveal-on-scroll reveal-on-scroll--delay">
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>✓</div>
              <h2 className="text-lg font-semibold" style={{ color: "var(--cream)" }}>
                {lang === "cs" ? "Zpráva odeslána" : "Message Sent"}
              </h2>
              <p className="mt-2 text-sm text-secondary">
                {lang === "cs" ? "Ozveme se vám co nejdříve." : "We'll get back to you as soon as possible."}
              </p>
            </div>
          ) : (
          <form className="card-panel p-6 reveal-on-scroll reveal-on-scroll--delay" onSubmit={handleSubmit}>
            <h2
              className="text-sm font-semibold"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--cream)",
              }}
            >
              {c.formTitle}
            </h2>
            <p className="mt-1 text-xs text-muted">{c.formNote}</p>

            {error && (
              <div className="mt-3 border-l-4 border-red-500/60 px-4 py-2 text-sm text-red-200" style={{ background: "var(--black-rich)" }}>
                {error}
              </div>
            )}

            <div className="mt-4 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-muted">
                  {t("contact.name", lang)}
                </label>
                <input type="text" name="name" required placeholder={t("contact.namePlaceholder", lang)} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-muted">
                    {t("contact.email", lang)}
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder={t("contact.emailPlaceholder", lang)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide text-muted">
                    {t("contact.phone", lang)}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder={t("contact.phonePlaceholder", lang)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-muted">
                  {t("contact.message", lang)}
                </label>
                <textarea
                  rows={4}
                  name="message"
                  required
                  placeholder={t("contact.messagePlaceholder", lang)}
                />
              </div>

              <button type="submit" disabled={sending} className="btn-primary mt-2 w-full">
                {sending ? (lang === "cs" ? "Odesílám…" : "Sending…") : t("contact.send", lang)}
              </button>
            </div>
          </form>
          )}
          </>
          )}

          {processPanel}
        </div>
        )}
      </section>

      <div className="gold-divider hidden md:block" />

      {/* Mapa */}
      {show("map") && (
      <section className="mt-10 reveal-on-scroll">
        <div
          className="overflow-hidden"
          style={{ border: "1px solid var(--black-border)" }}
        >
          <iframe
            title={t("contact.mapTitle", lang)}
            src={c.mapUrl || "https://mapy.com/s/meludoreha"}
            className="h-80 w-full border-0 lg:h-96"
            loading="lazy"
          />
        </div>
      </section>
      )}
    </div>
  );
}
