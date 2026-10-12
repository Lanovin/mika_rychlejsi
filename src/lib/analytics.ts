// Google Analytics 4. Bez NEXT_PUBLIC_GA_ID (lokál, preview) se gtag vůbec
// nenačte a obě funkce níže jsou tiché no-op – volající nic řešit nemusí.

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}

// Web má jen kategorii „analytics“, žádnou marketingovou – ad_* signály
// proto zůstávají trvale na 'denied' z výchozího nastavení.
export function updateConsent(granted: boolean) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("consent", "update", {
    analytics_storage: granted ? "granted" : "denied",
  });
}
