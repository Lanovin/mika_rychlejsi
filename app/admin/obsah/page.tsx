"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft, Save, Plus, Trash2, ChevronDown, ChevronRight, Bell,
  EyeOff, ArrowUp, ArrowDown, Layers, GripVertical, Image as ImageIcon, Monitor,
} from "lucide-react";
import { useLanguage } from "@/src/lib/LanguageContext";
import { t } from "@/src/lib/translations";

type ContentData = Record<string, unknown>;
type EditLang = "cs" | "en";

interface SectionConfig {
  key: string;
  label: string;
}

interface BlockDef {
  key: string;
  cs: string;
  en: string;
  fields?: string[];
}

/* ─── Block definitions per base page ────────────── */
const PAGE_BLOCKS: Record<string, BlockDef[]> = {
  homepage: [
    { key: "hero", cs: "Hero sekce", en: "Hero Section" },
    { key: "featured", cs: "Doporučené vozy", en: "Featured Vehicles" },
    { key: "search", cs: "Vyhledávání", en: "Search" },
    { key: "stats", cs: "Statistiky", en: "Statistics" },
    { key: "features", cs: "Proč nás volit", en: "Why Choose Us" },
    { key: "reviews", cs: "Recenze zákazníků", en: "Customer Reviews" },
  ],
  onas: [
    { key: "header", cs: "Záhlaví stránky", en: "Page Header" },
    { key: "history", cs: "Historie a poslání", en: "History & Mission" },
    { key: "stats", cs: "Statistiky", en: "Statistics" },
    { key: "approach", cs: "Náš přístup", en: "Our Approach" },
  ],
  sluzby: [
    { key: "header", cs: "Záhlaví", en: "Header" },
    { key: "summaryCards", cs: "Přehledové karty", en: "Summary Cards" },
    { key: "services", cs: "Seznam služeb", en: "Services List" },
  ],
  kontakt: [
    { key: "header", cs: "Záhlaví", en: "Header" },
    { key: "reasons", cs: "Důvody kontaktu", en: "Contact Reasons" },
    { key: "contactInfo", cs: "Kontaktní údaje", en: "Contact Details", fields: ["phone", "phoneNote", "address", "email", "hours"] },
    { key: "billing", cs: "Fakturační údaje", en: "Billing Info" },
    { key: "bank", cs: "Bankovní účty", en: "Bank Accounts" },
    { key: "process", cs: "Postup spolupráce", en: "Cooperation Process" },
    { key: "form", cs: "Kontaktní formulář", en: "Contact Form", fields: ["formTitle", "formNote"] },
    { key: "map", cs: "Mapa", en: "Map", fields: ["mapUrl"] },
  ],
};

function getBaseKey(sectionKey: string): string {
  return sectionKey.replace(/_en$/, "");
}

function getPageSections(lang: "cs" | "en", editLang: EditLang): SectionConfig[] {
  const suffix = editLang === "en" ? "_en" : "";
  return [
    { key: `homepage${suffix}`, label: t("cms.home", lang) },
    { key: `onas${suffix}`, label: t("cms.about", lang) },
    { key: `sluzby${suffix}`, label: t("cms.services", lang) },
    { key: `kontakt${suffix}`, label: t("cms.contact", lang) },
    { key: `inventory${suffix}`, label: t("cms.inventory", lang) },
    { key: `footer${suffix}`, label: t("cms.footer", lang) },
  ];
}

