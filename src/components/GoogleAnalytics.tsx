"use client";

import Script from "next/script";
import { GA_ID } from "@/src/lib/analytics";

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

export default function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script id="ga-consent" strategy="afterInteractive">
        {consentBootstrap(GA_ID)}
      </Script>
      <Script
        id="ga-gtag"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`}
      />
    </>
  );
}
