import type { Metadata } from "next";
import { HomePageClient } from "@/src/components/HomePageClient";
import { readPublishedVehicles } from "@/src/lib/vehicle-store";
import { readContent } from "@/src/lib/content-store";

interface HomepageContent {
  _layout?: string[];
  hero: { kicker: string; title: string; titleHighlight: string; ctaPrimary: string; ctaSecondary: string };
  featured: { kicker: string; title: string; titleHighlight: string; linkText: string; desktopCount?: number; mobileCount?: number };
  stats: { value: string; label: string }[];
  features: {
    kicker: string; title: string; titleHighlight: string;
    items: { title: string; description: string }[];
  };
  reviews: {
    kicker: string; title: string;
    items: { author: string; text: string }[];
  };
}

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Mika Auto – Autobazar | Kvalitní ojeté vozy Praha 9 - Čakovice",
  description: "Autobazar Mika Auto – široká nabídka prověřených ojetých vozů. Výkup aut, financování, pojištění. Brno, od roku 2007.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [vehicles, content] = await Promise.all([readPublishedVehicles(), readContent()]);
  const homepageSettings = content.homepage_settings as { mode?: string; banners?: { imageUrl: string; linkUrl?: string; alt?: string }[] } | undefined;
  const cs = content.homepage as HomepageContent | undefined;
  const en = (content.homepage_en ?? cs) as HomepageContent | undefined;

  return <HomePageClient vehicles={vehicles} homepageMode={homepageSettings?.mode || "default"} banners={homepageSettings?.banners || []} cs={cs} en={en} />;
}