export default function CmsPage() {
  const { lang } = useLanguage();
  const [editLang, setEditLang] = useState<EditLang>("cs");
  const PAGE_SECTIONS = getPageSections(lang, editLang);
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>(editLang === "en" ? "homepage_en" : "homepage");
  const [expandedBlock, setExpandedBlock] = useState<string>("");

  useEffect(() => {
    fetch("/api/content")
      .then((res) => res.json())
      .then((data) => {
        setContent(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = useCallback(async () => {
    if (!content) return;
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        setNotice("__CMS_SAVED__");
      } else {
        setNotice(typeof body?.error === "string" ? body.error : "__CMS_ERROR_SAVE__");
      }
    } catch {
      setNotice("__CMS_ERROR_CONN__");
    } finally {
      setSaving(false);
      setTimeout(() => setNotice(null), 4000);
    }
  }, [content]);

  const updateValue = useCallback((path: string[], value: unknown) => {
    setContent((prev) => {
      if (!prev) return prev;
      const clone = JSON.parse(JSON.stringify(prev));
      let obj: Record<string, unknown> = clone;
      for (let i = 0; i < path.length - 1; i++) {
        obj = obj[path[i]] as Record<string, unknown>;
      }
      obj[path[path.length - 1]] = value;
      return clone;
    });
  }, []);

  const addArrayItem = useCallback((path: string[], template: unknown) => {
    setContent((prev) => {
      if (!prev) return prev;
      const clone = JSON.parse(JSON.stringify(prev));
      let obj: Record<string, unknown> = clone;
      for (let i = 0; i < path.length; i++) {
        obj = obj[path[i]] as Record<string, unknown>;
      }
      (obj as unknown as unknown[]).push(JSON.parse(JSON.stringify(template)));
      return clone;
    });
  }, []);

  const removeArrayItem = useCallback((path: string[], index: number) => {
    setContent((prev) => {
      if (!prev) return prev;
      const clone = JSON.parse(JSON.stringify(prev));
      let obj: Record<string, unknown> = clone;
      for (let i = 0; i < path.length; i++) {
        obj = obj[path[i]] as Record<string, unknown>;
      }
      (obj as unknown as unknown[]).splice(index, 1);
      return clone;
    });
  }, []);

  /* ── Block layout helpers ───────────────────────── */
  const getLayout = useCallback((sectionKey: string): string[] => {
    if (!content) return [];
    const pageData = content[sectionKey] as Record<string, unknown> | undefined;
    if (!pageData) return [];
    const layout = pageData._layout as string[] | undefined;
    if (layout) return [...layout];
    const baseKey = getBaseKey(sectionKey);
    const blocks = PAGE_BLOCKS[baseKey];
    if (blocks) return blocks.map((b) => b.key);
    return Object.keys(pageData).filter((k) => k !== "_layout");
  }, [content]);

  const setLayout = useCallback(
    (sectionKey: string, newLayout: string[]) => {
      updateValue([sectionKey, "_layout"], newLayout);
      const baseKey = getBaseKey(sectionKey);
      const isEn = sectionKey.endsWith("_en");
      const otherKey = isEn ? baseKey : `${baseKey}_en`;
      if (content && content[otherKey]) {
        updateValue([otherKey, "_layout"], newLayout);
      }
    },
    [updateValue, content],
  );

  const moveBlock = useCallback(
    (sectionKey: string, blockKey: string, direction: "up" | "down") => {
      const layout = getLayout(sectionKey);
      const idx = layout.indexOf(blockKey);
      if (idx === -1) return;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= layout.length) return;
      const newLayout = [...layout];
      [newLayout[idx], newLayout[newIdx]] = [newLayout[newIdx], newLayout[idx]];
      setLayout(sectionKey, newLayout);
    },
    [getLayout, setLayout],
  );

  const hideBlock = useCallback(
    (sectionKey: string, blockKey: string) => {
      const layout = getLayout(sectionKey);
      setLayout(sectionKey, layout.filter((k) => k !== blockKey));
    },
    [getLayout, setLayout],
  );

  const showBlock = useCallback(
    (sectionKey: string, blockKey: string) => {
      const layout = getLayout(sectionKey);
      if (!layout.includes(blockKey)) {
        setLayout(sectionKey, [...layout, blockKey]);
      }
    },
    [getLayout, setLayout],
  );

  if (loading) {
    return (
      <div className="container-page py-10">
        <p className="text-secondary">{t("cms.loading", lang)}</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="container-page py-10">
        <p className="text-red-400">{t("cms.errorLoad", lang)}</p>
      </div>
    );
  }

  return (
    <div className="container-page py-10 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="mb-3 inline-flex items-center gap-2 text-xs text-secondary hover:text-white transition">
            <ArrowLeft className="h-3 w-3" /> {t("cms.backToVehicles", lang)}
          </Link>
          <p className="section-kicker">{t("cms.title", lang)}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white" style={{ fontFamily: "var(--font-display)" }}>
            {t("cms.subtitle", lang)}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-secondary">{t("cms.editDesc", lang)}</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex overflow-hidden" style={{ border: "1px solid var(--black-border)" }}>
            <button
              onClick={() => { setEditLang("cs"); setExpandedSection("homepage"); }}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wide transition"
              style={{ background: editLang === "cs" ? "var(--gold)" : "var(--black-rich)", color: editLang === "cs" ? "var(--black)" : "var(--cream-muted)" }}
            >
              🇨🇿 Čeština
            </button>
            <button
              onClick={() => { setEditLang("en"); setExpandedSection("homepage_en"); }}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wide transition"
              style={{ background: editLang === "en" ? "var(--gold)" : "var(--black-rich)", color: editLang === "en" ? "var(--black)" : "var(--cream-muted)" }}
            >
              🇬🇧 English
            </button>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving ? t("cms.saving", lang) : t("cms.saveAll", lang)}
          </button>
        </div>
      </div>

      {notice && (() => {
        const msg = notice === "__CMS_SAVED__" ? t("cms.saved", lang) : notice === "__CMS_ERROR_SAVE__" ? t("cms.errorSave", lang) : notice === "__CMS_ERROR_CONN__" ? t("cms.errorConnection", lang) : notice;
        const isSuccess = notice === "__CMS_SAVED__";
        return (
          <div className={`mt-6 border-l-4 px-4 py-3 text-sm ${isSuccess ? "border-emerald-500/60 text-emerald-200" : "border-red-500/60 text-red-200"}`} style={{ background: "var(--black-rich)" }}>
            {msg}
          </div>
        );
      })()}

      {/* Alert bar management */}
      {(() => {
        const alert = content.alert as { active: boolean; text: string; text_en: string } | undefined;
        const isActive = alert?.active ?? false;
        return (
          <div className="mt-8 card-panel overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-white" />
                <span className="text-lg font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
                  {lang === "cs" ? "Upozorňovací pruh" : "Alert bar"}
                </span>
              </div>
              {isActive ? (
                <button type="button" onClick={() => updateValue(["alert", "active"], false)}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wide transition"
                  style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
                  {lang === "cs" ? "Odstranit upozornění" : "Remove alert"}
                </button>
              ) : (
                <button type="button" onClick={() => updateValue(["alert", "active"], true)}
                  className="btn-primary flex items-center gap-2" style={{ padding: "8px 16px", fontSize: "12px" }}>
                  <Plus className="h-3.5 w-3.5" />
                  {lang === "cs" ? "Přidat upozornění" : "Add alert"}
                </button>
              )}
            </div>
            {isActive && (
              <div className="border-t px-6 py-5 space-y-4" style={{ borderColor: "var(--black-border)" }}>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--gold)", letterSpacing: "0.15em" }}>
                    🇨🇿 {lang === "cs" ? "Text upozornění (česky)" : "Alert text (Czech)"}
                  </label>
                  <input type="text" className="cms-input mt-1" value={alert?.text ?? ""}
                    onChange={(e) => updateValue(["alert", "text"], e.target.value)}
                    placeholder={lang === "cs" ? "Např.: O svátcích máme zavřeno" : "E.g.: We are closed on holidays"} />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--gold)", letterSpacing: "0.15em" }}>
                    🇬🇧 {lang === "cs" ? "Text upozornění (anglicky)" : "Alert text (English)"}
                  </label>
                  <input type="text" className="cms-input mt-1" value={alert?.text_en ?? ""}
                    onChange={(e) => updateValue(["alert", "text_en"], e.target.value)}
                    placeholder={lang === "cs" ? "Anglický překlad (volitelné)" : "English translation (optional)"} />
                </div>
                {alert?.text && (
                  <div style={{ background: "linear-gradient(90deg, #c9a84c 0%, #e2c97e 50%, #c9a84c 100%)", color: "#0e0e0e", fontSize: "13px", fontWeight: 600, textAlign: "center", padding: "9px 16px", lineHeight: 1.4, letterSpacing: "0.03em" }}>
                    ⚠ {alert.text}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Homepage mode + banner management */}
      {(() => {
        const settings = content.homepage_settings as { mode?: string; banners?: { imageUrl: string; linkUrl?: string; alt?: string }[] } | undefined;
        const currentMode = settings?.mode || "default";
        const banners = settings?.banners || [];

        return (
          <div className="mt-8 card-panel overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <Monitor className="h-5 w-5 text-white" />
                <span className="text-lg font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
                  {lang === "cs" ? "Režim úvodní stránky" : "Homepage Mode"}
                </span>
              </div>
            </div>
            <div className="border-t px-6 py-5 space-y-6" style={{ borderColor: "var(--black-border)" }}>
              {/* Mode toggle */}
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide mb-3" style={{ color: "var(--gold)", letterSpacing: "0.15em" }}>
                  {lang === "cs" ? "Verze homepage" : "Homepage version"}
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => updateValue(["homepage_settings", "mode"], "default")}
                    className="flex-1 px-4 py-3 text-sm font-semibold transition"
                    style={{
                      background: currentMode === "default" ? "rgba(201,168,76,0.15)" : "var(--black-rich)",
                      color: currentMode === "default" ? "var(--gold)" : "var(--cream-muted)",
                      border: currentMode === "default" ? "2px solid var(--gold)" : "1px solid var(--black-border)",
                    }}
                  >
                    {lang === "cs" ? "📋 Klasická verze (doporučené vozy)" : "📋 Default (featured vehicles)"}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateValue(["homepage_settings", "mode"], "slider")}
                    className="flex-1 px-4 py-3 text-sm font-semibold transition"
                    style={{
                      background: currentMode === "slider" ? "rgba(201,168,76,0.15)" : "var(--black-rich)",
                      color: currentMode === "slider" ? "var(--gold)" : "var(--cream-muted)",
                      border: currentMode === "slider" ? "2px solid var(--gold)" : "1px solid var(--black-border)",
                    }}
                  >
                    {lang === "cs" ? "🖼️ Bannerový slider (16:5)" : "🖼️ Banner slider (16:5)"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-secondary">
                  {currentMode === "slider"
                    ? (lang === "cs" ? "Úvodní stránka zobrazí fullwidth slider s reklamními bannery (poměr stran 16:5)." : "Homepage shows a fullwidth banner slider (16:5 aspect ratio).")
                    : (lang === "cs" ? "Úvodní stránka zobrazí klasický hero s doporučenými vozy." : "Homepage shows the classic hero section with featured vehicles.")}
                </p>
              </div>

              {/* Banner management */}
              {currentMode === "slider" && (
                <div>
                  <label className="block text-xs font-medium uppercase tracking-wide mb-3" style={{ color: "var(--gold)", letterSpacing: "0.15em" }}>
                    <ImageIcon className="inline h-3.5 w-3.5 mr-1" />
                    {lang === "cs" ? "Bannery (doporučený poměr stran 16:5)" : "Banners (recommended aspect ratio 16:5)"}
                  </label>
                  <div className="space-y-4">
                    {banners.map((banner, idx) => (
                      <div key={idx} className="relative border p-4 space-y-3" style={{ borderColor: "var(--black-border)", background: "var(--black-rich)" }}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-secondary font-medium">
                            Banner #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const newBanners = [...banners];
                              newBanners.splice(idx, 1);
                              updateValue(["homepage_settings", "banners"], newBanners);
                            }}
                            className="p-1 text-red-400 hover:text-red-300 transition"
                            title={lang === "cs" ? "Odstranit" : "Remove"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div>
                          <label className="block text-xs text-secondary">
                            {lang === "cs" ? "Obrázek banneru" : "Banner image"} *
                          </label>
                          <div className="flex gap-2 mt-1">
                            <input
                              type="text"
                              className="cms-input flex-1"
                              value={banner.imageUrl}
                              onChange={(e) => updateValue(["homepage_settings", "banners", String(idx), "imageUrl"], e.target.value)}
                              placeholder="https://example.com/banner.jpg"
                            />
                            <label
                              className="flex items-center gap-1 px-3 py-2 text-xs font-semibold cursor-pointer transition hover:opacity-80 whitespace-nowrap"
                              style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold)", border: "1px solid var(--gold)" }}
                            >
                              <ImageIcon className="h-3.5 w-3.5" />
                              {lang === "cs" ? "Nahrát z počítače" : "Upload from PC"}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const form = new FormData();
                                  form.append("file", file);
                                  try {
                                    const res = await fetch("/api/upload", { method: "POST", body: form });
                                    const data = await res.json().catch(() => null);
                                    if (!res.ok) {
                                      throw new Error(
                                        typeof data?.error === "string"
                                          ? data.error
                                          : lang === "cs"
                                            ? "Nahrání se nezdařilo."
                                            : "Upload failed."
                                      );
                                    }
                                    updateValue(["homepage_settings", "banners", String(idx), "imageUrl"], data.url);
                                  } catch (error) {
                                    alert(error instanceof Error ? error.message : (lang === "cs" ? "Nahrání se nezdařilo." : "Upload failed."));
                                  }
                                  e.target.value = "";
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-secondary">
                            {lang === "cs" ? "Odkaz (volitelné, kam banner vede po kliknutí)" : "Link URL (optional, where banner leads on click)"}
                          </label>
                          <input
                            type="text"
                            className="cms-input mt-1"
                            value={banner.linkUrl || ""}
                            onChange={(e) => updateValue(["homepage_settings", "banners", String(idx), "linkUrl"], e.target.value)}
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-secondary">
                            {lang === "cs" ? "Popisek (alt text pro SEO)" : "Alt text (for SEO)"}
                          </label>
                          <input
                            type="text"
                            className="cms-input mt-1"
                            value={banner.alt || ""}
                            onChange={(e) => updateValue(["homepage_settings", "banners", String(idx), "alt"], e.target.value)}
                            placeholder={lang === "cs" ? "Popis banneru" : "Banner description"}
                          />
                        </div>
                        {banner.imageUrl && (
                          <div style={{ marginTop: "8px", aspectRatio: "16 / 5", position: "relative", overflow: "hidden", border: "1px solid var(--black-border)", background: "#000" }}>
                            <img
                              src={banner.imageUrl}
                              alt={banner.alt || `Banner ${idx + 1}`}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newBanners = [...banners, { imageUrl: "", linkUrl: "", alt: "" }];
                        updateValue(["homepage_settings", "banners"], newBanners);
                      }}
                      className="flex items-center gap-1 text-xs font-medium transition hover:opacity-80"
                      style={{ color: "var(--gold)" }}
                    >
                      <Plus className="h-3 w-3" /> {lang === "cs" ? "Přidat banner" : "Add banner"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Sections */}
      <div className="mt-8 space-y-3">
        {PAGE_SECTIONS.map((section) => {
          const isOpen = expandedSection === section.key;
          const pageData = content[section.key] as Record<string, unknown> | undefined;
          if (!pageData) return null;

          const baseKey = getBaseKey(section.key);
          const blockDefs = PAGE_BLOCKS[baseKey];
          const hasBlocks = !!blockDefs;

          return (
            <div key={section.key} className="card-panel overflow-hidden">
              <button
                onClick={() => setExpandedSection(isOpen ? "" : section.key)}
                className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:opacity-80"
              >
                <div className="flex items-center gap-3">
                  {hasBlocks && <Layers className="h-4 w-4 text-secondary" />}
                  <span className="text-lg font-semibold text-white" style={{ fontFamily: "var(--font-display)" }}>
                    {section.label}
                  </span>
                  {hasBlocks && (
                    <span className="text-xs px-2 py-0.5"
                      style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold)", border: "1px solid rgba(201,168,76,0.25)" }}>
                      {getLayout(section.key).length} {lang === "cs" ? "bloků" : "blocks"}
                    </span>
                  )}
                </div>
                {isOpen ? <ChevronDown className="h-5 w-5 text-secondary" /> : <ChevronRight className="h-5 w-5 text-secondary" />}
              </button>

              {isOpen && (
                <div className="border-t px-6 py-6" style={{ borderColor: "var(--black-border)" }}>
                  {hasBlocks
                    ? renderBlockManager(section.key, pageData, blockDefs, getLayout(section.key), expandedBlock, setExpandedBlock, moveBlock, hideBlock, showBlock, updateValue, addArrayItem, removeArrayItem, lang)
                    : <div className="space-y-6">{renderPageFields(section.key, pageData, [section.key], updateValue, addArrayItem, removeArrayItem, lang)}</div>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating save */}
      <div className="fixed bottom-6 right-6 z-50">
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 shadow-lg" style={{ padding: "12px 24px" }}>
          <Save className="h-4 w-4" />
          {saving ? t("cms.saving", lang) : t("cms.save", lang)}
        </button>
      </div>
    </div>
  );
}

/* ==================================================================
   BLOCK MANAGER
   ================================================================== */
function renderBlockManager(
  sectionKey: string,
  pageData: Record<string, unknown>,
  blockDefs: BlockDef[],
  layout: string[],
  expandedBlock: string,
  setExpandedBlock: (key: string) => void,
  moveBlock: (sectionKey: string, blockKey: string, direction: "up" | "down") => void,
  hideBlock: (sectionKey: string, blockKey: string) => void,
  showBlock: (sectionKey: string, blockKey: string) => void,
  updateValue: (path: string[], value: unknown) => void,
  addArrayItem: (path: string[], template: unknown) => void,
  removeArrayItem: (path: string[], index: number) => void,
  lang: "cs" | "en",
) {
  const hiddenBlocks = blockDefs.filter((b) => !layout.includes(b.key));

  const blockFieldKeys = new Set<string>(["_layout"]);
  for (const bd of blockDefs) {
    if (bd.fields) bd.fields.forEach((f) => blockFieldKeys.add(f));
    else blockFieldKeys.add(bd.key);
  }
  const otherKeys = Object.keys(pageData).filter((k) => !blockFieldKeys.has(k));

  return (
    <div className="space-y-3">
      {layout.map((blockKey, idx) => {
        const blockDef = blockDefs.find((b) => b.key === blockKey);
        if (!blockDef) return null;
        const blockLabel = lang === "cs" ? blockDef.cs : blockDef.en;
        const bId = `${sectionKey}:${blockKey}`;
        const isExpanded = expandedBlock === bId;

        return (
          <div key={blockKey} className="overflow-hidden" style={{ border: "1px solid var(--black-border)", background: "var(--black-rich)" }}>
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: isExpanded ? "1px solid var(--black-border)" : "none" }}>
              <GripVertical className="h-4 w-4 text-secondary flex-shrink-0" />
              <span className="flex h-6 w-6 items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: "var(--gold)", color: "var(--black)" }}>
                {idx + 1}
              </span>
              <button onClick={() => setExpandedBlock(isExpanded ? "" : bId)}
                className="flex-1 text-left text-sm font-semibold text-white hover:opacity-80 transition">
                {blockLabel}
              </button>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button type="button" title={t("cms.moveUp", lang)} onClick={() => moveBlock(sectionKey, blockKey, "up")} disabled={idx === 0}
                  className="p-1.5 text-secondary hover:text-white transition disabled:opacity-25">
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" title={t("cms.moveDown", lang)} onClick={() => moveBlock(sectionKey, blockKey, "down")} disabled={idx === layout.length - 1}
                  className="p-1.5 text-secondary hover:text-white transition disabled:opacity-25">
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button type="button" title={t("cms.hideBlock", lang)} onClick={() => hideBlock(sectionKey, blockKey)}
                  className="p-1.5 text-secondary hover:text-red-400 transition">
                  <EyeOff className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setExpandedBlock(isExpanded ? "" : bId)}
                  className="p-1.5 text-secondary hover:text-white transition">
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="px-5 py-5 space-y-5">
                {renderBlockFields(sectionKey, pageData, blockDef, updateValue, addArrayItem, removeArrayItem, lang)}
              </div>
            )}
          </div>
        );
      })}

      {hiddenBlocks.length > 0 && (
        <div className="mt-4 p-4" style={{ border: "1px dashed var(--black-border)", background: "rgba(10,10,10,0.3)" }}>
          <div className="flex items-center gap-2 mb-3">
            <EyeOff className="h-4 w-4 text-secondary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
              {t("cms.hiddenBlocks", lang)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {hiddenBlocks.map((block) => (
              <button key={block.key} type="button" onClick={() => showBlock(sectionKey, block.key)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition hover:opacity-80"
                style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", color: "var(--gold)" }}>
                <Plus className="h-3 w-3" />
                {lang === "cs" ? block.cs : block.en}
              </button>
            ))}
          </div>
        </div>
      )}

      {otherKeys.length > 0 && (
        <div className="mt-4 border p-4 space-y-4" style={{ borderColor: "var(--black-border)" }}>
          <span className="text-xs font-semibold uppercase tracking-wide text-secondary">
            {t("cms.otherFields", lang)}
          </span>
          {renderPageFields(sectionKey, Object.fromEntries(otherKeys.map((k) => [k, pageData[k]])), [sectionKey], updateValue, addArrayItem, removeArrayItem, lang)}
        </div>
      )}
    </div>
  );
}

/* ==================================================================
   RENDER BLOCK FIELDS
   ================================================================== */
function renderBlockFields(
  sectionKey: string,
  pageData: Record<string, unknown>,
  blockDef: BlockDef,
  updateValue: (path: string[], value: unknown) => void,
  addArrayItem: (path: string[], template: unknown) => void,
  removeArrayItem: (path: string[], index: number) => void,
  lang: "cs" | "en",
) {
  if (blockDef.fields) {
    return blockDef.fields.map((fieldKey) => {
      const value = pageData[fieldKey];
      if (value === undefined) return null;
      return renderSingleField(fieldKey, value, [sectionKey], updateValue, addArrayItem, removeArrayItem, lang);
    });
  }

  const value = pageData[blockDef.key];
  if (value === undefined) return <p className="text-xs text-secondary italic">—</p>;

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return renderPageFields(sectionKey, value as Record<string, unknown>, [sectionKey, blockDef.key], updateValue, addArrayItem, removeArrayItem, lang);
  }

  return renderSingleField(blockDef.key, value, [sectionKey], updateValue, addArrayItem, removeArrayItem, lang);
}

/* ==================================================================
   FIELD LABEL
   ================================================================== */
function fieldLabel(key: string, lang: "cs" | "en"): string {
  const translated = t(`field.${key}`, lang);
  return translated !== `field.${key}` ? translated : key;
}

/* ==================================================================
   RENDER SINGLE FIELD
   ================================================================== */
function renderSingleField(
  key: string,
  value: unknown,
  parentPath: string[],
  updateValue: (path: string[], value: unknown) => void,
  addArrayItem: (path: string[], template: unknown) => void,
  removeArrayItem: (path: string[], index: number) => void,
  lang: "cs" | "en",
): React.ReactNode {
  const currentPath = [...parentPath, key];

  if (typeof value === "string") {
    const isLong = value.length > 80;
    return (
      <div key={key}>
        <label className="block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--gold)", letterSpacing: "0.15em" }}>
          {fieldLabel(key, lang)}
        </label>
        {isLong ? (
          <textarea className="cms-input mt-1" rows={3} value={value} onChange={(e) => updateValue(currentPath, e.target.value)} />
        ) : (
          <input type="text" className="cms-input mt-1" value={value} onChange={(e) => updateValue(currentPath, e.target.value)} />
        )}
      </div>
    );
  }

  if (Array.isArray(value) && (value.length === 0 || typeof value[0] === "string")) {
    return (
      <div key={key}>
        <label className="block text-xs font-medium uppercase tracking-wide" style={{ color: "var(--gold)", letterSpacing: "0.15em" }}>
          {fieldLabel(key, lang)}
        </label>
        <div className="mt-2 space-y-2">
          {(value as string[]).map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input type="text" className="cms-input flex-1" value={item} onChange={(e) => {
                const newArr = [...value];
                newArr[idx] = e.target.value;
                updateValue(currentPath, newArr);
              }} />
              <button type="button" onClick={() => removeArrayItem(currentPath, idx)} className="p-2 text-red-400 hover:text-red-300 transition" title={t("cms.remove", lang)}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => updateValue(currentPath, [...value, ""])}
            className="flex items-center gap-1 text-xs font-medium transition hover:opacity-80" style={{ color: "var(--gold)" }}>
            <Plus className="h-3 w-3" /> {t("cms.addItem", lang)}
          </button>
        </div>
      </div>
    );
  }

  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
    const template = Object.fromEntries(Object.keys(value[0] as Record<string, unknown>).map((k) => [k, ""]));
    return (
      <div key={key}>
        <label className="block text-xs font-medium uppercase tracking-wide mb-2" style={{ color: "var(--gold)", letterSpacing: "0.15em" }}>
          {fieldLabel(key, lang)}
        </label>
        <div className="space-y-4">
          {value.map((item: Record<string, unknown>, idx: number) => (
            <div key={idx} className="relative border p-4 space-y-3" style={{ borderColor: "var(--black-border)", background: "var(--black-rich)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-secondary font-medium">#{idx + 1}</span>
                <button type="button" onClick={() => removeArrayItem(currentPath, idx)}
                  className="p-1 text-red-400 hover:text-red-300 transition" title={t("cms.remove", lang)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {Object.entries(item).map(([itemKey, itemValue]) => {
                if (typeof itemValue !== "string") return null;
                // Hide internal fields that are not user-editable
                if (itemKey === "icon") return null;
                const isLong = itemValue.length > 80;
                return (
                  <div key={itemKey}>
                    <label className="block text-xs text-secondary">{fieldLabel(itemKey, lang)}</label>
                    {isLong ? (
                      <textarea className="cms-input mt-1" rows={2} value={itemValue}
                        onChange={(e) => updateValue([...currentPath, String(idx), itemKey], e.target.value)} />
                    ) : (
                      <input type="text" className="cms-input mt-1" value={itemValue}
                        onChange={(e) => updateValue([...currentPath, String(idx), itemKey], e.target.value)} />
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          <button type="button" onClick={() => addArrayItem(currentPath, template)}
            className="flex items-center gap-1 text-xs font-medium transition hover:opacity-80" style={{ color: "var(--gold)" }}>
            <Plus className="h-3 w-3" /> {t("cms.addItem", lang)}
          </button>
        </div>
      </div>
    );
  }

  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return (
      <fieldset key={key} className="border p-4 space-y-4" style={{ borderColor: "var(--black-border)" }}>
        <legend className="px-2 text-sm font-semibold text-white">{fieldLabel(key, lang)}</legend>
        {renderPageFields(key, value as Record<string, unknown>, currentPath, updateValue, addArrayItem, removeArrayItem, lang)}
      </fieldset>
    );
  }

  return null;
}

/* ==================================================================
   RENDER PAGE FIELDS — iterates all keys (flat mode for inventory/footer)
   ================================================================== */
function renderPageFields(
  pageKey: string,
  data: Record<string, unknown>,
  path: string[],
  updateValue: (path: string[], value: unknown) => void,
  addArrayItem: (path: string[], template: unknown) => void,
  removeArrayItem: (path: string[], index: number) => void,
  lang: "cs" | "en",
) {
  return Object.entries(data)
    .filter(([key]) => key !== "_layout")
    .map(([key, value]) => renderSingleField(key, value, path, updateValue, addArrayItem, removeArrayItem, lang));
}
