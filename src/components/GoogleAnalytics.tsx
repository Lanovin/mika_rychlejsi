"use client";

import { useEffect } from "react";
import Script from "next/script";
import { GA_ID, trackEvent } from "@/src/lib/analytics";

// Consent Mode v2: výchozí stav je všechno 'denied' a musí být v dataLayer
// dřív než `config`. Pokud návštěvník souhlas dal už dřív (cookie z lišty
// vanilla-cookieconsent), povolí se analytika hned tady – jinak by první
// pageview každé návštěvy odešel v režimu bez cookies.
function consentBootstrap(id: string) {
  return `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500
});
try {
  var m = document.cookie.match(/(?:^|;\\s*)cc_cookie=([^;]*)/);
  if (m) {
    var cc = JSON.parse(decodeURIComponent(m[1]));
    if (cc && cc.categories && cc.categories.indexOf('analytics') !== -1) {
      gtag('consent', 'update', { analytics_storage: 'granted' });
    }
  }
} catch (e) {}
gtag('js', new Date());
gtag('config', ${JSON.stringify(id)});`;
}

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
// hydratací – jinak by eventy z efektů komponent (view_item na detailu vozu)
// při prvním načtení stránky narazily na neexistující window.gtag.
export default function GoogleAnalytics() {
  usePhoneClickTracking();

  if (!GA_ID) return null;

  return (
    <>
      <script id="ga-consent" dangerouslySetInnerHTML={{ __html: consentBootstrap(GA_ID) }} />
      <Script
        id="ga-gtag"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`}
      />
    </>
  );
}
