import Link from "next/link";
import { readContent } from "@/src/lib/content-store";
import { FooterClient } from "@/components/FooterClient";

interface FooterContent {
  description: string;
  copyright: string;
  tagline: string;
  partners: string[];
}

interface KontaktContent {
  phone: string;
  email: string;
  address: { street: string; city: string; note1: string };
  hours: { weekdays: string; saturday: string; sunday: string };
}

// Patička je v layoutu, tedy na každé stránce. Kdyby obsah z CMS dorazil
// neúplný, nesmí to shodit celý web – radši prázdné pole než chyba 500.
const EMPTY_FOOTER: FooterContent = { description: "", copyright: "", tagline: "", partners: [] };
const EMPTY_KONTAKT: KontaktContent = {
  phone: "",
  email: "",
  address: { street: "", city: "", note1: "" },
  hours: { weekdays: "", saturday: "", sunday: "" },
};

function normalizeKontakt(raw: unknown): KontaktContent | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<KontaktContent>;
  return {
    phone: value.phone ?? "",
    email: value.email ?? "",
    address: { ...EMPTY_KONTAKT.address, ...(value.address ?? {}) },
    hours: { ...EMPTY_KONTAKT.hours, ...(value.hours ?? {}) },
  };
}

export async function Footer() {
  const content = await readContent();
  const f = (content.footer as FooterContent | undefined) ?? EMPTY_FOOTER;
  const fEn = (content.footer_en as FooterContent | undefined) ?? f;
  const k = normalizeKontakt(content.kontakt) ?? EMPTY_KONTAKT;
  const kEn = normalizeKontakt(content.kontakt_en) ?? k;
  const cookieLink = (content.cookies as { footerLink?: string } | undefined)?.footerLink ?? "";
  const cookieLinkEn = (content.cookies_en as { footerLink?: string } | undefined)?.footerLink ?? cookieLink;

  return <FooterClient f={f} fEn={fEn} k={k} kEn={kEn} cookieLink={cookieLink} cookieLinkEn={cookieLinkEn} />;
}

