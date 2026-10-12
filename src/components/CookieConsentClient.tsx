"use client";

import { useEffect } from "react";
import * as CookieConsent from "vanilla-cookieconsent";
import "vanilla-cookieconsent/dist/cookieconsent.css";
import { useLanguage } from "@/src/lib/LanguageContext";
import { updateConsent } from "@/src/lib/analytics";

export interface CookieTexts {
  footerLink: string;
  policyUrl: string;
  policyLinkLabel: string;
  title: string;
  description: string;
  acceptAllBtn: string;
  acceptNecessaryBtn: string;
  showPreferencesBtn: string;
  preferencesTitle: string;
  preferencesDescription: string;
  savePreferencesBtn: string;
  closeIconLabel: string;
  necessaryTitle: string;
  necessaryDescription: string;
  analyticsTitle: string;
  analyticsDescription: string;
}

// Knihovna vkládá texty jako HTML, z CMS ale chodí prostý text.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toTranslation(c: CookieTexts): CookieConsent.Translation {
  const policyLink = c.policyUrl
    ? `<a href="${escapeHtml(c.policyUrl)}">${escapeHtml(c.policyLinkLabel ?? "")}</a>`
    : undefined;

  return {
    consentModal: {
      title: escapeHtml(c.title ?? ""),
      description: escapeHtml(c.description ?? ""),
      acceptAllBtn: c.acceptAllBtn,
      acceptNecessaryBtn: c.acceptNecessaryBtn,
      showPreferencesBtn: c.showPreferencesBtn,
      footer: policyLink,
    },
    preferencesModal: {
      title: escapeHtml(c.preferencesTitle ?? ""),
      acceptAllBtn: c.acceptAllBtn,
      acceptNecessaryBtn: c.acceptNecessaryBtn,
      savePreferencesBtn: c.savePreferencesBtn,
      closeIconLabel: c.closeIconLabel,
      sections: [
        {
          description:
            escapeHtml(c.preferencesDescription ?? "") + (policyLink ? ` ${policyLink}` : ""),
        },
        {
          title: escapeHtml(c.necessaryTitle ?? ""),
          description: escapeHtml(c.necessaryDescription ?? ""),
          linkedCategory: "necessary",
        },
        {
          title: escapeHtml(c.analyticsTitle ?? ""),
          description: escapeHtml(c.analyticsDescription ?? ""),
          linkedCategory: "analytics",
        },
      ],
    },
  };
}

function syncAnalyticsConsent() {
  updateConsent(CookieConsent.acceptedCategory("analytics"));
}

// run() smí proběhnout jen jednou za život stránky (i ve StrictMode, kde
// se efekty v devu volají dvakrát).
let started: Promise<void> | null = null;

export function CookieConsentClient({ cs, en }: { cs: CookieTexts; en: CookieTexts }) {
  const { lang } = useLanguage();

  useEffect(() => {
    if (!started) {
      started = CookieConsent.run({
        guiOptions: {
          consentModal: { layout: "box inline", position: "bottom center", equalWeightButtons: true },
          preferencesModal: { layout: "box", equalWeightButtons: true },
        },
        categories: {
          necessary: { enabled: true, readOnly: true },
          analytics: {
            // Po odvolání souhlasu smaže cookies, které už GA stihl uložit
            // (totéž dělá i updateConsent(false) – pojistka pro .mikaauto.cz).
            autoClear: { cookies: [{ name: /^_(ga|gid|gat)/ }] },
          },
        },
        language: {
          default: lang,
          translations: { cs: toTranslation(cs), en: toTranslation(en) },
        },
        onConsent: syncAnalyticsConsent,
        onChange: syncAnalyticsConsent,
      });
    }
    started.then(() => CookieConsent.setLanguage(lang));
  }, [lang, cs, en]);

  // Všechna tlačítka (Přijmout / Odmítnout / Nastavení) mají záměrně
  // stejný vzhled – žádné zvýrazňování souhlasu.
  return (
    <style>{`
      html #cc-main {
        --cc-font-family: var(--font-body);
        --cc-bg: var(--black-card);
        --cc-primary-color: var(--cream);
        --cc-secondary-color: var(--cream-muted);
        --cc-link-color: var(--gold-light);
        --cc-modal-border-radius: 0;
        --cc-btn-border-radius: 0;
        --cc-btn-primary-bg: transparent;
        --cc-btn-primary-color: var(--cream);
        --cc-btn-primary-border-color: var(--gold);
        --cc-btn-primary-hover-bg: var(--gold);
        --cc-btn-primary-hover-color: var(--black);
        --cc-btn-primary-hover-border-color: var(--gold);
        --cc-btn-secondary-bg: transparent;
        --cc-btn-secondary-color: var(--cream);
        --cc-btn-secondary-border-color: var(--gold);
        --cc-btn-secondary-hover-bg: var(--gold);
        --cc-btn-secondary-hover-color: var(--black);
        --cc-btn-secondary-hover-border-color: var(--gold);
        --cc-separator-border-color: var(--black-border);
        --cc-toggle-on-bg: var(--gold);
        --cc-toggle-on-knob-bg: var(--black);
        --cc-toggle-off-bg: #3a3a3a;
        --cc-toggle-readonly-bg: var(--gold-dim);
        --cc-toggle-enabled-icon-color: var(--black);
        --cc-toggle-disabled-icon-color: var(--cream);
        --cc-cookie-category-block-bg: var(--black-rich);
        --cc-cookie-category-block-border: var(--black-border);
        --cc-cookie-category-block-hover-bg: var(--black-rich);
        --cc-cookie-category-block-hover-border: var(--gold-dim);
        --cc-cookie-category-expanded-block-bg: transparent;
        --cc-cookie-category-expanded-block-hover-bg: var(--black-rich);
        --cc-section-category-border: var(--black-border);
        --cc-footer-bg: var(--black-rich);
        --cc-footer-color: var(--cream-muted);
        --cc-footer-border-color: var(--black-border);
        --cc-overlay-bg: rgba(0, 0, 0, 0.7);
      }
      html #cc-main .cm,
      html #cc-main .pm {
        border: 1px solid var(--gold-dim);
      }
      html #cc-main .cm__btn,
      html #cc-main .pm__btn {
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        border-width: 1px;
      }
    `}</style>
  );
}
