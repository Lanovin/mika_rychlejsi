import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LanguageProvider } from "@/src/lib/LanguageContext";
import CookieConsent from "@/src/components/CookieConsent";
import ScrollRevealObserver from "@/src/components/ScrollRevealObserver";
import WhatsAppFloatingButton from "@/src/components/WhatsAppFloatingButton";
import InstagramFloatingButton from "@/src/components/InstagramFloatingButton";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.mikaauto.cz";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mika Auto – Autobazar | Kvalitní ojeté vozy Praha 9 - Čakovice",
    template: "%s | Mika Auto – Autobazar",
  },
  description: "Autobazar Mika Auto v Brně – široká nabídka prověřených ojetých vozů Škoda, Volkswagen, Hyundai a dalších značek. Výkup, financování, pojištění. Od roku 2007.",
  keywords: ["autobazar", "ojeté vozy", "autobazar Brno", "Škoda", "Volkswagen", "Hyundai", "výkup aut", "financování vozu", "prověřená auta", "Mika Auto"],
  authors: [{ name: "MIKAAUTO s.r.o." }],
  creator: "MIKAAUTO s.r.o.",
  publisher: "MIKAAUTO s.r.o.",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    url: SITE_URL,
    siteName: "Mika Auto – Autobazar",
    title: "Mika Auto – Autobazar | Kvalitní ojeté vozy Praha 9 - Čakovice",
    description: "Prověřené ojeté vozy s garancí původu. Výkup, financování, pojištění vozidel. Autobazar Mika Auto – od roku 2007.",
    images: [
      {
        url: "/mikalogo2.png",
        width: 600,
        height: 400,
        alt: "Mika Auto – Autobazar",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mika Auto – Autobazar | Kvalitní ojeté vozy Praha 9 - Čakovice",
    description: "Prověřené ojeté vozy s garancí původu. Autobazar Mika Auto – od roku 2007.",
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: "Mika Auto",
    alternateName: "MIKAAUTO s.r.o.",
    url: SITE_URL,
    logo: `${SITE_URL}/mikalogo2.png`,
    image: `${SITE_URL}/mikalogo2.png`,
    description: "Autobazar Mika Auto v Brně – prověřené ojeté vozy s garancí původu. Výkup, financování, pojištění.",
    foundingDate: "2007",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Vídeňská 297/99",
      addressLocality: "Brno",
      addressRegion: "Jihomoravský kraj",
      postalCode: "619 00",
      addressCountry: "CZ",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "49.1644",
      longitude: "16.5990",
    },
    telephone: "+420 777 235 355",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "09:00",
        closes: "12:00",
      },
    ],
    priceRange: "$$",
    currenciesAccepted: "CZK",
    paymentAccepted: "Cash, Credit Card, Bank Transfer",
    areaServed: {
      "@type": "GeoCircle",
      geoMidpoint: { "@type": "GeoCoordinates", latitude: "49.1951", longitude: "16.6068" },
      geoRadius: "50000",
    },
    sameAs: [
      "https://www.instagram.com/mikaauto.cz",
    ],
  };

  return (
    <html lang="cs">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://img.tipcars.com" />
        <link rel="dns-prefetch" href="https://img.tipcars.com" />
        <link rel="icon" href="/miniatura_mika.png" type="image/png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Safety net that must work even when the Next.js bundles fail to load
            (stale chunks after a redeploy): force-reveal hidden content and
            recover from chunk load errors with a single guarded reload. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  function revealAll(){
    try {
      var els = document.querySelectorAll(".reveal-on-scroll:not(.revealed)");
      for (var i = 0; i < els.length; i++) els[i].classList.add("revealed");
    } catch (e) {}
  }
  window.setTimeout(revealAll, 1800);
  window.addEventListener("load", function(){ window.setTimeout(revealAll, 1800); });

  var RELOAD_KEY = "mika-chunk-reload-at";
  function reloadOnce(){
    try {
      var last = Number(window.sessionStorage.getItem(RELOAD_KEY) || "0");
      if (Date.now() - last < 60000) return;
      window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    } catch (e) {}
    window.location.reload();
  }
  function isChunkSrc(src){
    return typeof src === "string" && src.indexOf("/_next/static/") !== -1;
  }
  window.addEventListener("error", function(event){
    var target = event.target;
    if (!target) return;
    var tag = target.tagName;
    if (tag === "SCRIPT" && isChunkSrc(target.src)) reloadOnce();
    if (tag === "LINK" && isChunkSrc(target.href)) reloadOnce();
  }, true);
  window.addEventListener("unhandledrejection", function(event){
    var reason = event && event.reason;
    var message = reason && (reason.message || String(reason));
    var name = reason && reason.name;
    if (name === "ChunkLoadError" || (typeof message === "string" && /loading( css)? chunk .*failed/i.test(message))) {
      reloadOnce();
    }
  });
})();`,
          }}
        />
      </head>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <LanguageProvider>
          <ScrollRevealObserver />
          <Header />
          <main style={{ flex: 1 }}>{children}</main>
          <Footer />
          <WhatsAppFloatingButton />
          <InstagramFloatingButton />
          <CookieConsent />
        </LanguageProvider>
      </body>
    </html>
  );
}

