import type { Metadata } from "next";
import { HomePageClient } from "@/src/components/HomePageClient";
import { readPublishedVehicles } from "@/src/lib/vehicle-store";
import { readContent } from "@/src/lib/content-store";
import { toVehicleListItem } from "@/src/lib/vehicle-types";

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

const HERO_SLIDES = 6;
const MAX_FEATURED_CARDS = 12;

export default async function HomePage() {
  const [vehicles, content] = await Promise.all([readPublishedVehicles(), readContent()]);
  const homepageSettings = content.homepage_settings as { mode?: string; banners?: { imageUrl: string; linkUrl?: string; alt?: string }[] } | undefined;
  const cs = content.homepage as HomepageContent | undefined;
  const en = (content.homepage_en ?? cs) as HomepageContent | undefined;

  // Do prohlížeče posíláme jen vozy, které se opravdu vykreslí. Počet karet je
  // v CMS zvlášť pro CS a EN, takže se ořízne na to vyšší z obou nastavení
  // a jazyk si pak doma vybere svůj výřez.
  const cardCount = Math.min(
    MAX_FEATURED_CARDS,
    Math.max(cs?.featured?.desktopCount ?? 4, en?.featured?.desktopCount ?? 4, 1),
  );
  const featuredOnly = vehicles.filter((vehicle) => vehicle.featured);
  const featuredCars = (featuredOnly.length > 0 ? featuredOnly : vehicles)
    .slice(0, cardCount)
    .map(toVehicleListItem);

  const withPhoto = vehicles.filter((vehicle) => vehicle.imageUrl);
  const featuredWithPhoto = withPhoto.filter((vehicle) => vehicle.featured);
  const sliderCars = (featuredWithPhoto.length > 0 ? featuredWithPhoto : withPhoto)
    .slice(0, HERO_SLIDES)
    .map(toVehicleListItem);

  return (
    <HomePageClient
      sliderCars={sliderCars}
      featuredCars={featuredCars}
      vehicleCount={vehicles.length}
      homepageMode={homepageSettings?.mode || "default"}
      banners={homepageSettings?.banners || []}
      cs={cs}
      en={en}
    />
  );
}

