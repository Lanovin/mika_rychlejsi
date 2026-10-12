// Google Analytics 4 v režimu „basic consent mode“: gtag.js se stáhne až ve
// chvíli, kdy návštěvník přijme kategorii analytics. Do té doby se do Googlu
// neposílá nic, ani anonymní pingy. Bez NEXT_PUBLIC_GA_ID (lokál, preview)
// jsou všechny funkce níže tiché no-op.
//
// Výchozí stav souhlasu ('denied') nastavuje inline skript v <head>
// (src/components/GoogleAnalytics.tsx), takže window.gtag existuje vždy
// dřív, než se sem cokoli zavolá.

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

const GA_COOKIE = /^_(ga|gid|gat)/;
const MAX_PENDING = 50;

let granted = false;
let configured = false;
// Eventy vzniklé před souhlasem (typicky view_item na detailu vozu, který se
// odešle hned po načtení). Po přijetí se pošlou ty z aktuální stránky.
let pending: { name: string; params: Record<string, unknown>; path: string }[] = [];

function loadGtagScript() {
  if (document.getElementById("ga-gtag")) return;
  const script = document.createElement("script");
  script.id = "ga-gtag";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);
}

// GA ukládá cookies na nejvyšší možnou doménu (.mikaauto.cz), proto se mažou
// na hostiteli i na všech nadřazených doménách.
function eraseGaCookies() {
  const names = document.cookie
    .split(";")
    .map((cookie) => cookie.split("=")[0].trim())
    .filter((name) => GA_COOKIE.test(name));
  if (names.length === 0) return;

  const parts = location.hostname.split(".");
  const domains = [""];
  for (let i = 0; i < parts.length - 1; i++) {
    domains.push(`; domain=.${parts.slice(i).join(".")}`);
  }
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; path=/${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  }
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (!GA_ID || typeof window === "undefined" || !window.gtag) return;
  if (!granted) {
    if (pending.length < MAX_PENDING) {
      pending.push({ name, params, path: location.pathname });
    }
    return;
  }
  window.gtag("event", name, params);
}

// Web má jen kategorii „analytics“, žádnou marketingovou – ad_* signály
// proto zůstávají trvale na 'denied' z výchozího nastavení.
export function updateConsent(value: boolean) {
  if (!GA_ID || typeof window === "undefined" || !window.gtag) return;

  if (value) {
    if (granted) return;
    granted = true;
    window[`ga-disable-${GA_ID}`] = false;
    window.gtag("consent", "update", { analytics_storage: "granted" });
    if (!configured) {
      configured = true;
      window.gtag("js", new Date());
      window.gtag("config", GA_ID);
    }
    const here = location.pathname;
    for (const event of pending) {
      if (event.path === here) window.gtag("event", event.name, event.params);
    }
    pending = [];
    loadGtagScript();
    return;
  }

  pending = [];
  eraseGaCookies();
  if (!granted) return;
  // Odvolání souhlasu: gtag.js už je načtený, tímhle přestane posílat cokoli.
  granted = false;
  window[`ga-disable-${GA_ID}`] = true;
  window.gtag("consent", "update", { analytics_storage: "denied" });
}
