import type { Metadata } from "next";
import { readContent } from "@/src/lib/content-store";
import { ContactPageClient } from "@/src/components/ContactPageClient";
import { slugify } from "@/src/lib/slugify";


export const metadata: Metadata = {
  title: "Kontakt – Autobazar Mika Auto Brno",
  description: "Kontaktujte autobazar Mika Auto – telefon, e-mail, adresa, otevírací doba. Vídeňská 297/99, Brno. Rádi vám poradíme s výběrem vozu.",
  alternates: { canonical: "/kontakt" },
  openGraph: {
    title: "Kontakt | Mika Auto",
    description: "Kontaktní údaje autobazaru Mika Auto Brno – telefon, e-mail, mapa.",
  },
};

export default async function ContactPage() {
  const content = await readContent();
  const cs = content.kontakt as {
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
  };
  const en = (content.kontakt_en ?? cs) as typeof cs;

  // Service titles are editable in the CMS, so resolve the target links from
  // the live content instead of hardcoding slugs.
  const services = (content.sluzby as { services?: { title: string }[] } | undefined)?.services ?? [];
  const findServiceHref = (keyword: string) => {
    const service = services.find((s) => slugify(s.title).includes(keyword));
    return service ? `/sluzby/${slugify(service.title)}` : "/sluzby";
  };

  return (
    <ContactPageClient
      cs={cs}
      en={en}
      financingHref={findServiceHref("financovani")}
      buyoutHref={findServiceHref("vykup")}
    />
  );
}
