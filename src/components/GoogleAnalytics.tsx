"use client";

import { useEffect } from "react";
import { GA_ID, trackEvent } from "@/src/lib/analytics";

// Consent Mode v2: výchozí stav je všechno 'denied' a musí být v dataLayer
// jako první. Samotný gtag.js se tu nenačítá – stáhne ho až updateConsent(true)
// po souhlasu s analytikou (src/lib/analytics.ts).
const CONSENT_BOOTSTRAP = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500
});`;

// Jeden posluchač pro všechny tel: odkazy na webu (hlavička, patička,
// kontakt, detail vozu) – komponenty samotné se tak nemusí měnit.
function usePhoneClickTracking() {
  useEffect(() => {
    if (!GA_ID) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest?.('a[href^="tel:"]');
      if (!link) return;
      trackEvent("click_phone", { link_url: link.getAttribute("href") });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
}

// Patří do <head>: bootstrap musí proběhnout při parsování HTML, ještě před
// hydratací – window.gtag tak existuje dřív, než ho zavolá kterákoli komponenta.
export default function GoogleAnalytics() {
  usePhoneClickTracking();

  if (!GA_ID) return null;

  return <script id="ga-consent" dangerouslySetInnerHTML={{ __html: CONSENT_BOOTSTRAP }} />;
}
