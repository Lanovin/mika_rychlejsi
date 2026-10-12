import { readContent } from "@/src/lib/content-store";
import { CookieConsentClient, type CookieTexts } from "@/src/components/CookieConsentClient";

// Texty lišty jsou v content.json / CMS pod klíči `cookies` a `cookies_en`.
// Bez nich se lišta nezobrazí – nic se nehardcoduje.
export default async function CookieConsent() {
  const content = await readContent();
  const cs = content.cookies as CookieTexts | undefined;
  if (!cs) return null;
  const en = (content.cookies_en as CookieTexts | undefined) ?? cs;

  return <CookieConsentClient cs={cs} en={en} />;
}
